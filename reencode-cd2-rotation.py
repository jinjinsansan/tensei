#!/usr/bin/env python3
"""
CD2ガチャ動画の回転メタデータ修正スクリプト
rotation: -90 が付いた動画を正しい縦向きに再エンコードして上書き保存する

使い方:
    python3 reencode-cd2-rotation.py
"""

import subprocess
import sys
from pathlib import Path

SOURCE_DIR = Path(__file__).parent / "炎映像" / "カウントダウンチャレンジ２ガチャ"
OUTPUT_DIR = SOURCE_DIR / "_reencoded"

def get_rotation(path: Path) -> int:
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_streams", str(path)],
        capture_output=True, text=True
    )
    import json
    data = json.loads(result.stdout)
    for stream in data.get("streams", []):
        for side in stream.get("side_data_list", []):
            if "rotation" in side:
                return int(side["rotation"])
    return 0

def reencode(src: Path, dst: Path) -> bool:
    """ffmpegの自動回転（display matrix適用）を利用して正しい縦向きで再エンコード
    transpose不要: ffmpegが rotation=-90 を読んで自動的にピクセルを回転してくれる"""
    cmd = [
        "ffmpeg", "-y",
        "-i", str(src),
        # フィルタ不要: ffmpegがdisplay matrixを自動適用してピクセルを正しい向きに変換
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",                  # 高品質
        "-pix_fmt", "yuv420p",         # iOS Safari 互換
        "-movflags", "+faststart",     # 先頭にメタデータ
        "-c:a", "aac", "-b:a", "128k",
        str(dst)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr[-300:]}")
        return False
    return True

def main():
    if not SOURCE_DIR.exists():
        print(f"❌ ソースディレクトリが見つかりません: {SOURCE_DIR}")
        sys.exit(1)

    OUTPUT_DIR.mkdir(exist_ok=True)

    mp4_files = sorted(SOURCE_DIR.glob("*.mp4"))
    if not mp4_files:
        print("❌ mp4ファイルが見つかりません")
        sys.exit(1)

    print(f"📁 ソース: {SOURCE_DIR}")
    print(f"📁 出力先: {OUTPUT_DIR}")
    print(f"🎬 対象: {len(mp4_files)} ファイル\n")

    success = 0
    skipped = 0
    failed = 0

    for src in mp4_files:
        rotation = get_rotation(src)
        dst = OUTPUT_DIR / src.name

        if rotation == 0:
            print(f"  ⏭  {src.name} (rotation=0, スキップ)")
            skipped += 1
            continue

        print(f"  🔄 {src.name} (rotation={rotation}) → 再エンコード中...")
        if reencode(src, dst):
            size_before = src.stat().st_size / 1024 / 1024
            size_after = dst.stat().st_size / 1024 / 1024
            print(f"     ✅ {size_before:.1f}MB → {size_after:.1f}MB")
            success += 1
        else:
            print(f"     ❌ 失敗")
            failed += 1

    print(f"\n{'='*50}")
    print(f"✅ 成功: {success}  ⏭  スキップ: {skipped}  ❌ 失敗: {failed}")
    print(f"\n出力先: {OUTPUT_DIR}")
    if success > 0:
        print("\n次のステップ:")
        print("  1. _reencoded/ フォルダの動画を確認")
        print("  2. 問題なければ元ファイルを上書き:")
        print("     cp _reencoded/*.mp4 .")
        print("  3. upload-cd2-to-r2.py を再実行してR2を更新")

if __name__ == "__main__":
    main()
