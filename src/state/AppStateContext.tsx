import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { expenseCategories, seedState } from '../data/seed';
import { supabase } from '../lib/supabase';
import { pullAll, pushRow, deleteRow, upsertProfile } from '../services/syncService';
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

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(seedState);
  const [ready, setReady] = useState(false);
  // Track the Supabase user id so sync functions can use it
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  // ── Startup: load local cache, then check for existing Supabase session ────
  useEffect(() => {
    async function init() {
      // 1. Load local AsyncStorage cache first (fast, offline-friendly)
      const saved = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        setState({
          ...seedState,
          ...parsed,
          earnings: parsed.earnings ?? seedState.earnings,
          currentShift: parsed.currentShift ?? null,
          shifts: parsed.shifts ?? [],
          deals: seedState.deals,
          articles: seedState.articles,
          recurringExpenses: parsed.recurringExpenses ?? seedState.recurringExpenses,
          recurringAppliedMonths: parsed.recurringAppliedMonths ?? [],
        });
      }

      // 2. Check if user has an existing Supabase session (e.g. reopened app)
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (data.session?.user) {
        const uid = data.session.user.id;
        setSupabaseUserId(uid);
        // Pull remote data and merge — remote wins on conflicts
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
            mileage: remote.mileage.length ? remote.mileage : prev.mileage,
            fuel: remote.fuel.length ? remote.fuel : prev.fuel,
            expenses: remote.expenses.length ? remote.expenses : prev.expenses,
            earnings: remote.earnings.length ? remote.earnings : prev.earnings,
            shifts: remote.shifts.length ? remote.shifts : prev.shifts,
            recurringExpenses: remote.recurringExpenses.length ? remote.recurringExpenses : prev.recurringExpenses,
            recurringAppliedMonths: remote.recurringAppliedMonths.length
              ? remote.recurringAppliedMonths
              : prev.recurringAppliedMonths,
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
            mileage: remote.mileage.length ? remote.mileage : prev.mileage,
            fuel: remote.fuel.length ? remote.fuel : prev.fuel,
            expenses: remote.expenses.length ? remote.expenses : prev.expenses,
            earnings: remote.earnings.length ? remote.earnings : prev.earnings,
            shifts: remote.shifts.length ? remote.shifts : prev.shifts,
            recurringExpenses: remote.recurringExpenses.length ? remote.recurringExpenses : prev.recurringExpenses,
            recurringAppliedMonths: remote.recurringAppliedMonths.length
              ? remote.recurringAppliedMonths
              : prev.recurringAppliedMonths,
          }
        : {}),
    }));
    // Ensure profile row exists in Supabase
    upsertProfile({ id: userId, email, name });
  }, []);

  // ── signOutCloud: clears session and resets to unauthenticated state ─────────
  const signOutCloud = useCallback(async () => {
    await supabase.auth.signOut().catch(() => undefined);
    setSupabaseUserId(null);
    setState({ ...seedState, signedIn: false });
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  }, []);

  const refreshFromCloud = useCallback(async () => {
    if (!supabaseUserId) return;
    const remote = await pullAll(supabaseUserId);
    if (!remote) return;
    setState((prev) => ({
      ...prev,
      mileage: remote.mileage.length ? remote.mileage : prev.mileage,
      fuel: remote.fuel.length ? remote.fuel : prev.fuel,
      expenses: remote.expenses.length ? remote.expenses : prev.expenses,
      earnings: remote.earnings.length ? remote.earnings : prev.earnings,
      shifts: remote.shifts.length ? remote.shifts : prev.shifts,
      recurringExpenses: remote.recurringExpenses.length ? remote.recurringExpenses : prev.recurringExpenses,
    }));
  }, [supabaseUserId]);

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
        if (supabaseUserId) {
          const { vehicleMake, vehicleModel, vehicleYear, supabaseId: _sid, ...rest } = profile as any;
          upsertProfile({
            id: supabaseUserId,
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
        if (supabaseUserId) {
          upsertProfile({ id: supabaseUserId, gps_consent: value });
        }
      },
      addMileage: (input) => {
        const row = { id: makeId('m'), ...input };
        setState((current) => ({ ...current, mileage: [row, ...current.mileage] }));
        if (supabaseUserId) {
          pushRow('mileage_logs', {
            id: row.id, user_id: supabaseUserId, date: row.date,
            start_odo: row.start, end_odo: row.end, is_gig_work: row.isGigWork ?? true,
          });
        }
      },
      addFuel: (input) => {
        const row = { id: makeId('f'), ...input };
        setState((current) => ({ ...current, fuel: [row, ...current.fuel] }));
        if (supabaseUserId) {
          pushRow('fuel_logs', {
            id: row.id, user_id: supabaseUserId, date: row.date,
            litres: row.litres, cost: row.cost, odometer: row.odometer,
            fuel_type: row.fuelType ?? 'Regular',
          });
        }
      },
      addExpense: (input) => {
        const row = { id: makeId('e'), ...input };
        setState((current) => ({ ...current, expenses: [row, ...current.expenses] }));
        if (supabaseUserId) {
          pushRow('expense_logs', {
            id: row.id, user_id: supabaseUserId, date: row.date,
            amount: row.amount, category: row.category, note: row.note ?? '',
            receipt_url: row.receiptUri ?? '', hst_amount: row.hstAmount ?? 0,
          });
        }
      },
      addEarnings: (input) => {
        const row = { id: makeId('earn'), ...input };
        setState((current) => ({ ...current, earnings: [row, ...current.earnings] }));
        if (supabaseUserId) {
          pushRow('earnings_logs', {
            id: row.id, user_id: supabaseUserId, date: row.date,
            amount: row.amount, note: row.note ?? '', platform: row.platform ?? 'Uber',
          });
        }
      },
      addPost: (input) =>
        setState((current) => ({
          ...current,
          posts: [
            {
              id: makeId('p'),
              author: current.profile.name,
              title: input.title,
              body: input.body,
              link: input.link,
              imageUri: input.imageUri,
              votes: 1,
              comments: [],
              tags: [current.profile.zone.toLowerCase()],
            },
            ...current.posts,
          ],
        })),
      addComment: (postId, body) =>
        setState((current) => ({
          ...current,
          posts: current.posts.map((post) =>
            post.id !== postId
              ? post
              : {
                  ...post,
                  comments: [
                    ...post.comments,
                    {
                      id: makeId('c'),
                      author: current.profile.name,
                      body,
                      votes: 0,
                      replies: [],
                    },
                  ],
                },
          ),
        })),
      addReply: (postId, commentId, body) =>
        setState((current) => ({
          ...current,
          posts: current.posts.map((post) =>
            post.id !== postId
              ? post
              : {
                  ...post,
                  comments: post.comments.map((comment) =>
                    addReplyToComment(comment, commentId, {
                      id: makeId('c'),
                      author: current.profile.name,
                      body,
                      votes: 0,
                      replies: [],
                    }),
                  ),
                },
          ),
        })),
      startShift: (odo) =>
        setState((current) => ({
          ...current,
          currentShift: {
            id: makeId('shift'),
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
          return {
            ...current,
            currentShift: null,
            shifts: [completed, ...current.shifts],
            mileage: [
              {
                id: makeId('m'),
                date: new Date().toISOString().slice(0, 10),
                start: current.currentShift.startOdo,
                end: odo,
                isGigWork: true,
              },
              ...current.mileage,
            ],
            earnings: earnings > 0
              ? [
                  {
                    id: makeId('earn'),
                    date: new Date().toISOString().slice(0, 10),
                    amount: earnings,
                    note: `Shift ended — ${distanceKm} km`,
                  },
                  ...current.earnings,
                ]
              : current.earnings,
          };
        }),
      addRecurringExpense: (input) =>
        setState((current) => ({
          ...current,
          recurringExpenses: [{ id: makeId('re'), ...input }, ...current.recurringExpenses],
        })),
      updateRecurringExpense: (id, input) =>
        setState((current) => ({
          ...current,
          recurringExpenses: current.recurringExpenses.map((re) =>
            re.id === id ? { ...re, ...input } : re,
          ),
        })),
      deleteRecurringExpense: (id) =>
        setState((current) => ({
          ...current,
          recurringExpenses: current.recurringExpenses.filter((re) => re.id !== id),
        })),
      applyRecurringExpenses: () =>
        setState((current) => {
          const monthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
          if (current.recurringAppliedMonths.includes(monthStr)) return current;
          const today = new Date().toISOString().slice(0, 10);
          const newExpenses = current.recurringExpenses
            .filter((re) => re.active)
            .map((re) => ({
              id: makeId('e'),
              date: today,
              amount: re.amount,
              category: re.category,
              note: `Recurring: ${re.name}`,
            }));
          return {
            ...current,
            expenses: [...newExpenses, ...current.expenses],
            recurringAppliedMonths: [...current.recurringAppliedMonths, monthStr],
          };
        }),
      votePost: (postId, delta) =>
        setState((current) => ({
          ...current,
          posts: current.posts.map((post) => (post.id === postId ? { ...post, votes: post.votes + delta } : post)),
        })),
      voteComment: (postId, commentId, delta, replyId) =>
        setState((current) => ({
          ...current,
          posts: current.posts.map((post) => {
            if (post.id !== postId) return post;
            return {
              ...post,
              comments: post.comments.map((comment) => updateCommentVotes(comment, commentId, delta, replyId)),
            };
          }),
        })),
      trackingCategories: expenseCategories,
    }),
    [analytics, cloudSignIn, signOutCloud, ready, state, supabaseUserId],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
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
