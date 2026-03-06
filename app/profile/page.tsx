import { requireCompletedOnboarding } from "@/lib/auth";
import { getSkills } from "@/lib/developers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import type { PortfolioItemDb } from "@/lib/types";
import type { Skill } from "@/lib/types";

export default async function ProfilePage() {
  const { profile } = await requireCompletedOnboarding();
  const supabase = await createServerSupabaseClient();

  const [skills, profileSkillsRows, portfolioRows, payoutAccountRow] = await Promise.all([
    getSkills(),
    supabase
      .from("profile_skills")
      .select("skill_id")
      .eq("profile_id", profile.id),
    supabase
      .from("portfolio_items")
      .select("*")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("payout_accounts")
      .select("paypal_email")
      .eq("profile_id", profile.id)
      .maybeSingle(),
  ]);

  const skillIds = (profileSkillsRows.data ?? []).map((r) => r.skill_id);
  const portfolioItems = (portfolioRows.data ?? []) as PortfolioItemDb[];
  const payoutAccount = payoutAccountRow.data
    ? { paypal_email: (payoutAccountRow.data as { paypal_email: string }).paypal_email }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and public profile.
        </p>
      </div>
      <ProfileEditor
        profile={profile}
        skills={skills as Skill[]}
        selectedSkillIds={skillIds}
        portfolioItems={portfolioItems}
        payoutAccount={payoutAccount}
      />
    </div>
  );
}
