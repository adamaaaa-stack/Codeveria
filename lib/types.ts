// User & profile types
export type Role = "developer" | "company" | "admin";

export interface Profile {
  id: string;
  userId: string;
  role: Role;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  category?: string;
}

/** DB: profile_skills row (join with skills for name) */
export interface ProfileSkill {
  id: string;
  profile_id: string;
  skill_id: string;
  self_reported_level: string | null;
  created_at: string;
  skill?: Skill;
}

/** DB: developer_stats row */
export interface DeveloperStats {
  profile_id: string;
  completed_projects_count: number;
  on_time_completion_rate: number;
  average_rating: number;
  level: string;
  updated_at: string;
}

/** DB: portfolio_items row (developer portfolio) */
export interface PortfolioItemDb {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  project_url: string | null;
  github_url: string | null;
  image_url: string | null;
  created_at: string;
}

/** DB: reviews row */
export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  reviewer?: { display_name: string | null };
}

export interface SkillTest {
  id: string;
  slug: string;
  name: string;
  description?: string;
  skillId: string;
  durationMinutes: number;
  passingScore: number;
  createdAt: string;
}

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  skillLevel: SkillLevel;
  completedAt: string;
}

export interface DeveloperProfile extends Profile {
  role: "developer";
  bio?: string;
  skills: Array<{
    skillId: string;
    skill: Skill;
    level: SkillLevel;
    testResultId?: string;
    verifiedAt?: string;
  }>;
  portfolioItems: PortfolioItem[];
  school?: string;
  graduationYear?: number;
}

export interface CompanyProfile extends Profile {
  role: "company";
  companyName: string;
  companyWebsite?: string;
  industry?: string;
  description?: string;
}

// Messaging (DB-aligned)
export interface Conversation {
  id: string;
  company_id: string;
  student_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ParticipantSummary {
  id: string;
  display_name: string | null;
  role: string;
  avatar_url: string | null;
}

export interface ConversationWithParticipant {
  id: string;
  created_at: string;
  otherParticipant: ParticipantSummary;
  lastMessage: { body: string; created_at: string; sender_id: string } | null;
  unreadCount: number;
}

// Workspace & milestones (DB-aligned)
export type WorkspaceStatus =
  | "draft"
  | "awaiting_student_confirmation"
  | "funding_required"
  | "active"
  | "completed"
  | "cancelled"
  | "disputed";

export interface Workspace {
  id: string;
  conversation_id: string;
  company_id: string;
  student_id: string;
  title: string;
  description: string;
  tech_stack: string[];
  total_budget: number;
  status: WorkspaceStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMessage {
  id: string;
  workspace_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export type MilestoneStatus =
  | "draft"
  | "pending_student_confirmation"
  | "active"
  | "submitted"
  | "approved"
  | "rejected"
  | "paid"
  | "cancelled";

export interface Milestone {
  id: string;
  workspace_id: string;
  order_index: number;
  title: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  status: MilestoneStatus;
  submission_notes: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceWithParticipants extends Workspace {
  company: ParticipantSummary;
  student: ParticipantSummary;
}

// Payments & escrow (DB-aligned)
export type EscrowPaymentStatus =
  | "pending"
  | "funded"
  | "partially_released"
  | "released"
  | "refunded";

export interface EscrowPaymentDb {
  id: string;
  workspace_id: string;
  company_id: string;
  student_id: string;
  lemonsqueezy_order_id: string | null;
  amount: number;
  currency: string;
  status: EscrowPaymentStatus;
  created_at: string;
}

export type LedgerTransactionType =
  | "external_payment"
  | "escrow_deposit"
  | "milestone_release"
  | "payout"
  | "refund"
  | "fee";

export interface LedgerTransactionDb {
  id: string;
  type: string;
  amount: number;
  currency: string;
  source_account_id: string | null;
  destination_account_id: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

// Portfolio (app/workspace-derived; for display)
export interface PortfolioItem {
  id: string;
  userId: string;
  workspaceId: string;
  title: string;
  description?: string;
  skills: string[];
  completedAt: string;
  companyName?: string;
  outcome?: string;
}
