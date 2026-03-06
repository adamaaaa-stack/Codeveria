import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeveloperById } from "@/lib/developers";
import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { formatDate } from "@/lib/formatDate";
import {
  ArrowLeft,
  Star,
  Briefcase,
  UserPlus,
  Github,
  ExternalLink,
} from "lucide-react";

export default async function DeveloperProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [data, currentProfile] = await Promise.all([
    getDeveloperById(params.id),
    getCurrentProfile(),
  ]);
  if (!data) notFound();

  const { profile, skills, stats, portfolioItems, reviews, averageRating } =
    data;
  const displayName = profile.display_name ?? "Developer";
  const initials = displayName.trim().charAt(0).toUpperCase();
  const level = stats?.level ?? "Beginner";
  const completedCount = stats?.completed_projects_count ?? 0;

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/developers" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to developers
        </Link>
      </Button>

      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-3xl font-semibold text-primary">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {displayName}
              </h1>
              {profile.university && (
                <p className="text-muted-foreground">{profile.university}</p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="font-medium">
                  {level}
                </Badge>
                {completedCount > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    {completedCount} completed project
                    {completedCount !== 1 ? "s" : ""}
                  </span>
                )}
                {averageRating > 0 && (
                  <span className="flex items-center gap-1.5 text-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    <span className="font-medium">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                    </span>
                  </span>
                )}
              </div>
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Github className="h-4 w-4" />
                  GitHub profile
                </a>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <StartConversationButton
                  studentId={profile.id}
                  currentProfile={currentProfile}
                />
                <Button size="sm" variant="outline" className="gap-2" disabled>
                  <UserPlus className="h-4 w-4" />
                  Hire developer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {profile.bio && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {profile.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>Technologies and verified levels</CardDescription>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No skills added yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge
                  key={s.slug || s.name}
                  variant="secondary"
                  className="py-1.5 text-sm"
                >
                  {s.name}
                  {s.level ? ` · ${s.level}` : ""}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio</CardTitle>
          <CardDescription>Projects and work samples</CardDescription>
        </CardHeader>
        <CardContent>
          {portfolioItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No portfolio items yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {portfolioItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {item.image_url && (
                    <div className="aspect-video w-full bg-muted">
                      <img
                        src={item.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    {item.description && (
                      <CardDescription className="line-clamp-2">
                        {item.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {item.tech_stack?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tech_stack.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {item.project_url && (
                        <a
                          href={item.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Project
                        </a>
                      )}
                      {item.github_url && (
                        <a
                          href={item.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Github className="h-3.5 w-3.5" />
                          Code
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            {reviews.length === 0
              ? "No reviews yet."
              : `Average ${averageRating.toFixed(1)} from ${reviews.length} review${reviews.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This developer has not received any reviews yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-medium">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                      {r.rating}/5
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {r.reviewer_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  {r.review && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {r.review}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
