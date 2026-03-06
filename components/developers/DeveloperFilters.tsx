"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { DeveloperSort } from "@/lib/developers";
import type { Skill } from "@/lib/types";

const SORT_OPTIONS: { value: DeveloperSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "projects", label: "Most projects" },
  { value: "rating", label: "Highest rating" },
];

const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Expert"];

interface DeveloperFiltersProps {
  skills: Skill[];
  initialQ?: string;
  initialSkill?: string;
  initialLevel?: string;
  initialUniversity?: string;
  initialSort?: DeveloperSort;
}

export function DeveloperFilters({
  skills,
  initialQ = "",
  initialSkill = "",
  initialLevel = "",
  initialUniversity = "",
  initialSort = "newest",
}: DeveloperFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value.trim()) next.set(key, value.trim());
        else next.delete(key);
      });
      startTransition(() => {
        router.push(`/developers?${next.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.querySelector('[name="q"]') as HTMLInputElement)?.value ?? "";
    const skill = (form.querySelector('[name="skill"]') as HTMLSelectElement)?.value ?? "";
    const level = (form.querySelector('[name="level"]') as HTMLSelectElement)?.value ?? "";
    const university = (form.querySelector('[name="university"]') as HTMLInputElement)?.value ?? "";
    const sort = (form.querySelector('[name="sort"]') as HTMLSelectElement)?.value ?? "newest";
    updateParams({ q, skill, level, university, sort });
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4"
    >
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={initialQ}
          placeholder="Search by name or skills..."
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          name="skill"
          defaultValue={initialSkill}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">All skills</option>
          {skills.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="level"
          defaultValue={initialLevel}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">All levels</option>
          {LEVEL_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <Input
          name="university"
          defaultValue={initialUniversity}
          placeholder="University"
          className="w-40"
        />
        <select
          name="sort"
          defaultValue={initialSort}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Searching…" : "Search"}
        </Button>
      </div>
    </form>
  );
}
