import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Briefcase, User } from "lucide-react";

export interface DeveloperCardProps {
  id: string;
  displayName: string;
  university?: string | null;
  bio?: string | null;
  skills: Array<{ name: string; self_reported_level?: string | null }>;
  level: string;
  completedProjectsCount: number;
  averageRating: number;
  avatarUrl?: string | null;
}

export function DeveloperCard({
  id,
  displayName,
  university,
  bio,
  skills,
  level,
  completedProjectsCount,
  averageRating,
  avatarUrl,
}: DeveloperCardProps) {
  const initials = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : "?";

  return (
    <Card className="overflow-hidden transition-colors hover:border-primary/30 hover:bg-muted/20">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/developers/${id}`}
              className="font-semibold text-foreground hover:underline"
            >
              {displayName || "Developer"}
            </Link>
            {university && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {university}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {level}
              </Badge>
              {completedProjectsCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" />
                  {completedProjectsCount} project
                  {completedProjectsCount !== 1 ? "s" : ""}
                </span>
              )}
              {averageRating > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  {averageRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {bio && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{bio}</p>
        )}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((s) => (
              <Badge
                key={s.name}
                variant="outline"
                className="text-xs font-normal"
              >
                {s.name}
                {s.self_reported_level ? ` · ${s.self_reported_level}` : ""}
              </Badge>
            ))}
            {skills.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{skills.length - 4}
              </Badge>
            )}
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/developers/${id}`} className="gap-2">
            <User className="h-4 w-4" />
            View profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
