#!/usr/bin/env python3
"""Recadre les images OG PrestaFacture au format 1200×630 (ratio 1.91:1)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

TARGET_W = 1200
TARGET_H = 630
TARGET_RATIO = TARGET_W / TARGET_H

IMAGES_DIR = Path(__file__).resolve().parents[1] / "frontend" / "public" / "images"

OG_FILES = [
    "facturio-hero.png",
    "facturio-prestations.png",
    "facturio-features.png",
    "facturio-efacture.png",
    "facturio-pricing.png",
    "facturio-workflow.png",
]


def crop_to_ratio(img: Image.Image) -> Image.Image:
    """
    Recadre pour le ratio OG en préservant le coin bas-gauche
    (badge prestafacture.com).
    """
    w, h = img.size
    current_ratio = w / h
    if current_ratio > TARGET_RATIO:
        new_w = int(h * TARGET_RATIO)
        box = (0, 0, new_w, h)
    else:
        new_h = int(w / TARGET_RATIO)
        top = h - new_h
        box = (0, top, w, h)
    return img.crop(box)


def process(path: Path) -> None:
    """Recadre et redimensionne une image OG."""
    with Image.open(path) as img:
        rgb = img.convert("RGB")
        cropped = crop_to_ratio(rgb)
        resized = cropped.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
        resized.save(path, format="PNG", optimize=True)
    print(f"{path.name}: {TARGET_W}x{TARGET_H}")


def main() -> None:
    for name in OG_FILES:
        file_path = IMAGES_DIR / name
        if not file_path.exists():
            raise FileNotFoundError(file_path)
        process(file_path)


if __name__ == "__main__":
    main()
