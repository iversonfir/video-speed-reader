import Link from "next/link";
import { redirect } from "next/navigation";
import { JobsTable } from "@/components/jobs-table";
import { SignOutButton } from "@/components/sign-out-button";
import { UploadForm } from "@/components/upload-form";
import type { JobListItem } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) redirect("/auth");

  const { data, error } = await supabase
    .from("jobs")
    .select("id, created_at, video_source_url, status")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(`Unable to load jobs: ${error.message}`);
  const jobs = (data ?? []) as JobListItem[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/upload" className="text-lg font-semibold tracking-tight">
            Video Speed Reader
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {authData.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-8">
          <p className="font-mono text-xs tracking-[0.18em] text-primary">
            M1 / TRANSCRIPTION QUEUE
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">影片逐字稿工作台</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            提交直接影音網址，背景 worker 完成後即可下載 TXT。
          </p>
        </div>

        <section aria-labelledby="jobs-heading">
          <h2 id="jobs-heading" className="mb-4 text-lg font-semibold">
            Recent jobs
          </h2>
          <JobsTable jobs={jobs} />
        </section>

        <section
          className="mt-10 rounded-xl border border-border bg-card p-6 sm:p-8"
          aria-labelledby="new-job-heading"
        >
          <h2 id="new-job-heading" className="text-lg font-semibold">
            New transcription
          </h2>
          <UploadForm />
        </section>
      </main>
    </div>
  );
}
