"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const URL_REGEX = /^https?:\/\/.+/i;

export function OnboardingCompanyForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const displayNameTrimmed = displayName.trim();
    const companyNameTrimmed = companyName.trim();
    const companyDescriptionTrimmed = companyDescription.trim();

    if (!displayNameTrimmed) {
      setError("Display name is required.");
      setLoading(false);
      return;
    }
    if (!companyNameTrimmed) {
      setError("Company name is required.");
      setLoading(false);
      return;
    }
    if (!companyDescriptionTrimmed) {
      setError("Company description is required.");
      setLoading(false);
      return;
    }
    if (companyWebsite.trim() && !URL_REGEX.test(companyWebsite.trim())) {
      setError("Company website must be a valid URL.");
      setLoading(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayNameTrimmed,
        company_name: companyNameTrimmed,
        company_website: companyWebsite.trim() || null,
        company_description: companyDescriptionTrimmed,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message || "Failed to save profile.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Complete your profile (company)</CardTitle>
        <CardDescription>
          Add your display name and company details so developers can learn
          about you.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="company-display-name" className="text-sm font-medium">
              Display name <span className="text-destructive">*</span>
            </label>
            <Input
              id="company-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="company-name" className="text-sm font-medium">
              Company name <span className="text-destructive">*</span>
            </label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company or organization name"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="company-website" className="text-sm font-medium">
              Company website
            </label>
            <Input
              id="company-website"
              type="url"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="https://company.com"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="company-description" className="text-sm font-medium">
              Company description <span className="text-destructive">*</span>
            </label>
            <textarea
              id="company-description"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              placeholder="What does your company do? What kind of projects do you need?"
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Complete profile"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
