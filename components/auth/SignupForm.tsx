"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

type SignupRole = "student" | "company";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<SignupRole>("student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setError("Email is required.");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (!role) {
      setError("Please select student or company.");
      setLoading(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: emailTrimmed,
      password,
    });

    if (signUpError) {
      setError(signUpError.message || "Sign up failed.");
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Sign up failed. Please try again.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      role,
      onboarding_complete: false,
    });

    if (profileError) {
      setError(
        "Account created but we couldn't create your profile. Please contact support or try logging in."
      );
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <Link href="/" className="inline-block text-xl font-bold text-primary">
          DevBridge
        </Link>
        <CardTitle className="text-2xl">Create account</CardTitle>
        <CardDescription>
          Sign up as a company or a student developer.
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
            <label htmlFor="signup-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="signup-password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-confirm" className="text-sm font-medium">
              Confirm password
            </label>
            <Input
              id="signup-confirm"
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">I am a</span>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === "student"}
                  onChange={() => setRole("student")}
                  disabled={loading}
                  className="h-4 w-4"
                />
                <span className="text-sm">Student developer</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="company"
                  checked={role === "company"}
                  onChange={() => setRole("company")}
                  disabled={loading}
                  className="h-4 w-4"
                />
                <span className="text-sm">Company</span>
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Sign up"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
