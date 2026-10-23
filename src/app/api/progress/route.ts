import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { lessonId?: unknown; completed?: unknown } | null;
  if (!body || typeof body.lessonId !== "string" || typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Row rules make sure people can only touch their own progress, on lessons they can see.
  if (body.completed) {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert({ user_id: user.id, lesson_id: body.lessonId }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: "generic" }, { status: 400 });
  } else {
    const { error } = await supabase
      .from("lesson_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", body.lessonId);
    if (error) return NextResponse.json({ error: "generic" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
