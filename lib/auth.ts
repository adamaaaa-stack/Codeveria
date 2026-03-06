import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type DbRole = "student" | "company" | "admin";

export interface DbProfile {
  id: string;
  role: DbRole;
  onboarding_complete: boolean;
  display_name: string | null;
  avatar_url: string | null;
  university: string | null;
  github_url: string | null;
  bio: string | null;
  preferred_stacks: string[];
  company_name: string | null;
  company_website: string | null;
  company_description: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getCurrentProfile(): Promise<DbProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as DbProfile;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireCompletedOnboarding() {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_complete) redirect("/onboarding");
  return { user, profile };
}
