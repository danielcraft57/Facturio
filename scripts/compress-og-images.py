#!/usr/bin/env python3
"""Compresse les images OG PrestaFacture en JPEG (< 300 Ko par défaut)."""

from __future__ import annotations

import io
from pathlib import Path

from PIL import Image

MAX_BYTES = 300 * 1024
TARGET_W = 1200
TARGET_H = 630

IMAGES_DIR = Path(__file__).resolve().parents[1] / "frontend" / "public" / "images"

OG_STEMS = [
    "facturio-hero",
    "facturio-prestations",
    "facturio-features",
    "facturio-efacture",
    "facturio-pricing",
    "facturio-workflow",
]


def compress_jpeg(img: Image.Image, dest: Path) -> int:
    """
    Enregistre une image JPEG en ajustant la qualité pour rester sous MAX_BYTES.

    @param img Image RGB 1200×630
    @param dest Chemin de sortie .jpg
    @returns Taille finale en octets
    """
    rgb = img.convert("RGB")
    best: bytes | None = None

    for quality in range(92, 58, -2):
        buffer = io.BytesIO()
        rgb.save(buffer, format="JPEG", quality=quality, optimize=True, progressive=True)
        data = buffer.getvalue()
        if len(data) <= MAX_BYTES:
            best = data
            break
        best = data

    if best is None:
        raise RuntimeError(f"Compression impossible pour {dest.name}")

    dest.write_bytes(best)
    return len(best)


def process(stem: str) -> None:
    """Compresse une image OG (source PNG ou JPG existante)."""
    png_path = IMAGES_DIR / f"{stem}.png"
    jpg_path = IMAGES_DIR / f"{stem}.jpg"

    source = png_path if png_path.exists() else jpg_path
    if not source.exists():
        raise FileNotFoundError(source)

    with Image.open(source) as img:
        if img.size != (TARGET_W, TARGET_H):
            raise ValueError(f"{source.name}: attendu {TARGET_W}x{TARGET_H}, reçu {img.size}")
        size = compress_jpeg(img, jpg_path)

    if png_path.exists() and png_path != jpg_path:
        png_path.unlink()

    print(f"{stem}.jpg: {size // 1024} Ko")


def main() -> None:
    for stem in OG_STEMS:
        process(stem)


if __name__ == "__main__":
    main()
