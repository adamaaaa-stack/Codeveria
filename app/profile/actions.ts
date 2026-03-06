"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateProfileBio(bio: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ bio: bio.trim() || null })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/developers");
  return {};
}

export async function updateProfileSkills(skillIds: string[]) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error: deleteError } = await supabase
    .from("profile_skills")
    .delete()
    .eq("profile_id", user.id);
  if (deleteError) return { error: deleteError.message };

  if (skillIds.length > 0) {
    const rows = skillIds.map((skill_id) => ({
      profile_id: user.id,
      skill_id,
    }));
    const { error: insertError } = await supabase
      .from("profile_skills")
      .insert(rows);
    if (insertError) return { error: insertError.message };
  }
  revalidatePath("/profile");
  revalidatePath("/developers");
  return {};
}

export async function addPortfolioItem(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const description = (formData.get("description") as string)?.trim() || null;
  const techStackStr = (formData.get("tech_stack") as string)?.trim();
  const tech_stack = techStackStr
    ? techStackStr.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    : [];
  const project_url = (formData.get("project_url") as string)?.trim() || null;
  const github_url = (formData.get("github_url") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;

  const { error } = await supabase.from("portfolio_items").insert({
    profile_id: user.id,
    title,
    description,
    tech_stack,
    project_url,
    github_url,
    image_url,
  });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/developers");
  return {};
}

export async function updatePortfolioItem(
  id: string,
  formData: FormData
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const description = (formData.get("description") as string)?.trim() || null;
  const techStackStr = (formData.get("tech_stack") as string)?.trim();
  const tech_stack = techStackStr
    ? techStackStr.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    : [];
  const project_url = (formData.get("project_url") as string)?.trim() || null;
  const github_url = (formData.get("github_url") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;

  const { error } = await supabase
    .from("portfolio_items")
    .update({
      title,
      description,
      tech_stack,
      project_url,
      github_url,
      image_url,
    })
    .eq("id", id)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/developers");
  return {};
}

export async function deletePortfolioItem(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/developers");
  return {};
}
