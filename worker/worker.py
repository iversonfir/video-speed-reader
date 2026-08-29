"""Process one M1 transcription job with FFmpeg and Gemini 3.5 Transcribe."""

from __future__ import annotations

import os
import re
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


def extract_word_annotations(interaction: Any) -> list[Any]:
    words = []
    for step in getattr(interaction, "steps", []) or []:
        for content in getattr(step, "content", []) or []:
            for annotation in getattr(content, "annotations", []) or []:
                if getattr(annotation, "type", None) == "word_info":
                    words.append(annotation)
    return words


def sentence_lines(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []
    sentences = [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?。！？])\s+", normalized)
        if sentence.strip()
    ]
    if len(sentences) > 1:
        return sentences
    words = normalized.split()
    return [" ".join(words[index : index + 24]) for index in range(0, len(words), 24)]


def offset_seconds(value: Any) -> float:
    match = re.fullmatch(r"([0-9]+(?:\.[0-9]+)?)s", str(value or ""))
    return float(match.group(1)) if match else 0.0


def timestamp_label(seconds: float) -> str:
    total_seconds = max(0, round(seconds))
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def format_transcript(
    text: str,
    annotations: list[Any],
    transcript_format: str,
    chunk_offset: float,
) -> str:
    sentences = sentence_lines(text)
    if transcript_format != "timestamps":
        return "\n".join(sentences)

    lines = []
    annotation_index = 0
    for sentence in sentences:
        sentence_word_count = max(1, len(sentence.split()))
        annotation = annotations[min(annotation_index, len(annotations) - 1)] if annotations else None
        start = chunk_offset + offset_seconds(getattr(annotation, "start_offset", None))
        lines.append(f"[{timestamp_label(start)}] {sentence}")
        annotation_index += sentence_word_count
    return "\n".join(lines)


def transcribe_chunk(
    client: genai.Client,
    chunk: Path,
    language: str,
    topic: str | None,
    transcript_format: str,
    chunk_offset: float,
) -> str:
    language_code = LANGUAGE_CODES.get(language)
    mode: Any = "smart"
    if transcript_format == "timestamps":
        mode = {"type": "verbatim", "timestamp_granularities": ["word"]}
    config: dict[str, Any] = {
        "transcription_config": {
            "language_codes": [language_code] if language_code else [],
            "mode": mode,
        }
    }
    if topic and transcript_format != "timestamps":
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
            return format_transcript(
                text,
                extract_word_annotations(interaction),
                transcript_format,
                chunk_offset,
            )
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
    try:
        update_job(db, job_id, status="downloading")
        print(f"[{job_id}] downloading {job['video_source_url']}", flush=True)
        media = download_media(job["video_source_url"], work_dir)
        audio = extract_audio(media, work_dir)

        update_job(db, job_id, status="transcribe")
        chunks = split_audio(audio, work_dir)
        print(f"[{job_id}] transcribing {len(chunks)} chunk(s)", flush=True)
        gemini = genai.Client(api_key=get_secret("gemini-api-key"))
        transcript_format = job.get("transcript_format", "sentences")
        transcript = "\n".join(
            transcribe_chunk(
                gemini,
                chunk,
                job.get("language", "zh"),
                job.get("topic"),
                transcript_format,
                index * CHUNK_SECONDS,
            )
            for index, chunk in enumerate(chunks)
        )

        update_session(db, session_id, subtitle_txt_content=transcript)
        update_job(db, job_id, status="done")
        print(
            f"[{job_id}] done — {len(transcript)} chars; files kept in {work_dir}",
            flush=True,
        )
    except Exception:
        try:
            update_job(db, job_id, status="failed")
        except Exception as status_error:
            print(f"[{job_id}] failed to persist error status: {status_error}", flush=True)
        raise


if __name__ == "__main__":
    main()
