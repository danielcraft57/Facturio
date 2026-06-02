#!/usr/bin/env python3
"""
Monte une pub MP4 : images (captures) + piste TTS + sous-titres incrustés.

Prérequis : ffmpeg dans le PATH, captures + audio + subtitles générés.

  python scripts/marketing/build_pub_video.py --variant 30s-main
  npm run marketing:video
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
PUB_ROOT = REPO_ROOT / "docs" / "marketing" / "pub-2026"
STORYBOARD = PUB_ROOT / "storyboard.json"


def _ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if not exe:
        raise SystemExit("ffmpeg introuvable — installez-le et ajoutez-le au PATH.")
    return exe


def _segment_duration_ms(audio_path: Path, pause_ms: int) -> int:
    from pydub import AudioSegment

    if not audio_path.is_file():
        return 3000
    return len(AudioSegment.from_file(str(audio_path))) + pause_ms


def _resolve_capture(captures: Path, slug: str) -> Path | None:
    for ext in (".jpeg", ".jpg", ".png"):
        candidate = captures / f"{slug}{ext}"
        if candidate.is_file():
            return candidate
    return None


def _load_variant(variant_id: str) -> dict:
    data = json.loads(STORYBOARD.read_text(encoding="utf-8"))
    for v in data.get("variants") or []:
        if v.get("id") == variant_id:
            return v
    raise SystemExit(f"Variante inconnue: {variant_id}")


def _build_slideshow(variant: dict, variant_id: str, work: Path, pause_ms: int) -> tuple[Path, list[dict]]:
    """Retourne (video_sans_audio, segments timing pour debug)."""
    ffmpeg = _ffmpeg()
    captures = PUB_ROOT / "captures"
    audio_dir = PUB_ROOT / "audio" / variant_id
    segments = variant.get("segments") or []
    timings: list[dict] = []
    t_ms = 0

    list_path = work / "slides.txt"
    lines: list[str] = []

    for seg in segments:
        seg_id = seg.get("id") or "seg"
        slug = seg.get("captureSlug") or "dashboard"
        text = (seg.get("text") or "").strip()
        if not text:
            continue
        img = _resolve_capture(captures, slug)
        if img is None:
            print(f"  skip image manquante: {slug}.{{jpeg|png}}")
            continue
        audio = audio_dir / f"segment_{seg_id}.mp3"
        dur_s = _segment_duration_ms(audio, pause_ms) / 1000.0
        timings.append({"id": seg_id, "start_ms": t_ms, "duration_ms": int(dur_s * 1000), "text": text})
        t_ms += int(dur_s * 1000)
        # ffmpeg concat demuxer — repeat frame
        lines.append(f"file '{img.as_posix()}'")
        lines.append(f"duration {dur_s:.3f}")
    if not lines:
        raise SystemExit("Aucune image — lancez npm run marketing:capture")

    # derniere image sans duration
    last_file = lines[-1].split("'", 2)[1]
    lines.append(f"file '{last_file}'")

    list_path.write_text("\n".join(lines), encoding="utf-8")
    silent_video = work / "slideshow.mp4"
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_path),
            "-vf",
            "scale=1600:2400:force_original_aspect_ratio=decrease,pad=1600:2400:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
            "-r",
            "30",
            str(silent_video),
        ],
        check=True,
    )
    return silent_video, timings


def _mux_audio(video: Path, audio: Path, out: Path) -> None:
    ffmpeg = _ffmpeg()
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-i",
            str(video),
            "-i",
            str(audio),
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            str(out),
        ],
        check=True,
    )


def _burn_subs(video: Path, srt: Path, out: Path) -> None:
    ffmpeg = _ffmpeg()
    # chemins Windows : échapper pour le filtre subtitles
    srt_esc = srt.resolve().as_posix().replace(":", "\\:").replace("'", "\\'")
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-i",
            str(video),
            "-vf",
            f"subtitles='{srt_esc}':force_style='FontName=Arial,FontSize=22,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=60'",
            "-c:a",
            "copy",
            str(out),
        ],
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--variant", default="30s-main")
    parser.add_argument("--pause-ms", type=int, default=None)
    args = parser.parse_args()

    variant = _load_variant(args.variant)
    meta = json.loads(STORYBOARD.read_text(encoding="utf-8")).get("meta") or {}
    pause_ms = args.pause_ms if args.pause_ms is not None else int(meta.get("pause_between_segments_ms") or 450)

    audio_full = PUB_ROOT / "audio" / args.variant / "full.mp3"
    if not audio_full.is_file():
        raise SystemExit(f"Piste audio manquante: {audio_full} — npm run marketing:tts")

    srt = PUB_ROOT / "subtitles" / f"{args.variant}.srt"
    if not srt.is_file():
        raise SystemExit(f"Sous-titres manquants: {srt} — npm run marketing:tts")

    exports = PUB_ROOT / "exports"
    exports.mkdir(parents=True, exist_ok=True)
    final = exports / f"facturio-pub-{args.variant}.mp4"

    with tempfile.TemporaryDirectory(prefix="facturio_pub_") as tmp:
        work = Path(tmp)
        print(f"Montage {args.variant}…")
        slideshow, _timings = _build_slideshow(variant, args.variant, work, pause_ms)
        with_audio = work / "with_audio.mp4"
        _mux_audio(slideshow, audio_full, with_audio)
        _burn_subs(with_audio, srt, final)

    print(f"\nExport : {final}")


if __name__ == "__main__":
    main()
