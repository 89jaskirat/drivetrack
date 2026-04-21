import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { expenseCategories } from '../data/seed';
import { supabase } from '../lib/supabase';
import {
  pullAll,
  pushRow,
  deleteRow,
  incrementVote,
  upsertProfile,
  setSyncErrorHandler,
} from '../services/syncService';
import { initActivityTracking, setActivityUserId, stopActivityTracking } from '../services/activityService';
import { audit, auditLogin, auditLogout, initAuditService, setAuditUserId, stopAuditService } from '../services/auditService';
import {
  AppState,
  EarningsLog,
  ExpenseLog,
  ForumComment,
  ForumPost,
  FuelLog,
  MileageLog,
  RecurringExpense,
  ShiftSession,
  Units,
  UserProfile,
} from '../types';

const STORAGE_KEY = 'uber-driver-companion-local-v3';

// ── Empty initial state (no dummy data) ──────────────────────────────────────
const emptyState: AppState = {
  signedIn: false,
  profile: {
    name: '',
    phone: '',
    email: '',
    role: 'driver',
    zone: 'Calgary',
  },
  gpsConsent: false,
  units: 'metric',
  mileage: [],
  fuel: [],
  expenses: [],
  earnings: [],
  recurringExpenses: [],
  posts: [],
  gas: [],
  deals: [],
  articles: [],    // Knowledge articles are bundled in-app, loaded separately
  currentShift: null,
  shifts: [],
  recurringAppliedMonths: [],
};

// Knowledge articles are static content — keep them bundled
import { seedState } from '../data/seed';
const BUNDLED_ARTICLES = seedState.articles;

type AppStateContextValue = {
  ready: boolean;
  state: AppState;
  analytics: {
    km: number;
    earnings: number;
    fuelCost: number;
    expenseCost: number;
    profit: number;
    fuelPer100: number;
    earningsPerKm: number;
  };
  signIn: (profile?: Partial<UserProfile>) => void;
  cloudSignIn: (userId: string, email: string, name: string) => Promise<void>;
  signOutCloud: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setUnits: (units: Units) => void;
  setGpsConsent: (value: boolean) => void;
  addMileage: (input: Omit<MileageLog, 'id'>) => void;
  addFuel: (input: Omit<FuelLog, 'id'>) => void;
  addExpense: (input: Omit<ExpenseLog, 'id'>) => void;
  addEarnings: (input: Omit<EarningsLog, 'id'>) => void;
  addPost: (input: Pick<ForumPost, 'title' | 'body' | 'link' | 'imageUri'>) => void;
  addComment: (postId: string, body: string) => void;
  addReply: (postId: string, commentId: string, body: string) => void;
  votePost: (postId: string, delta: number) => void;
  voteComment: (postId: string, commentId: string, delta: number, replyId?: string) => void;
  startShift: (odo: number) => void;
  endShift: (odo: number, earnings: number) => void;
  addRecurringExpense: (input: Omit<RecurringExpense, 'id'>) => void;
  updateRecurringExpense: (id: string, input: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => void;
  applyRecurringExpenses: () => void;
  trackingCategories: typeof expenseCategories;
  refreshFromCloud: () => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

// Generate proper UUIDs that match the Supabase uuid column type
const makeId = () => Crypto.randomUUID();

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({ ...emptyState, articles: BUNDLED_ARTICLES });
  const [ready, setReady] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  // Use ref so sync closures always see the latest userId without re-creating
  const userIdRef = useRef<string | null>(null);
  useEffect(() => { userIdRef.current = supabaseUserId; }, [supabaseUserId]);

  // ── Sync error handler — show Alert to user ───────────────────────────────
  useEffect(() => {
    setSyncErrorHandler((msg) => {
      // Show a non-blocking alert so the user knows sync failed
      Alert.alert('Sync issue', msg, [{ text: 'OK' }]);
    });
  }, []);

  // ── Startup: load local cache, then check for existing Supabase session ────
  useEffect(() => {
    async function init() {
      // 1. Load local AsyncStorage cache first (fast, offline-friendly)
      const saved = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        setState({
          ...emptyState,
          ...parsed,
          articles: BUNDLED_ARTICLES,
          currentShift: parsed.currentShift ?? null,
        });
      }

      // 2. Check if user has an existing Supabase session (e.g. reopened app)
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (data.session?.user) {
        const uid = data.session.user.id;
        setSupabaseUserId(uid);
        userIdRef.current = uid;
        // Init tracking services
        initActivityTracking(uid);
        initAuditService(uid);
        auditLogin(uid);
        // Pull remote data — remote always wins; empty arrays are valid (new user)
        const remote = await pullAll(uid);
        if (remote) {
          setState((prev) => ({
            ...prev,
            signedIn: true,
            profile: remote.profile
              ? {
                  name: (remote.profile.name as string) || prev.profile.name,
                  phone: (remote.profile.phone as string) || prev.profile.phone,
                  email: (remote.profile.email as string) || prev.profile.email,
                  role: (remote.profile.role as any) || prev.profile.role,
                  zone: (remote.profile.zone as string) || prev.profile.zone,
                  vehicleMake: (remote.profile.vehicle_make as string) || prev.profile.vehicleMake,
                  vehicleModel: (remote.profile.vehicle_model as string) || prev.profile.vehicleModel,
                  vehicleYear: (remote.profile.vehicle_year as number) || prev.profile.vehicleYear,
                }
              : prev.profile,
            // Remote always wins — empty arrays are correct for new users
            mileage: remote.mileage,
            fuel: remote.fuel,
            expenses: remote.expenses,
            earnings: remote.earnings,
            shifts: remote.shifts,
            recurringExpenses: remote.recurringExpenses,
            recurringAppliedMonths: remote.recurringAppliedMonths,
            // Community data from server
            deals: remote.deals,
            posts: remote.posts,
            gas: remote.gas,
          }));
        }
      }

      setReady(true);
    }

    init();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [ready, state]);

  const analytics = useMemo(() => {
    const km = state.mileage.reduce((sum, item) => sum + Math.max(item.end - item.start, 0), 0);
    const fuelCost = state.fuel.reduce((sum, item) => sum + item.cost, 0);
    const fuelLitres = state.fuel.reduce((sum, item) => sum + item.litres, 0);
    const expenseCost = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const earnings = state.earnings.reduce((sum, item) => sum + item.amount, 0);
    const profit = earnings - fuelCost - expenseCost;
    const earningsPerKm = km > 0 ? earnings / km : 0;

    return {
      km,
      earnings,
      fuelCost,
      expenseCost,
      profit,
      fuelPer100: km > 0 ? (fuelLitres / km) * 100 : 0,
      earningsPerKm,
    };
  }, [state.earnings, state.expenses, state.fuel, state.mileage]);

  // ── cloudSignIn: called by AuthScreen after successful Supabase auth ─────────
  const cloudSignIn = useCallback(async (userId: string, email: string, name: string) => {
    setSupabaseUserId(userId);
    userIdRef.current = userId;
    // Init tracking services
    initActivityTracking(userId);
    initAuditService(userId);
    auditLogin(userId);
    // Pull remote data
    const remote = await pullAll(userId);
    setState((prev) => ({
      ...prev,
      signedIn: true,
      profile: {
        ...prev.profile,
        email: email || prev.profile.email,
        name: name || prev.profile.name,
      },
      ...(remote
        ? {
            // Remote always wins — empty arrays are correct for new users
            mileage: remote.mileage,
            fuel: remote.fuel,
            expenses: remote.expenses,
            earnings: remote.earnings,
            shifts: remote.shifts,
            recurringExpenses: remote.recurringExpenses,
            recurringAppliedMonths: remote.recurringAppliedMonths,
            deals: remote.deals,
            posts: remote.posts,
            gas: remote.gas,
          }
        : {}),
    }));
    // Ensure profile row exists in Supabase
    upsertProfile({ id: userId, email, name });
  }, []);

  // ── signOutCloud: clears session and resets to unauthenticated state ─────────
  const signOutCloud = useCallback(async () => {
    auditLogout();
    stopActivityTracking();
    stopAuditService();
    await supabase.auth.signOut().catch(() => undefined);
    setSupabaseUserId(null);
    userIdRef.current = null;
    setActivityUserId(null);
    setAuditUserId(null);
    setState({ ...emptyState, articles: BUNDLED_ARTICLES, signedIn: false });
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  }, []);

  const refreshFromCloud = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    const remote = await pullAll(uid);
    if (!remote) return;
    setState((prev) => ({
      ...prev,
      mileage: remote.mileage,
      fuel: remote.fuel,
      expenses: remote.expenses,
      earnings: remote.earnings,
      shifts: remote.shifts,
      recurringExpenses: remote.recurringExpenses,
      deals: remote.deals,
      posts: remote.posts,
      gas: remote.gas,
    }));
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      ready,
      state,
      analytics,
      cloudSignIn,
      signOutCloud,
      refreshFromCloud,
      signIn: (profile) =>
        setState((current) => ({
          ...current,
          signedIn: true,
          profile: { ...current.profile, ...profile },
        })),
      updateProfile: (profile) => {
        setState((current) => ({
          ...current,
          profile: { ...current.profile, ...profile },
        }));
        const uid = userIdRef.current;
        if (uid) {
          const { vehicleMake, vehicleModel, vehicleYear, supabaseId: _sid, ...rest } = profile as any;
          upsertProfile({
            id: uid,
            ...rest,
            ...(vehicleMake !== undefined && { vehicle_make: vehicleMake }),
            ...(vehicleModel !== undefined && { vehicle_model: vehicleModel }),
            ...(vehicleYear !== undefined && { vehicle_year: vehicleYear }),
          });
        }
      },
      setUnits: (units) => setState((current) => ({ ...current, units })),
      setGpsConsent: (value) => {
        setState((current) => ({ ...current, gpsConsent: value }));
        const uid = userIdRef.current;
        if (uid) {
          upsertProfile({ id: uid, gps_consent: value });
        }
      },

      // ── Mileage ─────────────────────────────────────────────────────────────
      addMileage: (input) => {
        const row = { id: makeId(), ...input };
        setState((current) => ({ ...current, mileage: [row, ...current.mileage] }));
        const uid = userIdRef.current;
        if (uid) {
          pushRow('mileage_logs', {
            id: row.id, user_id: uid, date: row.date,
            start_odo: row.start, end_odo: row.end, is_gig_work: row.isGigWork ?? true,
          });
          audit('create', 'mileage_logs', row.id);
        }
      },

      // ── Fuel ────────────────────────────────────────────────────────────────
      addFuel: (input) => {
        const row = { id: makeId(), ...input };
        setState((current) => ({ ...current, fuel: [row, ...current.fuel] }));
        const uid = userIdRef.current;
        if (uid) {
          pushRow('fuel_logs', {
            id: row.id, user_id: uid, date: row.date,
            litres: row.litres, cost: row.cost, odometer: row.odometer,
            fuel_type: row.fuelType ?? 'Regular',
          });
          audit('create', 'fuel_logs', row.id);
        }
      },

      // ── Expense ─────────────────────────────────────────────────────────────
      addExpense: (input) => {
        const row = { id: makeId(), ...input };
        setState((current) => ({ ...current, expenses: [row, ...current.expenses] }));
        const uid = userIdRef.current;
        if (uid) {
          pushRow('expense_logs', {
            id: row.id, user_id: uid, date: row.date,
            amount: row.amount, category: row.category, note: row.note ?? '',
            receipt_url: row.receiptUri ?? '', hst_amount: row.hstAmount ?? 0,
          });
          audit('create', 'expense_logs', row.id);
        }
      },

      // ── Earnings ────────────────────────────────────────────────────────────
      addEarnings: (input) => {
        const row = { id: makeId(), ...input };
        setState((current) => ({ ...current, earnings: [row, ...current.earnings] }));
        const uid = userIdRef.current;
        if (uid) {
          pushRow('earnings_logs', {
            id: row.id, user_id: uid, date: row.date,
            amount: row.amount, note: row.note ?? '', platform: row.platform ?? 'Uber',
          });
          audit('create', 'earnings_logs', row.id);
        }
      },

      // ── Forum: Post ─────────────────────────────────────────────────────────
      addPost: (input) => {
        const id = makeId();
        setState((current) => {
          const author = current.profile.name;
          const zone = current.profile.zone;
          const tags = [zone.toLowerCase()];
          const uid = userIdRef.current;
          if (uid) {
            pushRow('posts', {
              id, user_id: uid, author_name: author,
              title: input.title, body: input.body ?? '', zone, tags,
              up_votes: 1, down_votes: 0,
            });
            audit('create', 'posts', id);
          }
          return {
            ...current,
            posts: [
              { id, author, title: input.title, body: input.body, link: input.link, imageUri: input.imageUri, votes: 1, comments: [], tags },
              ...current.posts,
            ],
          };
        });
      },

      // ── Forum: Comment ──────────────────────────────────────────────────────
      addComment: (postId, body) => {
        const id = makeId();
        setState((current) => {
          const author = current.profile.name;
          const uid = userIdRef.current;
          if (uid) {
            pushRow('comments', {
              id, post_id: postId, user_id: uid,
              author_name: author, body, up_votes: 0, down_votes: 0,
            });
            audit('create', 'comments', id);
          }
          return {
            ...current,
            posts: current.posts.map((post) =>
              post.id !== postId
                ? post
                : { ...post, comments: [...post.comments, { id, author, body, votes: 0, replies: [] }] },
            ),
          };
        });
      },

      // ── Forum: Reply (pushes to `replies` table) ───────────────────────────
      addReply: (postId, commentId, body) => {
        const id = makeId();
        setState((current) => {
          const author = current.profile.name;
          const uid = userIdRef.current;
          if (uid) {
            // replies.comment_id must reference a top-level comment (FK constraint)
            const rootCommentId = findRootCommentId(current.posts.find((p) => p.id === postId)?.comments ?? [], commentId) ?? commentId;
            pushRow('replies', {
              id, comment_id: rootCommentId, user_id: uid,
              author_name: author, body,
            });
            audit('create', 'replies', id);
          }
          return {
            ...current,
            posts: current.posts.map((post) =>
              post.id !== postId
                ? post
                : {
                    ...post,
                    comments: post.comments.map((comment) =>
                      addReplyToComment(comment, commentId, { id, author, body, votes: 0, replies: [] }),
                    ),
                  },
            ),
          };
        });
      },

      // ── Forum: Votes (now synced!) ─────────────────────────────────────────
      votePost: (postId, delta) => {
        setState((current) => ({
          ...current,
          posts: current.posts.map((post) => (post.id === postId ? { ...post, votes: post.votes + delta } : post)),
        }));
        if (userIdRef.current) {
          incrementVote('posts', postId, delta > 0 ? 'up_votes' : 'down_votes');
        }
      },
      voteComment: (postId, commentId, delta, replyId) => {
        setState((current) => ({
          ...current,
          posts: current.posts.map((post) => {
            if (post.id !== postId) return post;
            return {
              ...post,
              comments: post.comments.map((comment) => updateCommentVotes(comment, commentId, delta, replyId)),
            };
          }),
        }));
        if (userIdRef.current) {
          incrementVote('comments', replyId ?? commentId, delta > 0 ? 'up_votes' : 'down_votes');
        }
      },

      // ── Shifts (now synced!) ───────────────────────────────────────────────
      startShift: (odo) =>
        setState((current) => ({
          ...current,
          currentShift: {
            id: makeId(),
            startTime: new Date().toISOString(),
            startOdo: odo,
          },
        })),
      endShift: (odo, earnings) =>
        setState((current) => {
          if (!current.currentShift) return current;
          const endTime = new Date().toISOString();
          const startMs = new Date(current.currentShift.startTime).getTime();
          const durationMinutes = Math.round((Date.now() - startMs) / 60000);
          const distanceKm = Math.max(odo - current.currentShift.startOdo, 0);
          const completed: ShiftSession = {
            ...current.currentShift,
            endTime,
            endOdo: odo,
            earnings,
            distanceKm,
            durationMinutes,
          };

          const mileageId = makeId();
          const earningsId = makeId();
          const today = new Date().toISOString().slice(0, 10);
          const uid = userIdRef.current;

          // Sync shift, mileage, and earnings
          if (uid) {
            pushRow('shifts', {
              id: completed.id, user_id: uid,
              start_time: completed.startTime, end_time: endTime,
              start_odo: completed.startOdo, end_odo: odo,
              earnings, distance: distanceKm, duration: durationMinutes,
            });
            pushRow('mileage_logs', {
              id: mileageId, user_id: uid, date: today,
              start_odo: current.currentShift.startOdo, end_odo: odo, is_gig_work: true,
            });
            audit('create', 'shifts', completed.id);
            audit('create', 'mileage_logs', mileageId);
            if (earnings > 0) {
              pushRow('earnings_logs', {
                id: earningsId, user_id: uid, date: today,
                amount: earnings, note: `Shift ended — ${distanceKm} km`, platform: 'Uber',
              });
              audit('create', 'earnings_logs', earningsId);
            }
          }

          return {
            ...current,
            currentShift: null,
            shifts: [completed, ...current.shifts],
            mileage: [
              { id: mileageId, date: today, start: current.currentShift.startOdo, end: odo, isGigWork: true },
              ...current.mileage,
            ],
            earnings: earnings > 0
              ? [{ id: earningsId, date: today, amount: earnings, note: `Shift ended — ${distanceKm} km` }, ...current.earnings]
              : current.earnings,
          };
        }),

      // ── Recurring expenses (now synced!) ───────────────────────────────────
      addRecurringExpense: (input) => {
        const row = { id: makeId(), ...input };
        setState((current) => ({ ...current, recurringExpenses: [row, ...current.recurringExpenses] }));
        const uid = userIdRef.current;
        if (uid) {
          pushRow('recurring_expenses', {
            id: row.id, user_id: uid, name: row.name,
            amount: row.amount, category: row.category,
            day_of_month: row.dayOfMonth, active: row.active,
          });
          audit('create', 'recurring_expenses', row.id);
        }
      },
      updateRecurringExpense: (id, input) => {
        setState((current) => ({
          ...current,
          recurringExpenses: current.recurringExpenses.map((re) => (re.id === id ? { ...re, ...input } : re)),
        }));
        const uid = userIdRef.current;
        if (uid) {
          const dbFields: Record<string, unknown> = { id };
          if (input.name !== undefined) dbFields.name = input.name;
          if (input.amount !== undefined) dbFields.amount = input.amount;
          if (input.category !== undefined) dbFields.category = input.category;
          if (input.dayOfMonth !== undefined) dbFields.day_of_month = input.dayOfMonth;
          if (input.active !== undefined) dbFields.active = input.active;
          pushRow('recurring_expenses', { ...dbFields, user_id: uid });
          audit('update', 'recurring_expenses', id);
        }
      },
      deleteRecurringExpense: (id) => {
        setState((current) => ({
          ...current,
          recurringExpenses: current.recurringExpenses.filter((re) => re.id !== id),
        }));
        if (userIdRef.current) {
          deleteRow('recurring_expenses', id);
          audit('delete', 'recurring_expenses', id);
        }
      },
      applyRecurringExpenses: () =>
        setState((current) => {
          const monthStr = new Date().toISOString().slice(0, 7);
          if (current.recurringAppliedMonths.includes(monthStr)) return current;
          const today = new Date().toISOString().slice(0, 10);
          const uid = userIdRef.current;
          const newExpenses = current.recurringExpenses
            .filter((re) => re.active)
            .map((re) => {
              const id = makeId();
              // Sync each generated expense
              if (uid) {
                pushRow('expense_logs', {
                  id, user_id: uid, date: today,
                  amount: re.amount, category: re.category,
                  note: `Recurring: ${re.name}`, receipt_url: '', hst_amount: 0,
                });
              }
              return { id, date: today, amount: re.amount, category: re.category, note: `Recurring: ${re.name}` };
            });
          // Sync the applied month
          if (uid) {
            pushRow('recurring_applied_months', { id: makeId(), user_id: uid, month_key: monthStr });
          }
          return {
            ...current,
            expenses: [...newExpenses, ...current.expenses],
            recurringAppliedMonths: [...current.recurringAppliedMonths, monthStr],
          };
        }),
      trackingCategories: expenseCategories,
    }),
    [analytics, cloudSignIn, signOutCloud, refreshFromCloud, ready, state],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// Find the top-level comment ID that contains targetId (may be targetId itself)
function findRootCommentId(comments: ForumComment[], targetId: string): string | null {
  for (const comment of comments) {
    if (comment.id === targetId) return comment.id;
    if (commentContainsId(comment, targetId)) return comment.id;
  }
  return null;
}
function commentContainsId(comment: ForumComment, targetId: string): boolean {
  return (comment.replies ?? []).some((r) => r.id === targetId || commentContainsId(r, targetId));
}

function addReplyToComment(comment: ForumComment, targetId: string, reply: ForumComment): ForumComment {
  if (comment.id === targetId) {
    return { ...comment, replies: [...(comment.replies ?? []), reply] };
  }
  if (comment.replies?.length) {
    return { ...comment, replies: comment.replies.map((r) => addReplyToComment(r, targetId, reply)) };
  }
  return comment;
}

function updateCommentVotes(comment: ForumComment, commentId: string, delta: number, replyId?: string): ForumComment {
  if (replyId && comment.replies) {
    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === replyId ? { ...reply, votes: reply.votes + delta } : reply,
      ),
    };
  }

  if (comment.id === commentId) {
    return { ...comment, votes: comment.votes + delta };
  }

  return comment;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return context;
}
