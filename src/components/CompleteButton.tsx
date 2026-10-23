"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { Dictionary } from "@/i18n";

export default function CompleteButton({
  lessonId,
  completed,
  nextHref,
  t,
}: {
  lessonId: string;
  completed: boolean;
  nextHref: string | null;
  t: Dictionary["learn"];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, completed: !completed }),
    });
    setLoading(false);
    if (!response.ok) return;

    // Finishing a lesson moves you on to the next one; un-marking just refreshes.
    if (!completed && nextHref) {
      router.push(nextHref);
    }
    router.refresh();
  }

  return (
    <button type="button" onClick={toggle} disabled={loading} className={completed ? "btn-ghost" : "btn-primary"}>
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      {completed ? t.completedUndo : nextHref ? t.markCompleteNext : t.markComplete}
    </button>
  );
}
