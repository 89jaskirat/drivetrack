export type Role = 'driver' | 'cityAdmin' | 'superAdmin';
export type Units = 'metric' | 'imperial';

export type MileageLog = {
  id: string;
  date: string;
  start: number;
  end: number;
};

export type FuelLog = {
  id: string;
  date: string;
  litres: number;
  cost: number;
  odometer: number;
};

export type ExpenseLog = {
  id: string;
  date: string;
  amount: number;
  category: string;
  note: string;
};

export type ForumComment = {
  id: string;
  author: string;
  body: string;
  votes: number;
  replies?: ForumComment[];
};

export type ForumPost = {
  id: string;
  author: string;
  title: string;
  body: string;
  votes: number;
  comments: ForumComment[];
  tags: string[];
};

export type GasPrice = {
  id: string;
  station: string;
  price: number;
  distanceKm: number;
  address: string;
};

export type UserProfile = {
  name: string;
  phone: string;
  email: string;
  role: Role;
  zone: string;
};

export type AppState = {
  signedIn: boolean;
  profile: UserProfile;
  gpsConsent: boolean;
  units: Units;
  mileage: MileageLog[];
  fuel: FuelLog[];
  expenses: ExpenseLog[];
  posts: ForumPost[];
  gas: GasPrice[];
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Track: undefined;
  Community: undefined;
};
