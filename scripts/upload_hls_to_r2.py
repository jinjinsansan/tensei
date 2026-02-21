#!/usr/bin/env python3
"""
Upload HLS output to Cloudflare R2.

Prerequisites:
- pip install boto3
- Environment variables:
    CLOUDFLARE_R2_ACCOUNT_ID
    CLOUDFLARE_R2_ACCESS_KEY_ID
    CLOUDFLARE_R2_SECRET_ACCESS_KEY
    CLOUDFLARE_R2_BUCKET (default: sonshi)

Usage:
  python3 scripts/upload_hls_to_r2.py \
    --source ./hls_output \
    --prefix videos/hls

This mirrors the local directory structure under the given prefix.
Example: ./hls_output/characters/kenta/title/kenta_title_c01/master.m3u8
will be uploaded as videos/hls/characters/kenta/title/kenta_title_c01/master.m3u8
"""

from __future__ import annotations

import argparse
import mimetypes
import os
import sys
from pathlib import Path

try:
    import boto3
except ImportError:  # pragma: no cover
    print("boto3 is required. Install with: pip install boto3", file=sys.stderr)
    sys.exit(1)


def get_env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None:
        raise SystemExit(f"Missing environment variable: {name}")
    return value


def upload_directory(source_root: Path, prefix: str, bucket: str, client) -> None:  # type: ignore[override]
    files = [p for p in source_root.rglob("*") if p.is_file()]
    print(f"[info] uploading {len(files)} files from {source_root} -> s3://{bucket}/{prefix}")

    for idx, path in enumerate(files, 1):
        rel = path.relative_to(source_root).as_posix()
        key = f"{prefix.rstrip('/')}/{rel}"
        content_type, _ = mimetypes.guess_type(path.name)
        extra_args = {"ContentType": content_type} if content_type else None
        print(f"[{idx}/{len(files)}] {key}")
        client.upload_file(str(path), bucket, key, ExtraArgs=extra_args or {})


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload HLS assets to Cloudflare R2")
    parser.add_argument("--source", default="./hls_output", help="Local HLS root directory")
    parser.add_argument("--prefix", default="videos/hls", help="Remote key prefix in the bucket")
    args = parser.parse_args()

    source_root = Path(args.source).resolve()
    if not source_root.exists():
        raise SystemExit(f"Source directory not found: {source_root}")

    account_id = get_env("CLOUDFLARE_R2_ACCOUNT_ID")
    access_key = get_env("CLOUDFLARE_R2_ACCESS_KEY_ID")
    secret_key = get_env("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
    bucket = get_env("CLOUDFLARE_R2_BUCKET", "sonshi")

    endpoint = f"https://{account_id}.r2.cloudflarestorage.com"
    session = boto3.session.Session()
    client = session.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    )

    upload_directory(source_root, args.prefix, bucket, client)


if __name__ == "__main__":
    main()
