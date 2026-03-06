"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/SignOutButton";

export function AppHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">DevBridge</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile">Profile</Link>
        </Button>
        <SignOutButton variant="outline" size="sm" />
      </div>
    </header>
  );
}
