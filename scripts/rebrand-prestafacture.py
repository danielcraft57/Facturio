#!/usr/bin/env python3
"""Rebranding Facturio -> PrestaFacture (marque et domaine public)."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

INCLUDE_DIRS = [
    ROOT / "frontend" / "src",
    ROOT / "frontend",
    ROOT / "server" / "src",
    ROOT / "server" / "scripts",
    ROOT / "server" / "prisma",
    ROOT / "server",
    ROOT / "mobile",
    ROOT / "docs",
    ROOT / "scripts" / "marketing",
    ROOT / "scripts" / "email",
    ROOT / "scripts" / "deploy",
    ROOT / "scripts" / "windows",
    ROOT / "scripts" / "linux",
    ROOT / "scripts" / "accreditation-pa",
    ROOT / ".github",
]

INCLUDE_ROOT_FILES = [
    ROOT / "README.md",
    ROOT / "AGENTS.md",
    ROOT / "package.json",
    ROOT / ".gitignore",
    ROOT / "scripts" / "generate-domain-report-pdf.py",
    ROOT / "scripts" / "generate-commercial-brochure-pdf.py",
]

EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".json",
    ".html",
    ".md",
    ".example",
    ".txt",
    ".py",
    ".ps1",
    ".sh",
    ".yml",
    ".yaml",
    ".conf",
    ".template",
}

SKIP_PARTS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "coverage",
    "scripts/seo/reports",
    "package-lock.json",
    "mobile/package-lock.json",
    "docs/marketing/pub-2026/videos",
    "server/tmp",
    "scripts/rebrand-prestafacture.py",
}

# Ne pas renommer les identifiants techniques internes.
SKIP_SUBSTRINGS = [
    "Factur-X",
    "FacturX",
    "factur-x",
    "FacturioCrossIndustryInvoice",
    "renderFacturioEmailLayout",
    "renderSimpleFacturioEmail",
    "facturio-icon",
    "facturio-hero",
    "facturio-features",
    "facturio-publicite",
    "facturio-update",
    "facturio-reverse-proxy",
    "facturio-frontend",
    "facturio-tuning",
    "init-facturio",
    "grant-facturio",
    "pre-migrate-facturio",
    "ops-facturio",
    "facturio_api",
    "facturio_frontend",
    "facturio:",
    "postgresql://facturio:",
    "@localhost:5432/facturio",
    "DATABASE_APP_NAME=facturio",
    "generate_facturio_marketing",
    "build_pub_video",
    "04-dossier-technique-facturio",
]


def should_skip(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    for part in SKIP_PARTS:
        if part in rel:
            return True
    return False


def transform(content: str, path: Path) -> str:
    original = content

    # Domaine public
    content = content.replace("facturio.danielcraft.fr", "prestafacture.com")
    content = content.replace("https://facturio.YOUR_DOMAIN", "https://prestafacture.com")
    content = content.replace("http://facturio.YOUR_DOMAIN", "https://prestafacture.com")
    content = re.sub(
        r"https://devis\.YOUR_DOMAIN",
        "https://devis.prestafacture.com",
        content,
    )
    content = re.sub(
        r"https://facture\.YOUR_DOMAIN",
        "https://facture.prestafacture.com",
        content,
    )

    # Constantes / propriétés légales
    content = content.replace("FACTURIO_SERVICE", "PRESTAFACTURE_SERVICE")
    content = content.replace("facturioLegalUpdated", "prestafactureLegalUpdated")
    content = content.replace("showFacturio", "showPrestaFacture")

    # Marque affichée
    content = re.sub(r"\bFacturio\b", "PrestaFacture", content)

    # En-têtes env commentés
    content = content.replace("# FACTURIO -", "# PRESTAFACTURE -")
    content = content.replace("# FACTURIO FRONTEND", "# PRESTAFACTURE FRONTEND")
    content = content.replace("FACTURIO_PUBLIC_APP_URL", "PRESTAFACTURE_PUBLIC_APP_URL")

    # Dépôt GitHub (nom du repo inchangé)
    content = content.replace("danielcraft57/PrestaFacture", "danielcraft57/Facturio")
    content = content.replace("loupix/PrestaFacture", "loupix/Facturio")

    # Restaurer les identifiants techniques écrasés par erreur
    for token in SKIP_SUBSTRINGS:
        if token in original:
            # Si le token contenait Facturio, on ne le touche pas via le remplacement global
            pass

    # Corrections post-remplacement pour identifiants techniques
    content = content.replace("postgresql://PrestaFacture:", "postgresql://facturio:")
    content = content.replace("@localhost:5432/PrestaFacture", "@localhost:5432/facturio")
    content = content.replace("DATABASE_APP_NAME=PrestaFacture_api", "DATABASE_APP_NAME=facturio_api")
    content = content.replace("upstream PrestaFacture_frontend", "upstream facturio_frontend")
    content = content.replace("upstream PrestaFacture_api", "upstream facturio_api")
    content = content.replace("http://PrestaFacture_api", "http://facturio_api")
    content = content.replace("http://PrestaFacture_frontend", "http://facturio_frontend")
    content = content.replace("/var/log/nginx/PrestaFacture_", "/var/log/nginx/facturio_")
    content = content.replace("renderPrestaFactureEmailLayout", "renderFacturioEmailLayout")
    content = content.replace("renderSimplePrestaFactureEmail", "renderSimpleFacturioEmail")
    content = content.replace("PrestaFacture-icon", "facturio-icon")
    content = content.replace("PrestaFacture-hero", "facturio-hero")
    content = content.replace("PrestaFacture-features", "facturio-features")
    content = content.replace("prestafacture-update.sh", "facturio-update.sh")
    content = content.replace("prestafacture-reverse-proxy", "facturio-reverse-proxy")
    content = content.replace("ops-prestafacture.sh", "ops-facturio.sh")
    content = content.replace("init-prestafacture.sql", "init-facturio.sql")
    content = content.replace("grant-prestafacture-role.sql", "grant-facturio-role.sql")
    content = content.replace("pre-migrate-prestafacture-ownership.sql", "pre-migrate-facturio-ownership.sql")
    content = content.replace("prestafacture-tuning.conf", "facturio-tuning.conf")
    content = content.replace("prestafacture-frontend-nginx-app.conf", "facturio-frontend-nginx-app.conf")
    content = content.replace("generate_prestafacture_marketing", "generate_facturio_marketing")
    content = content.replace("prestafacture-publicite", "facturio-publicite")
    content = content.replace("04-dossier-technique-prestafacture", "04-dossier-technique-facturio")
    content = content.replace("PrestaFactureCrossIndustryInvoice", "FacturioCrossIndustryInvoice")

    return content


def iter_files() -> list[Path]:
    files: list[Path] = []
    for base in INCLUDE_DIRS:
        if not base.exists():
            continue
        if base.is_file():
            files.append(base)
            continue
        for path in base.rglob("*"):
            if not path.is_file():
                continue
            if should_skip(path):
                continue
            if path.suffix.lower() in EXTENSIONS or path.name in {"env.example", "env.prod.example"}:
                files.append(path)
    for path in INCLUDE_ROOT_FILES:
        if path.exists():
            files.append(path)
    return sorted(set(files))


def main() -> None:
    changed = 0
    for path in iter_files():
        text = path.read_text(encoding="utf-8")
        new_text = transform(text, path)
        if new_text != text:
            path.write_text(new_text, encoding="utf-8", newline="\n")
            changed += 1
            print(path.relative_to(ROOT).as_posix())
    print(f"\n{changed} fichier(s) modifié(s).")


if __name__ == "__main__":
    main()
