"""Process one M1 transcription job with FFmpeg and Gemini 3.5 Transcribe."""

from __future__ import annotations

import os
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import boto3
from google import genai
from supabase import Client, create_client
from yt_dlp import YoutubeDL

AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "ap-southeast-1")
GEMINI_MODEL = "gemini-3.5-transcribe"
CHUNK_SECONDS = 20 * 60
LANGUAGE_CODES = {"zh": "cmn-Hans-CN", "en": "en-US"}


def get_secret(name: str) -> str:
    response = boto3.client("secretsmanager", region_name=AWS_REGION).get_secret_value(
        SecretId=name
    )
    value = response.get("SecretString")
    if not value:
        raise RuntimeError(f"Secret {name} has no SecretString")
    return value


def create_database() -> Client:
    return create_client(get_secret("supabase-url"), get_secret("supabase-secret-key"))


def update_job(db: Client, job_id: str, **fields: Any) -> None:
    fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    db.table("jobs").update(fields).eq("id", job_id).execute()


def update_session(db: Client, session_id: str, **fields: Any) -> None:
    db.table("job_sessions").update(fields).eq("id", session_id).execute()


def prepare_work_dir(job_id: str) -> Path:
    work_dir = Path("/tmp") / job_id
    if work_dir.exists():
        shutil.rmtree(work_dir)
    work_dir.mkdir(mode=0o700)
    return work_dir


def download_media(url: str, work_dir: Path) -> Path:
    output_template = str(work_dir / "source.%(ext)s")
    options = {
        "outtmpl": output_template,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "restrictfilenames": True,
    }
    with YoutubeDL(options) as downloader:
        info = downloader.extract_info(url, download=True)
        path = Path(downloader.prepare_filename(info))
    if not path.exists():
        raise RuntimeError("Downloaded media file was not found")
    return path


def extract_audio(media: Path, work_dir: Path) -> Path:
    audio = work_dir / "audio.mp3"
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(media),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-b:a",
            "64k",
            str(audio),
        ],
        check=True,
    )
    return audio


def split_audio(audio: Path, work_dir: Path) -> list[Path]:
    chunk_dir = work_dir / "chunks"
    chunk_dir.mkdir()
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(audio),
            "-f",
            "segment",
            "-segment_time",
            str(CHUNK_SECONDS),
            "-c",
            "copy",
            str(chunk_dir / "chunk-%03d.mp3"),
        ],
        check=True,
    )
    chunks = sorted(chunk_dir.glob("chunk-*.mp3"))
    if not chunks:
        raise RuntimeError("FFmpeg produced no audio chunks")
    return chunks


def status_code(error: Exception) -> int | None:
    for candidate in (
        getattr(error, "code", None),
        getattr(error, "status_code", None),
        getattr(getattr(error, "response", None), "status_code", None),
    ):
        if isinstance(candidate, int):
            return candidate
    return None


def transcribe_chunk(client: genai.Client, chunk: Path, language: str, topic: str | None) -> str:
    language_code = LANGUAGE_CODES.get(language)
    config: dict[str, Any] = {
        "transcription_config": {
            "language_codes": [language_code] if language_code else [],
            "mode": "verbatim",
        }
    }
    if topic:
        config["transcription_config"]["custom_vocabulary"] = [topic]

    for attempt in range(4):
        uploaded = None
        try:
            uploaded = client.files.upload(file=str(chunk))
            interaction = client.interactions.create(
                model=GEMINI_MODEL,
                input=[
                    {
                        "type": "audio",
                        "uri": uploaded.uri,
                        "mime_type": uploaded.mime_type,
                    }
                ],
                generation_config=config,
            )
            text = interaction.output_text
            if not text:
                raise RuntimeError("Gemini returned an empty transcript")
            return text.strip()
        except Exception as error:
            code = status_code(error)
            retryable = code == 429 or (code is not None and code >= 500)
            if not retryable or attempt == 3:
                raise
            delay = 2**attempt
            print(f"Gemini transient error {code}; retrying in {delay}s", flush=True)
            time.sleep(delay)
        finally:
            if uploaded is not None and getattr(uploaded, "name", None):
                try:
                    client.files.delete(name=uploaded.name)
                except Exception as cleanup_error:
                    print(f"Gemini file cleanup warning: {cleanup_error}", flush=True)
    raise RuntimeError("Gemini transcription retries exhausted")


def main() -> None:
    job_id = os.environ["JOB_ID"]
    db = create_database()
    rows = db.table("jobs").select("*").eq("id", job_id).limit(1).execute().data
    if not rows:
        raise RuntimeError(f"Job {job_id} not found")
    job = rows[0]
    session_id = job.get("current_session_id")
    if not session_id:
        raise RuntimeError(f"Job {job_id} has no current session")

    work_dir = prepare_work_dir(job_id)
    update_job(db, job_id, status="downloading")
    print(f"[{job_id}] downloading {job['video_source_url']}", flush=True)
    media = download_media(job["video_source_url"], work_dir)
    audio = extract_audio(media, work_dir)

    update_job(db, job_id, status="transcribe")
    chunks = split_audio(audio, work_dir)
    print(f"[{job_id}] transcribing {len(chunks)} chunk(s)", flush=True)
    gemini = genai.Client(api_key=get_secret("gemini-api-key"))
    transcript = "\n\n".join(
        transcribe_chunk(gemini, chunk, job.get("language", "zh"), job.get("topic"))
        for chunk in chunks
    )

    update_session(db, session_id, subtitle_txt_content=transcript)
    update_job(db, job_id, status="done")
    print(f"[{job_id}] done — {len(transcript)} chars; files kept in {work_dir}", flush=True)


if __name__ == "__main__":
    main()
