"use client";

import { useState } from "react";
import { SkillTestView } from "./SkillTestView";
import type { Skill } from "@/lib/types";

export interface TakeTestFlowProps {
  skills: Skill[];
  developerLevels: Record<string, number>;
  onBack: () => void;
}

export function TakeTestFlow({
  skills,
  developerLevels,
  onBack,
}: TakeTestFlowProps) {
  const [step, setStep] = useState<"pick" | "test">("pick");
  const [loading, setLoading] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<{
    id: string;
    title: string;
    prompt: string;
    description: string | null;
    requirements: string[];
    expected_output: string | null;
    evaluation_rules: string | null;
    skill_name?: string;
    level?: number;
  } | null>(null);
  const [skillName, setSkillName] = useState("");
  const [level, setLevel] = useState(0);

  async function handleTakeTest(skillId: string, slug: string, nextLevel: number) {
    if (loading) return;
    setError(null);
    setGeneratingFor(skillId);
    setLoading(true);
    try {
      const res = await fetch("/api/tests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: slug || skillId, level: nextLevel }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate task");
      }
      setTask(data.task);
      setSkillName(data.task.skill_name ?? skills.find((s) => s.id === skillId)?.name ?? slug);
      setLevel(nextLevel);
      setStep("test");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
      setGeneratingFor(null);
    }
  }

  async function handleSubmit(taskId: string, code: string) {
    const res = await fetch("/api/tests/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, code_submission: code }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Submit failed");
    }
    return data as {
      score: number;
      passed: boolean;
      feedback: string;
      strengths?: string[];
      improvements?: string[];
    };
  }

  if (step === "test" && task) {
    return (
      <SkillTestView
        task={task}
        skillName={skillName}
        level={level}
        onSubmit={handleSubmit}
        onBack={() => setStep("pick")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </button>
      <h2 className="text-xl font-semibold">Take next test</h2>
      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => {
          const currentLevel = developerLevels[skill.id] ?? 0;
          const nextLevel = currentLevel + 1;
          if (nextLevel > 10) return null;
          return (
            <div key={skill.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{skill.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Level {currentLevel} → {nextLevel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTakeTest(skill.id, skill.slug, nextLevel)}
                  disabled={loading}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {generatingFor === skill.id ? "Generating…" : "Start"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {skills.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Add skills to your profile to take tests.
        </p>
      )}
    </div>
  );
}
