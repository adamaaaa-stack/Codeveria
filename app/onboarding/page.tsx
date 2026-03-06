import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OnboardingStudentForm } from "@/components/auth/OnboardingStudentForm";
import { OnboardingCompanyForm } from "@/components/auth/OnboardingCompanyForm";

export default async function OnboardingPage() {
  const user = await requireUser();

  const supabase = await createServerSupabaseClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, onboarding_complete")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  if (profile.onboarding_complete) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-8">
      <div className="mb-4 text-center">
        <Link href="/" className="text-xl font-bold text-primary">
          DevBridge
        </Link>
      </div>
      {profile.role === "student" && <OnboardingStudentForm />}
      {profile.role === "company" && <OnboardingCompanyForm />}
      {profile.role === "admin" && (
        <p className="text-sm text-muted-foreground">
          Admin onboarding can be configured separately.
        </p>
      )}
    </div>
  );
}
