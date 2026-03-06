import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Skill } from "@/lib/types";

export type DeveloperSort = "newest" | "projects" | "rating";

export interface DeveloperListItem {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  university: string | null;
  bio: string | null;
  skills: { name: string; self_reported_level: string | null }[];
  level: string;
  completed_projects_count: number;
  average_rating: number;
}

export async function getSkills(): Promise<Skill[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("skills")
    .select("id, slug, name")
    .order("name");
  if (error) return [];
  return (data ?? []) as Skill[];
}

export async function getDevelopersList(params: {
  q?: string;
  skill?: string;
  level?: string;
  university?: string;
  sort?: DeveloperSort;
}): Promise<DeveloperListItem[]> {
  const supabase = await createServerSupabaseClient();

  // Base: profiles with role = student only
  let profilesQuery = supabase
    .from("profiles")
    .select(
      `
      id,
      display_name,
      avatar_url,
      university,
      bio,
      created_at
    `
    )
    .eq("role", "student")
    .order("created_at", { ascending: false });

  // Text search on display_name and bio (ilike for case-insensitive)
  const q = (params.q ?? "").trim();
  if (q.length > 0) {
    profilesQuery = profilesQuery.or(
      `display_name.ilike.%${q}%,bio.ilike.%${q}%`
    );
  }

  if (params.university?.trim()) {
    profilesQuery = profilesQuery.ilike(
      "university",
      `%${params.university.trim()}%`
    );
  }

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError || !profiles?.length) {
    return [];
  }

  const profileIds = profiles.map((p) => p.id);

  // Fetch profile_skills and skills
  const { data: profileSkillsRows } = await supabase
    .from("profile_skills")
    .select("profile_id, skill_id, self_reported_level")
    .in("profile_id", profileIds);

  const skillIds = Array.from(
    new Set((profileSkillsRows ?? []).map((r) => r.skill_id))
  );
  const { data: skillsData } =
    skillIds.length > 0
      ? await supabase.from("skills").select("id, name").in("id", skillIds)
      : { data: [] };
  const skillNames = new Map(
    (skillsData ?? []).map((s: { id: string; name: string }) => [s.id, s.name])
  );

  const skillsByProfile = new Map<
    string,
    { name: string; self_reported_level: string | null }[]
  >();
  for (const row of profileSkillsRows ?? []) {
    const name = skillNames.get(row.skill_id) ?? "";
    const list = skillsByProfile.get(row.profile_id) ?? [];
    list.push({
      name,
      self_reported_level: row.self_reported_level ?? null,
    });
    skillsByProfile.set(row.profile_id, list);
  }

  // Fetch developer_stats
  const { data: statsRows } = await supabase
    .from("developer_stats")
    .select("*")
    .in("profile_id", profileIds);

  type StatsRow = {
    profile_id: string;
    level?: string;
    completed_projects_count?: number;
    average_rating?: number;
  };
  const statsByProfile = new Map<string, StatsRow>(
    (statsRows ?? []).map((s: StatsRow) => [s.profile_id, s])
  );

  // Filter by skill (slug or name)
  let filteredProfiles = profiles;
  if (params.skill?.trim()) {
    const skillLower = params.skill.trim().toLowerCase();
    filteredProfiles = profiles.filter((p) => {
      const skills = skillsByProfile.get(p.id) ?? [];
      return skills.some(
        (s) =>
          s.name.toLowerCase().includes(skillLower) ||
          skillLower.includes(s.name.toLowerCase())
      );
    });
  }

  if (params.level?.trim()) {
    const levelLower = params.level.trim().toLowerCase();
    filteredProfiles = filteredProfiles.filter((p) => {
      const stats = statsByProfile.get(p.id);
      const level = (stats?.level ?? "Beginner").toLowerCase();
      return level.includes(levelLower) || levelLower.includes(level);
    });
  }

  // Build list items
  let list: DeveloperListItem[] = filteredProfiles.map((p) => {
    const stats = statsByProfile.get(p.id);
    return {
      id: p.id,
      display_name: p.display_name ?? null,
      avatar_url: p.avatar_url ?? null,
      university: p.university ?? null,
      bio: p.bio ?? null,
      skills: skillsByProfile.get(p.id) ?? [],
      level: stats?.level ?? "Beginner",
      completed_projects_count: stats?.completed_projects_count ?? 0,
      average_rating: Number(stats?.average_rating ?? 0),
    };
  });

  // Sort
  const sort = params.sort ?? "newest";
  if (sort === "projects") {
    list.sort((a, b) => b.completed_projects_count - a.completed_projects_count);
  } else if (sort === "rating") {
    list.sort((a, b) => b.average_rating - a.average_rating);
  }
  // newest: already ordered by created_at desc from query

  return list;
}

export async function getDeveloperById(profileId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, university, bio, github_url")
    .eq("id", profileId)
    .eq("role", "student")
    .single();

  if (profileError || !profile) return null;

  const [profileSkillsRes, statsRes, portfolioRes, reviewsRes] = await Promise.all([
    supabase
      .from("profile_skills")
      .select("skill_id, self_reported_level")
      .eq("profile_id", profileId),
    supabase
      .from("developer_stats")
      .select("*")
      .eq("profile_id", profileId)
      .single(),
    supabase
      .from("portfolio_items")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("id, rating, review, created_at, reviewer_id")
      .eq("reviewee_id", profileId)
      .order("created_at", { ascending: false }),
  ]);

  const psRows = profileSkillsRes.data ?? [];
  const skillIds = Array.from(new Set(psRows.map((r: { skill_id: string }) => r.skill_id)));
  const { data: skillsData } =
    skillIds.length > 0
      ? await supabase.from("skills").select("id, name, slug").in("id", skillIds)
      : { data: [] };
  const skillMap = new Map(
    (skillsData ?? []).map((s: { id: string; name: string; slug: string }) => [s.id, s])
  );
  const skills = psRows.map((row: { skill_id: string; self_reported_level: string | null }) => {
    const s = skillMap.get(row.skill_id);
    return { name: s?.name ?? "", slug: s?.slug ?? "", level: row.self_reported_level };
  });
  const stats = statsRes.data ?? null;
  const portfolioItems = (portfolioRes.data ?? []) as Array<{
    id: string;
    title: string;
    description: string | null;
    tech_stack: string[];
    project_url: string | null;
    github_url: string | null;
    image_url: string | null;
    created_at: string;
  }>;
  const reviewsRaw = (reviewsRes.data ?? []) as Array<{
    id: string;
    rating: number;
    review: string | null;
    created_at: string;
    reviewer_id: string;
  }>;
  const reviewerIds = Array.from(new Set(reviewsRaw.map((r) => r.reviewer_id)));
  const { data: reviewerProfiles } =
    reviewerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", reviewerIds)
      : { data: [] };
  const reviewerNames = new Map(
    (reviewerProfiles ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name])
  );
  const reviews = reviewsRaw.map((r) => ({
    id: r.id,
    rating: r.rating,
    review: r.review,
    created_at: r.created_at,
    reviewer_name: reviewerNames.get(r.reviewer_id) ?? "Anonymous",
  }));

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : Number(stats?.average_rating ?? 0);

  return {
    profile,
    skills,
    stats,
    portfolioItems,
    reviews,
    averageRating,
  };
}
