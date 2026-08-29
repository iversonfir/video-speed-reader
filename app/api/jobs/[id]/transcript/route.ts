import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data: job } = await admin
      .from("jobs")
      .select("id, status, current_session_id")
      .eq("id", id)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (job.status !== "done" || !job.current_session_id) {
      return NextResponse.json({ error: "not ready" }, { status: 409 });
    }

    const { data: session } = await admin
      .from("job_sessions")
      .select("subtitle_txt_content")
      .eq("id", job.current_session_id)
      .single();
    const transcript = session?.subtitle_txt_content;
    if (!transcript) {
      return NextResponse.json({ error: "transcript missing" }, { status: 500 });
    }

    return new NextResponse(transcript, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="transcript-${id.slice(0, 8)}.txt"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to download transcript", error);
    return NextResponse.json({ error: "無法下載逐字稿。" }, { status: 500 });
  }
}
