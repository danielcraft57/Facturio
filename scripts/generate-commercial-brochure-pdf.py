#!/usr/bin/env python3
"""Génère la plaquette commerciale UX/UI Facturio (PDF A4)."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "docs" / "plaquette-commerciale" / "images"
OUT_DIR = ROOT / "docs" / "plaquette-commerciale"
OUT_PDF = OUT_DIR / "FACTURIO-PLAQUETTE-COMMERCIALE.pdf"

# Charte (alignée marketing + app)
TEAL_DARK = (15, 118, 110)
TEAL_MID = (13, 148, 136)
TEAL_DEEP = (19, 78, 74)
NAVY = (30, 58, 95)
BLUE = (30, 64, 175)
SLATE = (100, 116, 139)
LIGHT_BG = (241, 245, 249)
WHITE = (255, 255, 255)

TAGLINE = "Devis, factures et compta pour les dev & agences web"
DESCRIPTION = (
    "Centralisez devis, facturation, TVA et suivi comptable — pensé pour les freelances "
    "développeurs et les agences web, sans tableur ni logiciel généraliste."
)
URL = "https://facturio.danielcraft.fr"
CONTACT = "contact@danielcraft.fr"

AUDIENCES = [
    ("Freelances & solo dev", "Forfaits, régie TJM, acomptes 30/70, catalogue prestations tech."),
    ("Indie hackers & side projects", "Volumes modérés, démarrage rapide, plan Free pour tester."),
    ("Petites agences & studios", "Multi-missions, branding PDF, palier Agence, support prioritaire."),
    ("Prestataires B2B numériques", "Dev web, logiciel sur mesure, API, IA, maintenance récurrente."),
]

FEATURES = [
    ("Devis & acceptation", "Devis en ligne, validation client, conversion facture."),
    ("Facturation missions", "Catalogue dev/intégration/maintenance, PDF et envoi email."),
    ("Clients & prospection", "Carnet clients, pipeline, ProspectLab (plan Pro)."),
    ("Encaissement Stripe", "Liens de paiement avec votre compte Stripe."),
    ("TVA FR & UE B2B", "Taux, autoliquidation intracommunautaire, export."),
    ("Comptabilité intégrée", "Écritures auto, balance, export FEC."),
    ("Abonnements & MRR", "Facturation récurrente pour maintenance et SLA."),
    ("E-facture 2026", "Score conformité, export Factur-X — PA partenaire à venir."),
]

VERTICALS = [
    ("Développement web", "Sites, refontes, intégrations — forfaits et acomptes."),
    ("Logiciel & apps métier", "Jalons de projet, facturation par phase."),
    ("Automatisation & API", "Intégrations CRM, migrations — régie ou forfait."),
    ("IA & maintenance", "Abonnements mensuels, packs IA, contrats support."),
]

PRICING = [
    ("Free", "0 €/mois", "10 factures/mois, devis & PDF, catalogue base"),
    ("Pro", "12 €/mois", "Illimité, ProspectLab, Stripe, exports compta"),
    ("Pro + e-facture", "24 €/mois", "Factur-X, conformité, PA à venir"),
    ("Agence", "59 €/mois", "Équipe, branding PDF, support prioritaire"),
]

WORKFLOW_STEPS = [
    ("1. Devis", "Créez un devis depuis votre catalogue métier."),
    ("2. Acceptation", "Le client valide en ligne via lien sécurisé."),
    ("3. Facture", "Conversion en facture, PDF et envoi email."),
    ("4. Paiement", "Encaissement Stripe ou suivi manuel."),
    ("5. Compta", "Écritures et export FEC pour votre expert-comptable."),
]

DIFFERENTIATORS = [
    "Vertical métier : dev web, logiciel, automatisation — pas retail ni ERP générique.",
    "Langage métier : forfaits, régie, acomptes, maintenance, packs IA.",
    "Onboarding développeur : profil + stack → catalogue personnalisé.",
    "Conformité 2026 intégrée : Factur-X et score SIRET/SIREN sans quitter l'outil.",
    "Transparence produit : module PA en cours ; aujourd'hui PDF, email, Stripe.",
    "Édité par DanielCraft : dogfooding sur prestations réelles.",
]


class BrochurePDF(FPDF):
    def __init__(self) -> None:
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=16)
        self._setup_fonts()

    def _setup_fonts(self) -> None:
        win = Path("C:/Windows/Fonts")
        self.add_font("F", "", str(win / "arial.ttf"))
        self.add_font("F", "B", str(win / "arialbd.ttf"))
        self.add_font("F", "I", str(win / "ariali.ttf"))

    def _font(self, style: str = "", size: int = 11) -> None:
        self.set_font("F", style, size)

    def footer(self) -> None:
        self.set_y(-11)
        self._font("", 7)
        self.set_text_color(*SLATE)
        self.cell(
            0,
            6,
            f"Facturio — DanielCraft — {URL} — {date.today().strftime('%d/%m/%Y')} — p. {self.page_no()}",
            align="C",
        )
        self.set_text_color(0, 0, 0)

    def _gradient_header(self, height: float = 52) -> None:
        steps = 12
        h = height / steps
        for i in range(steps):
            t = i / max(steps - 1, 1)
            r = int(TEAL_DARK[0] + (TEAL_MID[0] - TEAL_DARK[0]) * t)
            g = int(TEAL_DARK[1] + (TEAL_MID[1] - TEAL_DARK[1]) * t)
            b = int(TEAL_DARK[2] + (TEAL_MID[2] - TEAL_DARK[2]) * t)
            self.set_fill_color(r, g, b)
            self.rect(0, i * h, 210, h + 0.5, style="F")

    def cover(self, cover_img: Path | None) -> None:
        self.add_page()
        if cover_img and cover_img.exists():
            self.image(str(cover_img), x=0, y=0, w=210, h=118)
            self.set_y(118)
            self.set_fill_color(*TEAL_DEEP)
            self.rect(0, 118, 210, 179, style="F")
            y0 = 128
        else:
            self._gradient_header(120)
            y0 = 75

        self.set_text_color(*WHITE)
        self.set_y(y0)
        self._font("B", 36)
        self.cell(0, 14, "Facturio", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self._font("B", 14)
        self.multi_cell(0, 8, TAGLINE, align="C")
        self.ln(4)
        self._font("", 10)
        self.multi_cell(0, 5.5, DESCRIPTION, align="C")
        self.ln(6)
        self._font("B", 11)
        self.cell(0, 7, "Plaquette commerciale — UX & produit", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self._font("", 9)
        mois = date.today().strftime("%m/%Y")
        self.cell(0, 6, f"Editeur DanielCraft - {mois}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.set_text_color(0, 0, 0)

    def section_title(self, title: str, subtitle: str = "") -> None:
        self.ln(2)
        self.set_fill_color(*NAVY)
        self.set_text_color(*WHITE)
        self._font("B", 15)
        self.cell(0, 10, f"  {title}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
        if subtitle:
            self.set_text_color(*SLATE)
            self._font("", 9)
            self.cell(0, 6, f"  {subtitle}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def body(self, text: str, size: int = 10) -> None:
        self._font("", size)
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def bullets(self, items: list[str]) -> None:
        self._font("", 10)
        w = self.epw
        for item in items:
            self.multi_cell(w, 5.5, f"- {item}")
        self.ln(1)

    def two_col_cards(self, items: list[tuple[str, str]], col_w: float = 92) -> None:
        x0 = self.l_margin
        y_start = self.get_y()
        gap = 6
        row_h = 22
        for i, (title, desc) in enumerate(items):
            col = i % 2
            row = i // 2
            x = x0 + col * (col_w + gap)
            y = y_start + row * (row_h + 4)
            self.set_xy(x, y)
            self.set_fill_color(*LIGHT_BG)
            self.set_draw_color(226, 232, 240)
            self.rect(x, y, col_w, row_h, style="FD")
            self.set_xy(x + 3, y + 3)
            self._font("B", 9)
            self.set_text_color(*NAVY)
            self.cell(col_w - 6, 5, title)
            self.set_xy(x + 3, y + 9)
            self._font("", 8)
            self.set_text_color(51, 65, 85)
            self.multi_cell(col_w - 6, 4, desc)
        rows = (len(items) + 1) // 2
        self.set_y(y_start + rows * (row_h + 4) + 2)
        self.set_text_color(0, 0, 0)

    def image_block(self, path: Path | None, caption: str, max_h: float = 75) -> None:
        if not path or not path.exists():
            self.body(f"[Visuel : {caption} - fichier absent]")
            return
        if self.get_y() > 200:
            self.add_page()
        w = self.epw
        self.ln(2)
        self.image(str(path), w=w, h=max_h)
        self._font("I", 8)
        self.set_text_color(*SLATE)
        self.cell(0, 5, caption, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.set_text_color(0, 0, 0)
        self.ln(3)

    def pricing_table(self) -> None:
        headers = ["Plan", "Prix", "Points clés"]
        col_w = [28, 28, 134]
        self._font("B", 9)
        self.set_fill_color(*NAVY)
        self.set_text_color(*WHITE)
        for i, h in enumerate(headers):
            self.cell(col_w[i], 7, h, border=1, fill=True)
        self.ln()
        self.set_text_color(0, 0, 0)
        self._font("", 8)
        alt = False
        for name, price, feats in PRICING:
            if alt:
                self.set_fill_color(245, 247, 250)
            else:
                self.set_fill_color(*WHITE)
            self.cell(col_w[0], 8, name, border=1, fill=True)
            self.cell(col_w[1], 8, price, border=1, fill=True)
            self.cell(col_w[2], 8, feats, border=1, fill=True)
            self.ln()
            alt = not alt
        self.ln(2)

    def cta_block(self) -> None:
        self.set_fill_color(*TEAL_DARK)
        self.set_text_color(*WHITE)
        self._font("B", 12)
        self.cell(0, 10, "  Essai gratuit — sans carte bancaire", new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
        self.set_text_color(0, 0, 0)
        self.ln(2)
        self.body(f"Inscription : {URL}/signup")
        self.body(f"Contact commercial : {CONTACT}")
        self.body("Hébergement France · Données sécurisées · Conformité RGPD")


def img(name: str) -> Path:
    return IMG_DIR / name


def build() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    IMG_DIR.mkdir(parents=True, exist_ok=True)

    pdf = BrochurePDF()
    pdf.cover(img("facturio-brochure-cover.png"))

    # Sommaire
    pdf.add_page()
    pdf.section_title("Sommaire")
    pdf.bullets(
        [
            "1. Vision produit & positionnement",
            "2. Cibles : freelances, agences, prestataires B2B",
            "3. Parcours UX : devis → facture → paiement → compta",
            "4. Interface & expérience utilisateur",
            "5. Fonctionnalités clés",
            "6. Segments métiers numériques",
            "7. Réforme facturation électronique 2026",
            "8. Offres & tarification",
            "9. Pourquoi DanielCraft",
            "10. Démarrer avec Facturio",
        ]
    )

    # 1 Vision
    pdf.add_page()
    pdf.section_title("1. Vision produit", "Positionnement vertical tech")
    pdf.body(
        "Facturio est le logiciel de facturation en ligne édité par DanielCraft, conçu pour "
        "les prestataires de services numériques : développeurs freelances, indie hackers, "
        "petites agences web et studios tech."
    )
    pdf.body(
        "Contrairement aux logiciels généralistes ou aux tableurs, Facturio parle votre langage "
        "métier : forfaits, régie au TJM, acomptes, maintenance, packs IA et abonnements récurrents."
    )
    pdf.section_title("Ce que Facturio remplace", subtitle="")
    pdf.bullets(
        [
            "Feuilles Excel pour devis, TVA et suivi des paiements",
            "Outils comptables trop lourds pour une activité de prestation intellectuelle",
            "Processus email + PDF dispersés sans traçabilité client",
        ]
    )
    pdf.section_title("Promesse UX", subtitle="")
    pdf.bullets(
        [
            "Parcours guidé dès l'inscription (profil dev + stack technique)",
            "Catalogue de prestations pré-rempli et personnalisable",
            "Navigation claire : devis, factures, clients, compta, paramètres",
            "Design sobre, lisible, adapté au travail quotidien sur écran",
        ]
    )
    if img("facturio-hero.png").exists():
        pdf.image_block(img("facturio-hero.png"), "Page d'accueil — hero marketing Facturio", max_h=70)

    # 2 Cibles
    pdf.add_page()
    pdf.section_title("2. Pour qui ?", "Clients, agences et prestataires B2B")
    pdf.image_block(img("facturio-brochure-audiences.png"), "Cibles : freelance, agence, indie hacker")
    pdf.two_col_cards(AUDIENCES)

    # 3 Workflow
    pdf.add_page()
    pdf.section_title("3. Parcours utilisateur", "Cycle commercial complet")
    for step, desc in WORKFLOW_STEPS:
        pdf._font("B", 10)
        pdf.set_text_color(*TEAL_DARK)
        pdf.cell(0, 6, step, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_text_color(0, 0, 0)
        pdf.body(desc)
    pdf.image_block(img("facturio-workflow.png"), "Workflow devis → facture → paiement → compta")

    # 4 UX UI
    pdf.add_page()
    pdf.section_title("4. Interface & UX", "Tableau de bord et ergonomie")
    pdf.body(
        "L'interface Facturio repose sur une charte claire : fond clair, navigation latérale, "
        "accent teal pour les actions principales, typographie Inter pour une lecture confortable."
    )
    pdf.bullets(
        [
            "Tableau de bord : KPI, factures en attente, devis à relancer",
            "Éditeur de devis/factures : lignes catalogue, TVA, mentions légales",
            "Liens publics : le client accepte ou refuse un devis sans compte",
            "Paramètres organisation : logo PDF, coordonnées, tokens API",
        ]
    )
    pdf.image_block(img("facturio-brochure-dashboard-ui.png"), "Maquette UX — tableau de bord")
    if img("facturio-features.png").exists():
        pdf.image_block(img("facturio-features.png"), "Vue fonctionnalités (site marketing)")

    # 5 Fonctionnalités
    pdf.add_page()
    pdf.section_title("5. Fonctionnalités clés")
    pdf.two_col_cards(FEATURES, col_w=92)

    # 6 Verticaux
    pdf.add_page()
    pdf.section_title("6. Segments métiers", "Prestations numériques")
    pdf.two_col_cards(VERTICALS, col_w=92)
    if img("facturio-prestations.png").exists():
        pdf.image_block(img("facturio-prestations.png"), "Catalogue prestations aligné métier dev")

    # 7 E-facture
    pdf.add_page()
    pdf.section_title("7. Réforme 2026", "Facturation électronique B2B")
    pdf.body(
        "À partir de septembre 2026 (réception) puis 2027 (émission PME), la facturation "
        "électronique structurée devient obligatoire en France. Facturio vous aide à anticiper."
    )
    pdf.bullets(
        [
            "Score de conformité par facture (SIRET, SIREN, mentions)",
            "Export Factur-X (XML EN 16931)",
            "Connexion Plateforme Agréée partenaire — en développement",
            "Vous restez dans Facturio : catalogue, devis et missions inchangés",
        ]
    )
    pdf.body(
        "Le module e-facture complet est réservé au palier Pro + e-facture. Aujourd'hui : "
        "devis, factures PDF, envoi email et paiements Stripe sont pleinement opérationnels."
    )
    pdf.image_block(img("facturio-efacture.png"), "Page réforme e-facture 2026")

    # 8 Tarifs
    pdf.add_page()
    pdf.section_title("8. Offres & tarification", "Freemium transparent")
    pdf.pricing_table()
    if img("facturio-pricing.png").exists():
        pdf.image_block(img("facturio-pricing.png"), "Grille tarifaire — page marketing")

    # 9 DanielCraft
    pdf.add_page()
    pdf.section_title("9. Pourquoi DanielCraft ?")
    pdf.body(
        "DanielCraft est l'éditeur de Facturio. Nous utilisons notre propre outil pour "
        "facturer nos prestations de développement, d'intégration et de maintenance — "
        "preuve concrète de l'adéquation produit / métier."
    )
    pdf.section_title("Différenciateurs")
    pdf.bullets(DIFFERENTIATORS)

    # 10 CTA
    pdf.add_page()
    pdf.section_title("10. Démarrer")
    pdf.body(
        "1. Créez votre compte gratuit sur facturio.danielcraft.fr\n"
        "2. Choisissez votre profil (freelance, indie, agence…)\n"
        "3. Sélectionnez votre stack technique pour personnaliser le catalogue\n"
        "4. Émettez votre premier devis en quelques minutes"
    )
    pdf.cta_block()

    pdf.output(str(OUT_PDF))
    print(f"PDF généré : {OUT_PDF}")
    print(f"Images : {IMG_DIR}")


if __name__ == "__main__":
    build()
