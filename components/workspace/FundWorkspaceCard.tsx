"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Milestone, WorkspaceWithParticipants } from "@/lib/types";
import { Lock, CreditCard, Loader2 } from "lucide-react";

interface FundWorkspaceCardProps {
  workspace: WorkspaceWithParticipants;
  milestones: Milestone[];
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function FundWorkspaceCard({ workspace, milestones }: FundWorkspaceCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFund() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/lemonsqueezy/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspace.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create checkout");
        return;
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      setError("No checkout URL returned");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const totalCents = workspace.total_budget;
  const allocated = milestones.reduce((s, m) => s + m.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Fund workspace
        </CardTitle>
        <CardDescription>
          Pay the total budget via Lemon Squeezy. Funds are held in escrow until milestones are completed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total budget</span>
            <span className="font-medium">{formatCents(totalCents)}</span>
          </div>
          {milestones.length > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Milestone breakdown</span>
                <span className="font-medium">{formatCents(allocated)}</span>
              </div>
              <ul className="mt-2 list-inside list-disc text-muted-foreground">
                {milestones.map((m) => (
                  <li key={m.id}>
                    {m.title}: {formatCents(m.amount)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Your payment is held in escrow inside the platform. The student is paid when milestones are approved. You can request changes or get a refund according to the workspace terms.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          className="w-full gap-2"
          onClick={handleFund}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating checkout…
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Fund workspace with Lemon Squeezy
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
