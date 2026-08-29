export const JOB_LANGUAGES = ["zh", "en"] as const;
export type JobLanguage = (typeof JOB_LANGUAGES)[number];

export const TRANSCRIPT_FORMATS = ["sentences", "timestamps"] as const;
export type TranscriptFormat = (typeof TRANSCRIPT_FORMATS)[number];

export type JobListItem = {
  id: string;
  created_at: string;
  video_source_url: string;
  status: "pending" | "downloading" | "transcribe" | "done";
};

export function isSupportedMediaUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      host !== "youtube.com" &&
      host !== "www.youtube.com" &&
      host !== "youtu.be" &&
      !host.endsWith(".youtube.com")
    );
  } catch {
    return false;
  }
}
