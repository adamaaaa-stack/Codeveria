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

/** Skill test system: level 1-10 per skill, AI-generated tasks */
export interface SkillLevelDb {
  id: string;
  skill_id: string;
  level: number;
  difficulty: string | null;
  created_at: string;
}

export interface SkillTaskDb {
  id: string;
  skill_level_id: string;
  title: string;
  prompt: string;
  description: string | null;
  requirements: string[];
  expected_output: string | null;
  evaluation_rules: string | null;
  generated_by_ai: boolean;
  created_at: string;
}

export interface TestSubmissionDb {
  id: string;
  profile_id: string;
  task_id: string;
  code_submission: string;
  score: number | null;
  passed: boolean;
  ai_feedback: string | null;
  created_at: string;
  time_started: string | null;
  time_submitted: string | null;
  code_hash: string | null;
  flagged_for_review: boolean;
}

export interface DeveloperSkillLevelDb {
  id: string;
  profile_id: string;
  skill_id: string;
  current_level: number;
  updated_at: string;
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

// Workspace (DB-aligned, collaboration-only)
export type WorkspaceStatus =
  | "draft"
  | "awaiting_student_confirmation"
  | "active"
  | "completed"
  | "cancelled";

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

export interface WorkspaceWithParticipants extends Workspace {
  company: ParticipantSummary;
  student: ParticipantSummary;
}

// Code escrow: submissions, reviews, escrow records
export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "preview_building"
  | "preview_ready"
  | "preview_failed"
  | "under_review"
  | "approved"
  | "payment_required"
  | "delivered";

export type PreviewStatus = "not_started" | "building" | "ready" | "failed";

export interface SubmissionDb {
  id: string;
  workspace_id: string;
  developer_id: string;
  repo_url: string | null;
  preview_url: string | null;
  description: string | null;
  status: SubmissionStatus;
  code_storage_path: string | null;
  created_at: string;
  preview_status?: PreviewStatus | null;
  preview_deployment_id?: string | null;
  preview_error?: string | null;
}

export interface SubmissionReviewDb {
  id: string;
  submission_id: string;
  company_id: string;
  approved: boolean;
  review_notes: string | null;
  created_at: string;
}

export interface EscrowRecordDb {
  id: string;
  submission_id: string;
  code_access_granted: boolean;
  company_payment_confirmed: boolean;
  developer_payment_confirmed: boolean;
  released_at: string | null;
  created_at: string;
}

// Job listings
export type JobStatus = "open" | "in_progress" | "completed" | "closed";
export type JobApplicationStatus = "applied" | "shortlisted" | "rejected" | "accepted";

export interface JobDb {
  id: string;
  company_id: string;
  title: string;
  description: string;
  skill_required: string | null;
  skill_level: number | null;
  estimated_hours: number | null;
  difficulty: string | null;
  status: JobStatus;
  created_at: string;
}

export interface JobApplicationDb {
  id: string;
  job_id: string;
  developer_id: string;
  message: string | null;
  portfolio_link: string | null;
  status: JobApplicationStatus;
  created_at: string;
}

// Notifications (V1)
export interface NotificationDb {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

// Workspace reviews (V1, after workspace completed)
export interface WorkspaceReviewDb {
  id: string;
  workspace_id: string;
  company_id: string;
  developer_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

// Verified projects (V1, from completed workspaces)
export interface VerifiedProjectDb {
  id: string;
  developer_id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  completed_at: string;
}

// Workspace activity (V1 timeline)
export interface WorkspaceActivityDb {
  id: string;
  workspace_id: string;
  event_type: string;
  description: string | null;
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
