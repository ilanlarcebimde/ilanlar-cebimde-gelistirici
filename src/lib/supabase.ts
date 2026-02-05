import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ProfileStatus =
  | "draft"
  | "completed"
  | "paid"
  | "processing"
  | "delivered";
export type ProfileMethod = "voice" | "chat" | "form";
export type EventType =
  | "profile_created"
  | "answer_saved"
  | "photo_uploaded"
  | "checkout_started"
  | "payment_success"
  | "payment_fail";

export interface Profile {
  id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  status: ProfileStatus;
  method: ProfileMethod;
  country: string | null;
  job_area: string | null;
  job_branch: string | null;
  answers: Record<string, unknown> | null;
  photo_url: string | null;
}

export interface Event {
  id?: string;
  user_id?: string;
  profile_id?: string;
  created_at?: string;
  type: EventType;
  payload?: Record<string, unknown>;
}

export interface UploadRow {
  id?: string;
  user_id?: string;
  profile_id?: string;
  created_at?: string;
  type: "photo" | "passport" | "document";
  url: string;
}
