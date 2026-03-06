import { getDevelopersList, getSkills } from "@/lib/developers";
import type { DeveloperSort } from "@/lib/developers";
import { DeveloperFilters } from "@/components/developers/DeveloperFilters";
import { DeveloperCard } from "@/components/developers/DeveloperCard";

interface PageProps {
  searchParams: { q?: string; skill?: string; level?: string; university?: string; sort?: string };
}

export default async function DevelopersPage({ searchParams }: PageProps) {
  const params = searchParams;
  const q = params.q ?? "";
  const skill = params.skill ?? "";
  const level = params.level ?? "";
  const university = params.university ?? "";
  const sort = (params.sort as DeveloperSort) ?? "newest";

  const [developers, skills] = await Promise.all([
    getDevelopersList({ q, skill, level, university, sort }),
    getSkills(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Developers</h1>
        <p className="text-muted-foreground">
          Browse and search student developers. No AI matching — you choose who to
          contact.
        </p>
      </div>
      <DeveloperFilters
        skills={skills}
        initialQ={q}
        initialSkill={skill}
        initialLevel={level}
        initialUniversity={university}
        initialSort={sort}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {developers.length === 0 ? (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            No developers match your filters. Try adjusting search or filters.
          </p>
        ) : (
          developers.map((dev) => (
            <DeveloperCard
              key={dev.id}
              id={dev.id}
              displayName={dev.display_name ?? "Developer"}
              university={dev.university}
              bio={dev.bio}
              skills={dev.skills}
              level={dev.level}
              completedProjectsCount={dev.completed_projects_count}
              averageRating={dev.average_rating}
              avatarUrl={dev.avatar_url}
            />
          ))
        )}
      </div>
    </div>
  );
}
