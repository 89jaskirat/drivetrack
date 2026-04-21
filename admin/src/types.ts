export type Role = 'driver' | 'cityAdmin' | 'superAdmin';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  zone: string;
  gps_consent: boolean;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  city: string;
  active: boolean;
  created_at: string;
}

export interface GasStation {
  id: string;
  name: string;
  address: string;
  zone: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface GasPriceEntry {
  id: string;
  station_id: string;
  price_per_litre: number;
  recorded_by: string;
  date: string;
  created_at: string;
}

export interface ForumPost {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  body: string;
  flair: string;
  zone: string;
  up_votes: number;
  down_votes: number;
  is_deleted: boolean;
  moderated_by: string | null;
  moderation_reason: string | null;
  created_at: string;
}

export interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  body: string;
  is_deleted: boolean;
  moderated_by: string | null;
  moderation_reason: string | null;
  created_at: string;
}

export interface ForumReply {
  id: string;
  comment_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  body: string;
  category: string;
  author_name: string;
  published: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
