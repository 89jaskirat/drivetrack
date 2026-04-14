import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { expenseCategories, seedState } from '../data/seed';
import { AppState, ExpenseLog, ForumComment, ForumPost, FuelLog, GasPrice, MileageLog, Role, Units, UserProfile } from '../types';

const STORAGE_KEY = 'uber-driver-companion-local-v2';

type TrackingType = 'mileage' | 'fuel' | 'expense';

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
  };
  signIn: (profile?: Partial<UserProfile>) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setUnits: (units: Units) => void;
  setGpsConsent: (value: boolean) => void;
  addMileage: (input: Omit<MileageLog, 'id'>) => void;
  addFuel: (input: Omit<FuelLog, 'id'>) => void;
  addExpense: (input: Omit<ExpenseLog, 'id'>) => void;
  addPost: (input: Pick<ForumPost, 'title' | 'body'>) => void;
  votePost: (postId: string, delta: number) => void;
  voteComment: (postId: string, commentId: string, delta: number, replyId?: string) => void;
  trackingCategories: typeof expenseCategories;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const moneyRate = 1.18;
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(seedState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          setState(JSON.parse(saved) as AppState);
        }
      })
      .finally(() => setReady(true));
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
    const earnings = km * moneyRate;

    return {
      km,
      earnings,
      fuelCost,
      expenseCost,
      profit: earnings - fuelCost - expenseCost,
      fuelPer100: km > 0 ? (fuelLitres / km) * 100 : 0,
    };
  }, [state.expenses, state.fuel, state.mileage]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      ready,
      state,
      analytics,
      signIn: (profile) =>
        setState((current) => ({
          ...current,
          signedIn: true,
          profile: { ...current.profile, ...profile },
        })),
      updateProfile: (profile) =>
        setState((current) => ({
          ...current,
          profile: { ...current.profile, ...profile },
        })),
      setUnits: (units) => setState((current) => ({ ...current, units })),
      setGpsConsent: (value) => setState((current) => ({ ...current, gpsConsent: value })),
      addMileage: (input) =>
        setState((current) => ({
          ...current,
          mileage: [{ id: makeId('m'), ...input }, ...current.mileage],
        })),
      addFuel: (input) =>
        setState((current) => ({
          ...current,
          fuel: [{ id: makeId('f'), ...input }, ...current.fuel],
        })),
      addExpense: (input) =>
        setState((current) => ({
          ...current,
          expenses: [{ id: makeId('e'), ...input }, ...current.expenses],
        })),
      addPost: (input) =>
        setState((current) => ({
          ...current,
          posts: [
            {
              id: makeId('p'),
              author: current.profile.name,
              title: input.title,
              body: input.body,
              votes: 1,
              comments: [],
              tags: [current.profile.zone.toLowerCase()],
            },
            ...current.posts,
          ],
        })),
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
    [analytics, ready, state],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
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
