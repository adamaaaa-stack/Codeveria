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

export function OnboardingStudentForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [university, setUniversity] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [bio, setBio] = useState("");
  const [preferredStacksInput, setPreferredStacksInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function parseStacks(input: string): string[] {
    return input
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const displayNameTrimmed = displayName.trim();
    const universityTrimmed = university.trim();

    if (!displayNameTrimmed) {
      setError("Display name is required.");
      setLoading(false);
      return;
    }
    if (!universityTrimmed) {
      setError("University is required.");
      setLoading(false);
      return;
    }
    if (githubUrl.trim() && !URL_REGEX.test(githubUrl.trim())) {
      setError("GitHub URL must be a valid URL (e.g. https://github.com/username).");
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

    const stacks = parseStacks(preferredStacksInput);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayNameTrimmed,
        university: universityTrimmed,
        github_url: githubUrl.trim() || null,
        bio: bio.trim() || null,
        preferred_stacks: stacks,
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
        <CardTitle>Complete your profile (student)</CardTitle>
        <CardDescription>
          Add your display name, university, and optional links. This helps
          companies find you.
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
            <label htmlFor="student-display-name" className="text-sm font-medium">
              Display name <span className="text-destructive">*</span>
            </label>
            <Input
              id="student-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="student-university" className="text-sm font-medium">
              University <span className="text-destructive">*</span>
            </label>
            <Input
              id="student-university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="Your university or school"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="student-github" className="text-sm font-medium">
              GitHub URL
            </label>
            <Input
              id="student-github"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="student-bio" className="text-sm font-medium">
              Bio
            </label>
            <textarea
              id="student-bio"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short intro about you and your experience"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="student-stacks" className="text-sm font-medium">
              Preferred stacks (comma or space separated)
            </label>
            <Input
              id="student-stacks"
              value={preferredStacksInput}
              onChange={(e) => setPreferredStacksInput(e.target.value)}
              placeholder="e.g. React, TypeScript, Node"
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
