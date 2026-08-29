"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function UploadForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setError(null);

    const form = new FormData(formElement);
    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_source_url: form.get("video_source_url"),
        topic: form.get("topic"),
        language: form.get("language"),
      }),
    });

    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "無法建立轉錄工作，請稍後再試。");
      setSubmitting(false);
      return;
    }

    formElement.reset();
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
      <div>
        <label htmlFor="video_source_url" className="mb-2 block text-sm font-medium">
          Video URL
        </label>
        <input
          id="video_source_url"
          name="video_source_url"
          type="url"
          required
          placeholder="Direct mp4 / mp3 URL (e.g. CloudFront, Vimeo, Internet Archive)"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
        />
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          M1 支援可直接下載的影音網址；目前不支援 YouTube 網址。
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="topic" className="mb-2 block text-sm font-medium">
            Topic
          </label>
          <input
            id="topic"
            name="topic"
            type="text"
            maxLength={120}
            placeholder="訪談、課程、會議…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
          />
        </div>
        <div>
          <label htmlFor="language" className="mb-2 block text-sm font-medium">
            Language hint
          </label>
          <select
            id="language"
            name="language"
            defaultValue="zh"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
          >
            <option value="zh">繁體中文</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="justify-self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "建立工作中…" : "Transcribe"}
      </button>
    </form>
  );
}
