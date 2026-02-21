#!/usr/bin/env python3
"""
HLS (HTTP Live Streaming) encoder

Converts all .mp4 files under an input directory into 3 variant bitrates
(360p / 720p / 1080p) and generates a master playlist.

Usage examples:

  python3 scripts/encode_to_hls.py \
    --input public/videos/characters \
    --output ./hls_output

  python3 scripts/encode_to_hls.py --force --max-files 5

Notes:
- Requires ffmpeg to be installed and available in PATH.
- Output is NOT added to git; upload separately (see upload_hls_to_r2.py).
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path
from typing import Iterable, List, Tuple


PROFILES: List[Tuple[str, int, int, str, str, str, str]] = [
    # (name, width, height, video_bitrate, maxrate, bufsize, audio_bitrate)
    ("360p", 640, 360, "800k", "900k", "1200k", "64k"),
    ("720p", 1280, 720, "2500k", "3000k", "5000k", "96k"),
    ("1080p", 1920, 1080, "5000k", "6000k", "8000k", "128k"),
]


def run(cmd: Iterable[str]) -> None:
    proc = subprocess.run(list(cmd), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if proc.returncode != 0:
        sys.stdout.buffer.write(proc.stdout)
        raise RuntimeError(f"ffmpeg failed with exit code {proc.returncode}")


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def encode_variants(input_path: Path, out_dir: Path, force: bool) -> None:
    ensure_dir(out_dir)
    master = out_dir / "master.m3u8"
    if master.exists() and not force:
        print(f"[skip] {input_path} (master exists)")
        return

    for name, width, height, v_bitrate, maxrate, bufsize, a_bitrate in PROFILES:
        variant_playlist = out_dir / f"{name}.m3u8"
        segment_pattern = out_dir / f"{name}_%03d.ts"
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-vf",
            f"scale=-2:{height}",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-profile:v",
            "main",
            "-crf",
            "23" if height >= 720 else "26",
            "-g",
            "48",
            "-sc_threshold",
            "0",
            "-b:v",
            v_bitrate,
            "-maxrate",
            maxrate,
            "-bufsize",
            bufsize,
            "-c:a",
            "aac",
            "-ar",
            "48000",
            "-b:a",
            a_bitrate,
            "-ac",
            "2",
            "-hls_time",
            "4",
            "-hls_playlist_type",
            "vod",
            "-hls_segment_filename",
            str(segment_pattern),
            "-hls_flags",
            "independent_segments",
            str(variant_playlist),
        ]
        print(f"[ffmpeg] {input_path.name} -> {variant_playlist.relative_to(out_dir)}")
        run(cmd)

    master_content = [
        "#EXTM3U",
    ]
    for name, _, height, v_bitrate, _, _, _ in PROFILES:
        bandwidth = bitrate_to_int(v_bitrate)
        resolution = f"{width_for_height(height)}x{height}"
        master_content.append(f"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={resolution}")
        master_content.append(f"{name}.m3u8")

    master.write_text("\n".join(master_content) + "\n", encoding="utf-8")
    print(f"[ok] master playlist written: {master}")


def bitrate_to_int(text: str) -> int:
    # "800k" -> 800000
    if text.endswith("k"):
        return int(text[:-1]) * 1000
    if text.endswith("M"):
        return int(text[:-1]) * 1_000_000
    return int(text)


def width_for_height(height: int) -> int:
    if height == 360:
        return 640
    if height == 720:
        return 1280
    if height == 1080:
        return 1920
    return 1280


def main() -> None:
    parser = argparse.ArgumentParser(description="Encode mp4 files to HLS (360p/720p/1080p)")
    parser.add_argument("--input", default="public/videos", help="Input directory containing mp4 files")
    parser.add_argument("--output", default="./hls_output", help="Output directory for HLS assets")
    parser.add_argument("--force", action="store_true", help="Overwrite existing outputs")
    parser.add_argument("--max-files", type=int, default=0, help="Process at most N files (0 = all)")
    args = parser.parse_args()

    input_root = Path(args.input).resolve()
    output_root = Path(args.output).resolve()

    if not input_root.exists():
        print(f"[error] input path not found: {input_root}")
        sys.exit(1)

    mp4_files = list(input_root.rglob("*.mp4"))
    if args.max_files:
        mp4_files = mp4_files[: args.max_files]

    print(f"[info] found {len(mp4_files)} mp4 files under {input_root}")
    for idx, mp4_path in enumerate(mp4_files, 1):
        rel = mp4_path.relative_to(input_root)
        out_dir = output_root / rel.parent / mp4_path.stem
        print(f"[{idx}/{len(mp4_files)}] {rel}")
        try:
            encode_variants(mp4_path, out_dir, force=args.force)
        except Exception as exc:  # noqa: BLE001
            print(f"[error] failed: {mp4_path}: {exc}")


if __name__ == "__main__":
    main()
