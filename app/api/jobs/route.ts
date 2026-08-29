import { NextResponse } from "next/server";
import { JOB_LANGUAGES, isSupportedMediaUrl } from "@/lib/jobs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CreateJobBody = {
  video_source_url?: unknown;
  topic?: unknown;
  language?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateJobBody;
  const videoSourceUrl =
    typeof body.video_source_url === "string" ? body.video_source_url.trim() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 120) : null;
  const language =
    typeof body.language === "string" && JOB_LANGUAGES.includes(body.language as "zh" | "en")
      ? body.language
      : "zh";

  if (!isSupportedMediaUrl(videoSourceUrl)) {
    return NextResponse.json(
      { error: "請提供可直接下載的 http(s) 影音網址；M1 目前不支援 YouTube。" },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    const { data: job, error: jobError } = await admin
      .from("jobs")
      .insert({
        user_id: authData.user.id,
        video_source_url: videoSourceUrl,
        topic: topic || null,
        language,
        status: "pending",
      })
      .select("id")
      .single();

    if (jobError) throw jobError;

    const { data: session, error: sessionError } = await admin
      .from("job_sessions")
      .insert({ job_id: job.id, session_number: 1 })
      .select("id")
      .single();

    if (sessionError) {
      await admin.from("jobs").delete().eq("id", job.id);
      throw sessionError;
    }

    const { error: updateError } = await admin
      .from("jobs")
      .update({ current_session_id: session.id, updated_at: new Date().toISOString() })
      .eq("id", job.id);

    if (updateError) throw updateError;
    return NextResponse.json({ job_id: job.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create transcription job", error);
    return NextResponse.json({ error: "無法建立轉錄工作。" }, { status: 500 });
  }
}
