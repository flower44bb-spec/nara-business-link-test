export type BaseRecord = {
  id: string | number;
  user_id?: string | null;
  title?: string | null;
  name?: string | null;
  category?: string | null;
  area?: string | null;
  description?: string | null;
  detail?: string | null;
  content?: string | null;
  image_url?: string | null;
  services?: string | null;
  collaboration_needs?: string | null;
  contact?: string | null;
  result?: string | null;
  approval_status?: "pending" | "approved" | "rejected" | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export type ResourceKind = "problems" | "collaborations" | "successes";

export type UserRole = "admin" | "member" | "pending";

export type Profile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  local_chapter?: string | null;
  position?: string | null;
  company_name?: string | null;
  industry?: string | null;
  bio?: string | null;
  can_help_with?: string | null;
  wants_to_connect_with?: string | null;
  avatar_url?: string | null;
  line_user_id?: string | null;
  line_notify_target?: string | null;
  line_notifications_enabled?: boolean;
  rejected_at?: string | null;
  role: UserRole;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Conversation = {
  id: string;
  participant_one: string;
  participant_two: string;
  created_at: string;
  updated_at: string;
};

export type DirectMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at?: string | null;
  created_at: string;
};

export type MarchePost = {
  id: string;
  user_id: string;
  event_name: string;
  event_date: string;
  location: string;
  desired_industries?: string | null;
  description: string;
  application_deadline?: string | null;
  booth_fee?: string | null;
  organizer: string;
  image_url?: string | null;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at?: string | null;
};

export type ResourceConfig = {
  table: ResourceKind;
  label: string;
  singular: string;
  accent: string;
  icon: string;
  intro: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
};
