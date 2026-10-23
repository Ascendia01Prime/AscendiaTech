"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/i18n";

export default function ProfileForm({
  userId,
  email,
  fullName,
  t,
}: {
  userId: string;
  email: string;
  fullName: string;
  t: Dictionary["account"];
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    const supabase = createClient();
    // Only full_name can be changed from the browser (database column permissions).
    const { error } = await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", userId);
    if (error) {
      setState("error");
      return;
    }
    setState("saved");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="label">
          {t.name}
        </label>
        <input id="profile-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="profile-email" className="label">
          {t.email}
        </label>
        <input id="profile-email" className="input opacity-70" value={email} readOnly />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={state === "saving"}>
          {state === "saving" ? t.saving : t.save}
        </button>
        {state === "saved" ? <span className="text-sm text-accent">{t.saved}</span> : null}
        {state === "error" ? (
          <span role="alert" className="text-sm text-danger">
            {t.saveError}
          </span>
        ) : null}
      </div>
    </form>
  );
}
