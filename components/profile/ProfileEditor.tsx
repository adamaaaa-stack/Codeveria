"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  updateProfileBio,
  updateProfileSkills,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from "@/app/profile/actions";
import type { DbProfile } from "@/lib/auth";
import type { Skill } from "@/lib/types";
import type { PortfolioItemDb } from "@/lib/types";
import { Plus, Pencil, Trash2, ExternalLink, Github } from "lucide-react";

interface ProfileEditorProps {
  profile: DbProfile;
  skills: Skill[];
  selectedSkillIds: string[];
  portfolioItems: PortfolioItemDb[];
}

export function ProfileEditor({
  profile,
  skills,
  selectedSkillIds,
  portfolioItems,
}: ProfileEditorProps) {
  const [bio, setBio] = useState(profile.bio ?? "");
  const [bioSaving, setBioSaving] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    new Set(selectedSkillIds)
  );
  const [skillsSaving, setSkillsSaving] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  const [portfolioFormOpen, setPortfolioFormOpen] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);

  const isStudent = profile.role === "student";

  async function handleSaveBio() {
    setBioError(null);
    setBioSaving(true);
    const result = await updateProfileBio(bio);
    setBioSaving(false);
    if (result.error) setBioError(result.error);
  }

  function toggleSkill(skillId: string) {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  }

  async function handleSaveSkills() {
    setSkillsError(null);
    setSkillsSaving(true);
    const result = await updateProfileSkills(Array.from(selectedSkills));
    setSkillsSaving(false);
    if (result.error) setSkillsError(result.error);
  }

  async function handleAddPortfolio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const result = await addPortfolioItem(fd);
    if (result.error) {
      alert(result.error);
      return;
    }
    form.reset();
    setPortfolioFormOpen(false);
  }

  async function handleUpdatePortfolio(
    id: string,
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const result = await updatePortfolioItem(id, fd);
    if (result.error) {
      alert(result.error);
      return;
    }
    setEditingPortfolioId(null);
  }

  async function handleDeletePortfolio(id: string) {
    if (!confirm("Delete this portfolio item?")) return;
    const result = await deletePortfolioItem(id);
    if (result.error) alert(result.error);
  }

  return (
    <div className="space-y-6">
      {/* Basic info (all roles) */}
      <Card>
        <CardHeader>
          <CardTitle>Display name</CardTitle>
          <CardDescription>
            Your public display name. Edit during onboarding or contact support to
            change later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{profile.display_name ?? "—"}</p>
        </CardContent>
      </Card>

      {isStudent && (
        <>
          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle>Bio</CardTitle>
              <CardDescription>
                A short intro about you and your experience. Shown on your
                developer profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bioError && (
                <p className="text-sm text-destructive">{bioError}</p>
              )}
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell companies about your experience and interests..."
              />
              <Button
                type="button"
                size="sm"
                onClick={handleSaveBio}
                disabled={bioSaving}
              >
                {bioSaving ? "Saving…" : "Save bio"}
              </Button>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>
                Select the technologies you work with. These appear on your
                developer card and profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillsError && (
                <p className="text-sm text-destructive">{skillsError}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {skills.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSkills.has(s.id)}
                      onChange={() => toggleSkill(s.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveSkills}
                disabled={skillsSaving}
              >
                {skillsSaving ? "Saving…" : "Save skills"}
              </Button>
            </CardContent>
          </Card>

          {/* Portfolio */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
              <CardDescription>
                Add projects and work samples. These appear on your developer
                profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-4">
                {portfolioItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-4"
                  >
                    {editingPortfolioId === item.id ? (
                      <PortfolioItemForm
                        item={item}
                        onSubmit={(e) => handleUpdatePortfolio(item.id, e)}
                        onCancel={() => setEditingPortfolioId(null)}
                      />
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            {item.description && (
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            {(item.tech_stack?.length ?? 0) > 0 && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {item.tech_stack.join(", ")}
                              </p>
                            )}
                            <div className="mt-2 flex gap-3">
                              {item.project_url && (
                                <a
                                  href={item.project_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Project
                                </a>
                              )}
                              {item.github_url && (
                                <a
                                  href={item.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <Github className="h-3 w-3" />
                                  Code
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingPortfolioId(item.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePortfolio(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              {portfolioFormOpen ? (
                <div className="rounded-lg border border-border p-4">
                  <PortfolioItemForm
                    onSubmit={handleAddPortfolio}
                    onCancel={() => setPortfolioFormOpen(false)}
                  />
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setPortfolioFormOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add portfolio item
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {profile.role === "company" && (
        <Card>
          <CardHeader>
            <CardTitle>Company profile</CardTitle>
            <CardDescription>
              Company details are managed from your onboarding. Contact support to
              update.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {profile.company_name ?? "—"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PortfolioItemForm({
  item,
  onSubmit,
  onCancel,
}: {
  item?: PortfolioItemDb;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="text-sm font-medium">Title *</label>
        <Input
          name="title"
          defaultValue={item?.title}
          placeholder="Project name"
          required
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          defaultValue={item?.description ?? ""}
          placeholder="What did you build?"
          className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">
          Tech stack (comma or newline separated)
        </label>
        <Input
          name="tech_stack"
          defaultValue={item?.tech_stack?.join(", ") ?? ""}
          placeholder="React, TypeScript, Node.js"
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Project URL</label>
        <Input
          name="project_url"
          type="url"
          defaultValue={item?.project_url ?? ""}
          placeholder="https://..."
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">GitHub URL</label>
        <Input
          name="github_url"
          type="url"
          defaultValue={item?.github_url ?? ""}
          placeholder="https://github.com/..."
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Image URL</label>
        <Input
          name="image_url"
          type="url"
          defaultValue={item?.image_url ?? ""}
          placeholder="https://..."
          className="mt-1"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          {item ? "Update" : "Add"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
