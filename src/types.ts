export type Role = 'driver' | 'cityAdmin' | 'superAdmin';
export type Units = 'metric' | 'imperial';

export type MileageLog = {
  id: string;
  date: string;
  start: number;
  end: number;
  offline?: boolean;
  isGigWork?: boolean;
};

export type FuelType = 'Diesel' | 'Regular' | 'Midgrade' | 'Premium';
export const FUEL_TYPES: FuelType[] = ['Diesel', 'Regular', 'Midgrade', 'Premium'];

export type FuelLog = {
  id: string;
  date: string;
  litres: number;
  cost: number;
  odometer: number;
  fuelType?: FuelType;
};

export type ExpenseLog = {
  id: string;
  date: string;
  amount: number;
  category: string;
  note: string;
  receiptUri?: string;
  hstAmount?: number;
};

export type EarningsLog = {
  id: string;
  date: string;
  amount: number;
  note: string;
  platform?: 'Uber' | 'Lyft' | 'DoorDash' | 'Other';
};

export type RecurringExpense = {
  id: string;
  name: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  active: boolean;
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
  link?: string;
  imageUri?: string;
};

export type ShiftSession = {
  id: string;
  startTime: string;
  startOdo: number;
  endTime?: string;
  endOdo?: number;
  earnings?: number;
  distanceKm?: number;
  durationMinutes?: number;
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
  supabaseId?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
};

export type DealCategory = 'Mechanics' | 'Gas' | 'Insurance' | 'Restaurants' | 'Other';

export type Deal = {
  id: string;
  sponsor: string;
  category: DealCategory;
  headline: string;
  detail: string;
  cta: string;
  zone: string;
};

export type KnowledgeCategory = 'Tax' | 'Tips' | 'Maintenance';

export type KnowledgeArticle = {
  id: string;
  title: string;
  category: KnowledgeCategory;
  summary: string;
  body: string;
  readMinutes: number;
};

export type AppState = {
  signedIn: boolean;
  profile: UserProfile;
  gpsConsent: boolean;
  units: Units;
  mileage: MileageLog[];
  fuel: FuelLog[];
  expenses: ExpenseLog[];
  earnings: EarningsLog[];
  recurringExpenses: RecurringExpense[];
  posts: ForumPost[];
  gas: GasPrice[];
  deals: Deal[];
  articles: KnowledgeArticle[];
  currentShift: ShiftSession | null;
  shifts: ShiftSession[];
  recurringAppliedMonths: string[];
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Settings: undefined;
  TaxReport: undefined;
  RepeatingExpenses: undefined;
  Invite: undefined;
  Shift: { mode: 'start' | 'end' };
  Compose: {
    mode: 'post' | 'comment';
    postId?: string;
    commentId?: string;
    contextTitle?: string;
  };
};

export type Platform = 'Uber' | 'Lyft' | 'DoorDash' | 'Other';

// ── GPS Activity Detection ──────────────────────────────────────────────────
// Priority 1: Zone detection (auto-set zone from location)
// Priority 2: Drive sessions (start/end location, route, duration, distance)
// Priority 3: Automatic trip logging (detect driving starts/stops)
// Priority 4: Idle/waiting time at known spots

export type GpsCoordinate = {
  latitude: number;
  longitude: number;
  accuracy?: number;        // metres
  timestamp: string;        // ISO 8601
};

export type DriveSession = {
  id: string;
  startLocation: GpsCoordinate;
  endLocation?: GpsCoordinate;
  startTime: string;
  endTime?: string;
  distanceKm: number;
  durationMinutes: number;
  status: 'active' | 'completed';
  autoDetected: boolean;     // true if detected via motion, false if manual
};

export type DetectedZone = {
  zone: string;              // e.g. 'Calgary'
  confidence: number;        // 0-1
  detectedAt: string;
  coordinate: GpsCoordinate;
};

export type IdleStop = {
  id: string;
  location: GpsCoordinate;
  arrivalTime: string;
  departureTime?: string;
  durationMinutes: number;
  label?: string;            // e.g. 'Airport Queue', 'Downtown'
};

export type GpsActivityState = {
  enabled: boolean;
  currentSession?: DriveSession;
  detectedZone?: DetectedZone;
  recentSessions: DriveSession[];
  idleStops: IdleStop[];
};

// ── User Activity Tracking ──────────────────────────────────────────────────
export type ActivityEvent = {
  id: string;
  screenName: string;
  action: string;            // e.g. 'screen_view', 'tap_add_mileage', 'tap_start_shift'
  metadata?: Record<string, string | number>;
  timestamp: string;
  sessionId: string;
};

// ── Audit Log ───────────────────────────────────────────────────────────────
export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete';

export type AuditLogEntry = {
  id: string;
  userId: string;
  action: AuditAction;
  resource: string;          // e.g. 'mileage_logs', 'posts', 'profile'
  resourceId?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
};

export type MainTabParamList = {
  Home: undefined;
  Community: undefined;
  Deals: undefined;
  Knowledge: undefined;
  Profile: undefined;
};
