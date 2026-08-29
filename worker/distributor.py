"""Poll pending M1 jobs every ten seconds and spawn one worker process per job."""

from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

import boto3
from supabase import create_client

AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "ap-southeast-1")
WORKER = Path(__file__).with_name("worker.py")
PYTHON = sys.executable
POLL_SECONDS = 10


def get_secret(name: str) -> str:
    response = boto3.client("secretsmanager", region_name=AWS_REGION).get_secret_value(
        SecretId=name
    )
    value = response.get("SecretString")
    if not value:
        raise RuntimeError(f"Secret {name} has no SecretString")
    return value


def main() -> None:
    db = create_client(get_secret("supabase-url"), get_secret("supabase-secret-key"))
    while True:
        try:
            rows = db.table("jobs").select("id").eq("status", "pending").execute().data
            for row in rows:
                env = {**os.environ, "JOB_ID": row["id"]}
                subprocess.Popen([PYTHON, str(WORKER)], env=env)
                print(f"spawned worker for job {row['id']}", flush=True)
        except Exception as error:
            print(f"poll error: {error}", flush=True)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
