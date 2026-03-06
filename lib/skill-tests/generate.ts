/**
 * AI-generated skill task: call OpenRouter to create a coding challenge,
 * then persist to skill_tasks. Uses existing skills table (by id or slug/name).
 */

import { chatCompletion } from "@/lib/openrouter/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export interface GeneratedTaskPayload {
  title: string;
  description: string;
  requirements: string[];
  expected_output: string;
  evaluation_rules: string;
}

const PROMPT_TEMPLATE = `You are generating coding challenges for developer skill verification.

Skill: {{skill}}
Level: {{level}}

Generate a real-world coding challenge.

Requirements:
- difficulty appropriate for the level
- solvable in 20–40 minutes
- practical problem
- no multiple choice
- must require writing real code

Return JSON in this format (no other text):

{
  "title": "...",
  "description": "...",
  "requirements": ["...", "..."],
  "expected_output": "...",
  "evaluation_rules": "how the solution should be judged"
}`;

function buildPrompt(skillName: string, level: number): string {
  return PROMPT_TEMPLATE
    .replace("{{skill}}", skillName)
    .replace("{{level}}", String(level));
}

function parseGeneratedPayload(raw: string): GeneratedTaskPayload {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0]! : trimmed;
  const parsed = JSON.parse(jsonStr) as unknown;
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).title !== "string" ||
    typeof (parsed as Record<string, unknown>).description !== "string"
  ) {
    throw new Error("Invalid AI response: missing title or description");
  }
  const p = parsed as Record<string, unknown>;
  return {
    title: String(p.title),
    description: String(p.description),
    requirements: Array.isArray(p.requirements)
      ? (p.requirements as string[]).map(String)
      : [String(p.description)],
    expected_output: typeof p.expected_output === "string" ? p.expected_output : "",
    evaluation_rules:
      typeof p.evaluation_rules === "string" ? p.evaluation_rules : "",
  };
}

/**
 * Get or create skill_level for (skillId, level). Returns skill_level id.
 * Uses service role to bypass RLS (skill_levels has no insert policy for users).
 */
async function getOrCreateSkillLevel(
  supabase: ReturnType<typeof createServiceRoleClient>,
  skillId: string,
  level: number
): Promise<string> {
  const { data: existing } = await supabase
    .from("skill_levels")
    .select("id")
    .eq("skill_id", skillId)
    .eq("level", level)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const difficulty =
    level <= 3 ? "beginner" : level <= 6 ? "intermediate" : "advanced";
  const { data: inserted, error } = await supabase
    .from("skill_levels")
    .insert({ skill_id: skillId, level, difficulty })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!inserted?.id) throw new Error("Failed to create skill_level");
  return inserted.id;
}

/**
 * Generate a skill task for the given skill and level using AI, then save to DB.
 * skillIdOrSlug: existing skill id (uuid) or slug (e.g. "react", "python").
 */
export async function generateSkillTask(
  skillIdOrSlug: string,
  level: number,
  userId: string
): Promise<
  | { task: { id: string; title: string; prompt: string; description: string | null; requirements: string[]; expected_output: string | null; evaluation_rules: string | null; skill_name?: string; level?: number } }
  | { error: string }
> {
  if (level < 1 || level > 10) {
    return { error: "Level must be between 1 and 10" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { error: "Unauthorized" };

  // Resolve skill by id or slug
  const isUuid = /^[0-9a-f-]{36}$/i.test(skillIdOrSlug);
  const skillQuery = isUuid
    ? supabase.from("skills").select("id, name").eq("id", skillIdOrSlug)
    : supabase.from("skills").select("id, name").eq("slug", skillIdOrSlug);
  const { data: skill } = await skillQuery.single();

  if (!skill) return { error: "Skill not found" };
  const skillId = skill.id as string;
  const skillName = (skill.name as string) || skillIdOrSlug;

  const prompt = buildPrompt(skillName, level);
  let raw: string;
  try {
    raw = await chatCompletion(
      [{ role: "user", content: prompt }],
      { maxTokens: 2048, responseFormat: "json_object" }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI generation failed";
    return { error: msg };
  }

  let payload: GeneratedTaskPayload;
  try {
    payload = parseGeneratedPayload(raw);
  } catch {
    return { error: "Invalid AI response format" };
  }

  const fullPrompt = [
    payload.description,
    payload.requirements.length
      ? "Requirements:\n" + payload.requirements.map((r) => `- ${r}`).join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const serviceSupabase = createServiceRoleClient();
  const skillLevelId = await getOrCreateSkillLevel(serviceSupabase, skillId, level);

  const { data: taskRow, error: insertError } = await serviceSupabase
    .from("skill_tasks")
    .insert({
      skill_level_id: skillLevelId,
      title: payload.title,
      prompt: fullPrompt,
      description: payload.description,
      requirements: payload.requirements,
      expected_output: payload.expected_output,
      evaluation_rules: payload.evaluation_rules,
      generated_by_ai: true,
    })
    .select("id, title, prompt, description, requirements, expected_output, evaluation_rules")
    .single();

  if (insertError) return { error: insertError.message };
  if (!taskRow) return { error: "Failed to save task" };

  return {
    task: {
      id: taskRow.id,
      title: taskRow.title,
      prompt: taskRow.prompt,
      description: taskRow.description ?? null,
      requirements: (taskRow.requirements as string[]) ?? [],
      expected_output: taskRow.expected_output ?? null,
      evaluation_rules: taskRow.evaluation_rules ?? null,
      skill_name: skillName,
      level,
    },
  };
}
