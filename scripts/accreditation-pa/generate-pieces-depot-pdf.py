#!/usr/bin/env python3
"""
Génère les PDF de pièces dépôt PA à partir des sources Markdown.

Usage (depuis la racine du dépôt) :
  python scripts/accreditation-pa/generate-pieces-depot-pdf.py

Sortie : docs/accreditation-pa/annexes/pieces-depot/*.pdf
Convention DGFiP : DanielCraft – Titre – AAAAMM.pdf
"""

from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[2]
PIECES_DIR = ROOT / "docs" / "accreditation-pa" / "annexes" / "pieces-depot"
SOURCE_DIR = PIECES_DIR / "source"
FONT_REGULAR = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")
PERIOD = date.today().strftime("%Y%m")

# Fichier source .md -> titre court pour le nom PDF
PIECE_TITLES: dict[str, str] = {
    "01-securite-donnees-personnelles-rgpd.md": "Securite donnees personnelles RGPD",
    "02-descriptif-emission-reception.md": "Descriptif emission reception",
    "03-descriptif-authentification.md": "Descriptif authentification",
    "04-descriptif-extraction-transmission.md": "Descriptif extraction transmission",
    "05-protocole-communication-ppf.md": "Protocole communication PPF",
    "06-declaration-hebergement-ue.md": "Declaration hebergement UE",
    "07-declaration-annuaire-central.md": "Declaration annuaire central",
}


def sanitize_text(text: str) -> str:
    """Normalise le texte pour fpdf2 (pas de glyphes problématiques)."""
    text = strip_inline_md(text)
    return (
        text.replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u2192", "->")
        .replace("\u00a0", " ")
    )


def write_multiline(pdf: PiecePdf, text: str, h: float = 6, font_size: int = 11, style: str = "") -> None:
    """multi_cell avec largeur effective et césure des tokens longs."""
    pdf.set_font("Arial", style, font_size)
    safe = sanitize_text(text)
    # Césure grossière des URLs / tokens sans espace
    safe = re.sub(r"(https?://\S+)", lambda m: m.group(1).replace("/", "/ "), safe)
    safe = re.sub(r"(\S{80,})", lambda m: " ".join(m.group(1)[i : i + 40] for i in range(0, len(m.group(1)), 40)), safe)
    pdf.multi_cell(pdf.epw, h, safe, new_x="LMARGIN", new_y="NEXT")


class PiecePdf(FPDF):
    """PDF A4 avec en-tête DanielCraft."""

    def __init__(self, doc_title: str) -> None:
        super().__init__()
        self.doc_title = doc_title
        self.add_font("Arial", "", str(FONT_REGULAR))
        self.add_font("Arial", "B", str(FONT_BOLD))
        self.set_auto_page_break(auto=True, margin=18)

    def header(self) -> None:
        self.set_font("Arial", "B", 9)
        self.set_text_color(90, 90, 90)
        self.cell(0, 8, f"DanielCraft / PrestaFacture — {self.doc_title}", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)
        self.set_text_color(0, 0, 0)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Arial", "", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")


def strip_inline_md(text: str) -> str:
    """Retire le markup inline Markdown courant."""
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"`(.+?)`", r"\1", text)
    text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)
    return text.strip()


def write_line(pdf: PiecePdf, line: str) -> None:
    """Écrit une ligne Markdown nettoyée dans le PDF."""
    raw = line.rstrip()

    if raw.strip() == "```":
        return

    if not raw or raw == "---":
        pdf.ln(2)
        return

    if raw.startswith("# "):
        pdf.ln(4)
        pdf.set_font("Arial", "B", 16)
        write_multiline(pdf, raw[2:], h=9, font_size=16, style="B")
        pdf.ln(2)
        return

    if raw.startswith("## "):
        pdf.ln(3)
        write_multiline(pdf, raw[3:], h=8, font_size=13, style="B")
        pdf.ln(1)
        return

    if raw.startswith("### "):
        pdf.ln(2)
        write_multiline(pdf, raw[4:], h=7, font_size=11, style="B")
        return

    if raw.startswith("|") and raw.endswith("|"):
        cells = [c.strip() for c in raw.strip("|").split("|")]
        if all(set(c) <= {"-", ":"} for c in cells):
            return
        write_multiline(pdf, " | ".join(strip_inline_md(c) for c in cells), h=5, font_size=10)
        return

    if raw.startswith("- [ ]") or raw.startswith("- [x]"):
        mark = "[ ]" if "[ ]" in raw[:6] else "[x]"
        write_multiline(pdf, f"{mark} {raw[6:].strip()}")
        return

    if raw.startswith("- "):
        write_multiline(pdf, f"• {raw[2:]}")
        return

    if re.match(r"^\d+\.\s", raw):
        write_multiline(pdf, raw)
        return

    if raw.startswith(">"):
        pdf.set_text_color(60, 60, 60)
        write_multiline(pdf, raw.lstrip("> ").strip(), font_size=10)
        pdf.set_text_color(0, 0, 0)
        return

    write_multiline(pdf, raw)


def markdown_to_pdf(md_path: Path, pdf_path: Path, doc_title: str) -> None:
    """Convertit un fichier Markdown en PDF."""
    content = md_path.read_text(encoding="utf-8")
    pdf = PiecePdf(doc_title)
    pdf.alias_nb_pages()
    pdf.add_page()

    for line in content.splitlines():
        write_line(pdf, line)

    pdf.output(str(pdf_path))


def main() -> int:
    if not FONT_REGULAR.is_file() or not FONT_BOLD.is_file():
        print("Polices Arial introuvables sous Windows.", file=sys.stderr)
        return 1

    generated = 0
    for md_name, title in PIECE_TITLES.items():
        md_path = SOURCE_DIR / md_name
        if not md_path.is_file():
            print(f"Source absente : {md_path}", file=sys.stderr)
            continue
        pdf_name = f"DanielCraft - {title} - {PERIOD}.pdf"
        pdf_path = PIECES_DIR / pdf_name
        markdown_to_pdf(md_path, pdf_path, title)
        print(f"OK {pdf_path.name}")
        generated += 1

    if generated == 0:
        print("Aucun PDF généré.", file=sys.stderr)
        return 1

    print(f"\n{generated} PDF générés dans {PIECES_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
