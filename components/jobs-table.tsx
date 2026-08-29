import type { JobListItem } from "@/lib/jobs";

const statusLabel: Record<JobListItem["status"], string> = {
  pending: "Pending",
  downloading: "Downloading",
  transcribe: "Transcribing",
  done: "Done",
};

const statusClass: Record<JobListItem["status"], string> = {
  pending: "bg-white/5 text-muted-foreground",
  downloading: "bg-white/5 text-muted-foreground",
  transcribe: "bg-blue-500/15 text-blue-300",
  done: "bg-emerald-400/15 text-emerald-300",
};

export function JobsTable({ jobs }: { jobs: JobListItem[] }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
        No transcriptions yet. Submit your first video below.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <tr>
            <th className="px-5 py-4 font-medium">Created</th>
            <th className="px-5 py-4 font-medium">URL</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium">Transcript</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {jobs.map((job) => (
            <tr key={job.id}>
              <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                {new Intl.DateTimeFormat("zh-TW", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(job.created_at))}
              </td>
              <td className="max-w-xs truncate px-5 py-4" title={job.video_source_url}>
                {job.video_source_url.length > 50
                  ? `${job.video_source_url.slice(0, 50)}…`
                  : job.video_source_url}
              </td>
              <td className="px-5 py-4">
                <span className={`rounded-full px-2.5 py-1 text-xs ${statusClass[job.status]}`}>
                  {statusLabel[job.status]}
                </span>
              </td>
              <td className="px-5 py-4">
                {job.status === "done" ? (
                  <a
                    href={`/api/jobs/${job.id}/transcript`}
                    download={`transcript-${job.id.slice(0, 8)}.txt`}
                    className="font-medium text-primary hover:underline"
                  >
                    .txt
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
