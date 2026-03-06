import Link from "next/link";
import { requireCompletedOnboarding } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { FileCheck, User, MessageSquare, Users, Briefcase } from "lucide-react";

export default async function DashboardPage() {
  const { user, profile } = await requireCompletedOnboarding();

  const displayName =
    profile.display_name || user.email?.split("@")[0] || "User";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your workspaces, messages, and activity.
          </p>
        </div>
        <SignOutButton variant="outline" size="sm" className="gap-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {displayName}</CardTitle>
          <CardDescription>
            You are signed in as <span className="font-medium capitalize">{profile.role}</span>.
          </CardDescription>
        </CardHeader>
      </Card>

      {profile.role === "student" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCheck className="h-5 w-5" />
                Complete tests
              </CardTitle>
              <CardDescription>
                Pass skill tests to get verified levels on your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link href="/tests">Go to tests</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Build profile
              </CardTitle>
              <CardDescription>
                Keep your profile and portfolio up to date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile">Edit profile</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Start conversations
              </CardTitle>
              <CardDescription>
                Message with companies when they reach out.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link href="/messages">Messages</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {profile.role === "company" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Browse developers
              </CardTitle>
              <CardDescription>
                Find verified student developers by skills and level.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link href="/developers">Browse developers</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Message developers
              </CardTitle>
              <CardDescription>
                Start a conversation when you find a good match.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link href="/messages">Messages</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5" />
                Create workspace
              </CardTitle>
              <CardDescription>
                When you agree to work together, a workspace will be created.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Available after messaging and agreeing with a developer.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
