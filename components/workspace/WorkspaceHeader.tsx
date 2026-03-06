import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkspaceWithParticipants } from "@/lib/types";
import type { WorkspaceStatus } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

interface WorkspaceHeaderProps {
  workspace: WorkspaceWithParticipants;
}

const statusVariant: Record<WorkspaceStatus, "default" | "secondary" | "outline"> = {
  draft: "secondary",
  awaiting_student_confirmation: "outline",
  funding_required: "secondary",
  active: "default",
  completed: "secondary",
  cancelled: "outline",
  disputed: "outline",
};

export function WorkspaceHeader({ workspace }: WorkspaceHeaderProps) {
  const companyName = workspace.company.display_name ?? "Company";
  const studentName = workspace.student.display_name ?? "Student";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/messages" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h2 className="text-xl font-semibold tracking-tight">{workspace.title}</h2>
        </div>
        <Badge variant={statusVariant[workspace.status] ?? "secondary"}>
          {workspace.status.replace(/_/g, " ")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Company: </span>
            <span className="font-medium">{companyName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Student: </span>
            <span className="font-medium">{studentName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total budget: </span>
            <span className="font-medium">{workspace.total_budget}</span>
          </div>
          {(workspace.start_date || workspace.end_date) && (
            <div>
              <span className="text-muted-foreground">Dates: </span>
              <span className="font-medium">
                {workspace.start_date ?? "—"} to {workspace.end_date ?? "—"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
