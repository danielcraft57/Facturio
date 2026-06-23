#!/usr/bin/env python3
"""Génère les images WebP pour les emails PrestaFacture (icône + bandeaux)."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "frontend" / "public" / "images" / "email"

# Palette alignée prestafacture.com (hero teal + finance)
TEAL_700 = (15, 118, 110)
TEAL_600 = (13, 148, 136)
TEAL_900 = (19, 78, 74)
BLUE_800 = (30, 64, 175)
GREEN_700 = (4, 120, 87)
AMBER_700 = (180, 83, 9)
RED_700 = (185, 28, 28)
WHITE = (255, 255, 255)


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def gradient_h(size: tuple[int, int], left: tuple[int, int, int], mid: tuple[int, int, int], right: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size)
    px = img.load()
    for x in range(w):
        t = x / max(w - 1, 1)
        if t < 0.5:
            tt = t * 2
            r = lerp(left[0], mid[0], tt)
            g = lerp(left[1], mid[1], tt)
            b = lerp(left[2], mid[2], tt)
        else:
            tt = (t - 0.5) * 2
            r = lerp(mid[0], right[0], tt)
            g = lerp(mid[1], right[1], tt)
            b = lerp(mid[2], right[2], tt)
        for y in range(h):
            px[x, y] = (r, g, b)
    return img


def add_orbs(base: Image.Image, orbs: list[tuple[int, int, int, tuple[int, int, int]]]) -> Image.Image:
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for cx, cy, radius, color in orbs:
        for r in range(radius, 0, -2):
            alpha = int(38 * (1 - r / radius))
            draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, alpha))
    blended = Image.alpha_composite(base.convert("RGBA"), overlay)
    return blended.convert("RGB")


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pad = size // 8
    radius = size // 5
    # Fond dégradé simulé
    bg = gradient_h((size, size), TEAL_700, TEAL_600, TEAL_900)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    bg_rgba = bg.convert("RGBA")
    bg_rgba.putalpha(mask)
    img = Image.alpha_composite(img, bg_rgba)

    draw = ImageDraw.Draw(img)
    doc_w = int(size * 0.46)
    doc_h = int(size * 0.56)
    doc_x = (size - doc_w) // 2
    doc_y = (size - doc_h) // 2 + size // 20
    doc_r = max(4, size // 16)
    draw.rounded_rectangle(
        (doc_x, doc_y, doc_x + doc_w, doc_y + doc_h),
        radius=doc_r,
        fill=(*WHITE, 245),
    )
    line_h = max(2, size // 28)
    line_gap = max(4, size // 14)
    lx0 = doc_x + doc_w // 6
    lx1 = doc_x + doc_w - doc_w // 6
    ly = doc_y + doc_h // 5
    for i in range(4):
        w = lx1 - lx0 if i < 3 else int((lx1 - lx0) * 0.55)
        draw.rounded_rectangle(
            (lx0, ly, lx0 + w, ly + line_h),
            radius=line_h // 2,
            fill=(*TEAL_600, 220 if i < 3 else 160),
        )
        ly += line_h + line_gap
    # Badge € discret
    badge_r = max(5, size // 10)
    bx = doc_x + doc_w - badge_r
    by = doc_y - badge_r // 2
    draw.ellipse((bx - badge_r, by - badge_r, bx + badge_r, by + badge_r), fill=(*BLUE_800, 255))
    draw.text((bx - badge_r // 3, by - badge_r // 2), "€", fill=(*WHITE, 255))

    return img


def draw_header(variant: str) -> Image.Image:
    w, h = 600, 140
    palettes = {
        "default": (TEAL_700, TEAL_600, TEAL_900),
        "quote": (TEAL_700, TEAL_600, BLUE_800),
        "success": (GREEN_700, TEAL_600, TEAL_900),
        "warning": (AMBER_700, TEAL_600, TEAL_900),
        "danger": (RED_700, TEAL_600, TEAL_900),
    }
    left, mid, right = palettes.get(variant, palettes["default"])
    img = gradient_h((w, h), left, mid, right)
    img = add_orbs(
        img,
        [
            (480, 20, 90, TEAL_600),
            (80, 110, 70, WHITE),
            (320, 60, 50, mid),
        ],
    )
    # Motif diagonal léger
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(-h, w + h, 28):
        od.line((i, 0, i + h, h), fill=(*WHITE, 12), width=1)
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    # Icône + wordmark
    icon = draw_icon(56)
    img_rgba = img.convert("RGBA")
    img_rgba.paste(icon, (28, 42), icon)
    draw = ImageDraw.Draw(img_rgba)
    try:
        from PIL import ImageFont

        font = ImageFont.truetype("arial.ttf", 28)
        font_sm = ImageFont.truetype("arial.ttf", 13)
    except OSError:
        font = ImageFont.load_default()
        font_sm = font
    draw.text((96, 48), "PrestaFacture", fill=(*WHITE, 255), font=font)
    draw.text((96, 82), "Devis · Factures · Paiement en ligne", fill=(255, 255, 255, 200), font=font_sm)
    return img_rgba.convert("RGB")


def save_webp(img: Image.Image, path: Path, quality: int = 90) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if img.mode == "RGBA":
        img.save(path, "WEBP", quality=quality, method=6, lossless=False)
    else:
        img.save(path, "WEBP", quality=quality, method=6)


def main() -> None:
    for size in (48, 96):
        icon = draw_icon(size)
        save_webp(icon, OUT / f"prestafacture-icon-{size}.webp")

    headers = {
        "header-default.webp": "default",
        "header-quote.webp": "quote",
        "header-success.webp": "success",
        "header-warning.webp": "warning",
        "header-danger.webp": "danger",
    }
    for filename, variant in headers.items():
        save_webp(draw_header(variant), OUT / filename, quality=88)

    print(f"Assets email écrits dans {OUT}")


if __name__ == "__main__":
    main()
