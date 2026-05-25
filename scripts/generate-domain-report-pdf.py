#!/usr/bin/env python3
"""Génère le rapport PDF de recherche de noms de domaine pour Facturio."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
OUT_DIR = ROOT / "docs" / "rapports"
OUT_PDF = OUT_DIR / "RAPPORT-RECHERCHE-DOMAINES-FACTURIO.pdf"


def load_json(name: str) -> dict:
    path = SCRIPTS / name
    if path.exists():
        with path.open(encoding="utf-8-sig") as f:
            return json.load(f)
    return {"LIBRE": [], "PRIS": [], "INCONNU": []}


MULTI_COUNTRY = [
    ("smartfactu", "Smart + facturation, moderne"),
    ("cloudfactu", "SaaS cloud + facture"),
    ("craftdevis", "DanielCraft + devis"),
    ("pulsefactu", "Dynamique / temps réel"),
    ("devishub", "Hub devis / clients"),
    ("devisnet", "Plateforme / réseau devis"),
    ("clientfact", "Client + facture"),
    ("fluxdevis", "Flux de devis"),
    ("stackdevis", "Stack technique"),
    ("metafactu", "Méta-données facturation"),
]

MULTI_TLDS = ".io, .fr, .eu, .it, .be, .pl, .cloud, .tech, .au, .nz, .kr, .ie, .ro, .sn, .de (souvent)"

TAKEN_BRAND = [
    "facturio.com", "facturio.fr", "facturio.io", "facturio.tech",
    "factur.io", "facture.io", "factu.io", "faktur.io",
    "facturx.io", "facturly.io", "facturpro.io", "facturflow.io",
    "facturapi.io", "facturapi.com", "devisio.io",
]

PREVIOUS_PICKS = [
    ("facturium.io", "Style premium proche factur.io"),
    ("facturcraft.io", "Dev + DanielCraft"),
    ("efactur.io", "E-facturation 2026"),
    ("facturio.cloud", "Aligné marque Facturio"),
    ("prestafacture.fr", "Prestataires FR"),
    ("facturioapp.fr", "Application Facturio"),
]

ASIA_AFRICA_SAMPLE = [
    ("devismart.kr", "Libre"),
    ("smartfactu.kr", "Libre"),
    ("cloudfactu.kr", "Libre"),
    ("devismart.sn", "Libre (Sénégal)"),
    ("smartfactu.de", "Libre (DENIC: Status free)"),
    ("devismart.de", "Libre (DENIC: Status connect)"),
    (".jp, .in, .sg, .cn, .za, .ng, .ma, .br, .mx", "Whois Windows non concluant — confirmer chez registrar"),
]


class ReportPDF(FPDF):
    def __init__(self) -> None:
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=18)
        self._setup_fonts()

    def _setup_fonts(self) -> None:
        # Polices Windows (accents français)
        win = Path("C:/Windows/Fonts")
        self.add_font("DV", "", str(win / "arial.ttf"))
        self.add_font("DV", "B", str(win / "arialbd.ttf"))
        self.add_font("DV", "I", str(win / "ariali.ttf"))

    def _font(self, style: str = "", size: int = 11) -> None:
        self.set_font("DV", style, size)

    def footer(self) -> None:
        self.set_y(-12)
        self._font("", 8)
        self.set_text_color(100, 100, 100)
        self.cell(
            0,
            8,
            f"DanielCraft — Facturio — Recherche domaines — {date.today().isoformat()} — p. {self.page_no()}",
            align="C",
        )
        self.set_text_color(0, 0, 0)

    def cover(self) -> None:
        self.add_page()
        self.set_fill_color(30, 58, 95)
        self.rect(0, 0, 210, 297, style="F")
        self.set_text_color(255, 255, 255)
        self.set_y(70)
        self._font("B", 28)
        self.cell(0, 14, "Recherche de noms de domaine", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self._font("B", 22)
        self.cell(0, 12, "Projet Facturio", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.ln(8)
        self._font("", 12)
        self.cell(0, 8, "Rapport de disponibilité (whois)", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.cell(0, 8, f"Date : {date.today().strftime('%d/%m/%Y')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.cell(0, 8, "Éditeur : DanielCraft (Loïc DANIEL)", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.ln(20)
        self._font("I", 10)
        self.multi_cell(
            0,
            6,
            "Thèmes : devis, facture, client, informatique, web, smart, mobile.\n"
            "Zones : Europe, Asie, Océanie, Afrique, Amériques, extensions génériques.",
            align="C",
        )
        self.set_text_color(0, 0, 0)

    def h1(self, title: str) -> None:
        self.ln(4)
        self._font("B", 16)
        self.set_fill_color(230, 236, 245)
        self.cell(0, 10, f"  {title}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
        self.ln(2)

    def h2(self, title: str) -> None:
        self.ln(2)
        self._font("B", 13)
        self.cell(0, 8, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def body(self, text: str) -> None:
        self._font("", 10)
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def bullet_list(self, items: list[str]) -> None:
        self._font("", 10)
        w = self.epw
        for item in items:
            self.multi_cell(w, 5.5, f"- {item}")
        self.ln(1)

    def table(self, headers: list[str], rows: list[list[str]], col_widths: list[float]) -> None:
        self._font("B", 9)
        self.set_fill_color(30, 58, 95)
        self.set_text_color(255, 255, 255)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 7, h, border=1, fill=True)
        self.ln()
        self.set_text_color(0, 0, 0)
        self._font("", 8)
        fill = False
        for row in rows:
            if fill:
                self.set_fill_color(245, 247, 250)
            else:
                self.set_fill_color(255, 255, 255)
            max_h = 7
            for i, cell in enumerate(row):
                self.cell(col_widths[i], max_h, cell[:80], border=1, fill=True)
            self.ln()
            fill = not fill
        self.ln(2)

    def domain_columns(self, domains: list[str], per_row: int = 3) -> None:
        self._font("", 8)
        col_w = 63
        row: list[str] = []
        for i, d in enumerate(sorted(domains)):
            row.append(d)
            if len(row) == per_row:
                for j, dom in enumerate(row):
                    self.cell(col_w, 5, dom, border=0)
                self.ln()
                row = []
        if row:
            for dom in row:
                self.cell(col_w, 5, dom, border=0)
            self.ln()
        self.ln(2)


def build_report() -> None:
    gen = load_json("whois-generique.json")
    eu = load_json("whois-europe.json")
    libre_io = gen.get("LIBRE", [])
    pris_io = gen.get("PRIS", [])
    libre_fr = eu.get("LIBRE", [])
    pris_fr = eu.get("PRIS", [])

    pdf = ReportPDF()
    pdf.cover()

    # Sommaire
    pdf.add_page()
    pdf.h1("Sommaire")
    pdf.bullet_list(
        [
            "1. Contexte et objectif",
            "2. Méthodologie (whois, ping, limites)",
            "3. Noms déjà pris (marque Facturio et proches)",
            "4. Résultats par zone géographique",
            "5. Racines multi-pays recommandées",
            "6. Recommandations finales",
            "7. Annexe — listes complètes .io et .fr",
        ]
    )

    pdf.h1("1. Contexte et objectif")
    pdf.body(
        "Facturio est un logiciel de facturation en ligne édité par DanielCraft, orienté "
        "prestations de services numériques (devis, factures PDF, e-facture 2026, clients, Stripe). "
        "Ce rapport recense des noms de domaine inventés autour des thèmes devis, facture, client, "
        "ainsi que informatique, web, smart et mobile, sur de nombreuses extensions nationales "
        "et génériques."
    )
    pdf.body(
        "Objectif : identifier des noms libres à l'enregistrement, cohérents avec la marque et "
        "le marché français / européen, avec des alternatives internationales."
    )

    pdf.h1("2. Méthodologie")
    pdf.h2("Outil")
    pdf.body(
        "Requêtes WHOIS via Sysinternals Whois v1.21 (winget), avec acceptation de licence : "
        "whois -accepteula <domaine>"
    )
    pdf.h2("Ping vs whois")
    pdf.table(
        ["Méthode", "Vitesse", "Fiabilité disponibilité"],
        [
            ["ping", "~60–120 ms", "Faible — ne prouve ni libre ni pris"],
            ["DNS (Resolve-DnsName)", "~20–600 ms", "Indice seulement (NXDOMAIN)"],
            ["whois", "~150 ms – 3 s", "Fiable — source registrar / registre"],
        ],
        [35, 40, 115],
    )
    pdf.body(
        "Conclusion : utiliser whois avant tout achat. Le ping peut être plus rapide mais induit "
        "souvent en erreur (domaine pris sans site, ou libre sans DNS)."
    )
    pdf.h2("Limites")
    pdf.bullet_list(
        [
            "Extensions .jp, .in, .sg, .cn, .za, .ng, .ma, .br, etc. : réponses whois souvent "
            "incomplètes sous Windows — confirmation obligatoire chez le registrar.",
            "Disponibilité susceptible de changer entre le scan et l'achat.",
            "Certaines extensions imposent des conditions locales (résidence, trustee).",
            f"Volume testé : ~52 racines inventées ; échantillons multi-TLD documentés.",
        ]
    )

    pdf.h1("3. Noms déjà pris (à éviter)")
    pdf.body("Principaux domaines liés à Facturio ou concurrents déjà enregistrés :")
    pdf.domain_columns(TAKEN_BRAND, per_row=2)

    pdf.h1("4. Résultats par zone")
    pdf.h2("4.1 Génériques — .io")
    pdf.body(f"Libres confirmés : {len(libre_io)} — Pris : {len(pris_io)}")
    pdf.body("Exemples libres : devismart.io, smartfactu.io, cloudfactu.io, craftdevis.io, "
             "pulsefactu.io, devishub.io, getdevis.io, factubox.io, …")
    pdf.body("Pris : smartclient.io, clienthub.io, factunet.io, smartbill.io, webclient.io, smartfact.io")
    pdf.body("Extensions .cloud et .tech : largement libres pour les racines testées (ex. smartfactu.cloud).")

    pdf.h2("4.2 Europe — .fr")
    pdf.body(f"Libres confirmés : {len(libre_fr)} — Pris : {len(pris_fr)}")
    pdf.body("Pris en .fr : devismart.fr, smartdevis.fr, devisweb.fr, factunet.fr, smartbill.fr, "
             "devisapp.fr, mydevis.fr, infodevis.fr")
    pdf.body("Libres notables : cloudfactu.fr, craftdevis.fr, pulsefactu.fr, smartfactu.fr, "
             "devishub.fr, clientdevis.fr, webdevis.fr, stackdevis.fr, metafactu.fr")

    pdf.h2("4.3 Europe (autres ccTLD)")
    pdf.table(
        ["Extension", "Pays / zone", "Exemples libres confirmés"],
        [
            [".eu", "Union européenne", "smartfactu.eu, cloudfactu.eu, craftdevis.eu"],
            [".it", "Italie", "devismart.it, smartfactu.it, cloudfactu.it"],
            [".be", "Belgique", "devismart.be, smartfactu.be"],
            [".pl", "Pologne", "smartfactu.pl, cloudfactu.pl"],
            [".uk", "Royaume-Uni", "devismart.uk"],
            [".ie", "Irlande", "smartfactu.ie"],
            [".ro", "Roumanie", "cloudfactu.ro"],
            [".de", "Allemagne", "smartfactu.de (free), devismart.de (connect)"],
            [".sn", "Sénégal", "devismart.sn, smartfactu.sn"],
        ],
        [22, 45, 123],
    )

    pdf.h2("4.4 Océanie")
    pdf.table(
        ["Extension", "Exemples libres"],
        [
            [".au", "devismart.au, smartfactu.au, cloudfactu.au, craftdevis.au"],
            [".nz", "smartfactu.nz, cloudfactu.nz, craftdevis.nz, pulsefactu.nz"],
        ],
        [25, 165],
    )

    pdf.h2("4.5 Asie")
    pdf.table(
        ["Extension", "Résultat"],
        [
            [".kr", "Libres confirmés : devismart.kr, smartfactu.kr, cloudfactu.kr, …"],
            [".jp, .in, .sg, .cn, …", "Whois non concluant — vérifier chez registrar"],
        ],
        [30, 160],
    )
    for row in ASIA_AFRICA_SAMPLE:
        pass  # already in table narrative

    pdf.h2("4.6 Afrique et Amériques")
    pdf.body(
        ".sn (Sénégal) : plusieurs libres confirmés. .za, .ng, .ma, .ke, .br, .mx, .ar, .co : "
        "tests whois non concluants sur cet environnement — validation manuelle requise."
    )

    pdf.add_page()
    pdf.h1("5. Racines multi-pays")
    pdf.body(
        "Ces racines apparaissent libres sur de nombreuses extensions testées "
        f"({MULTI_TLDS}) :"
    )
    rows = [(name, desc) for name, desc in MULTI_COUNTRY]
    pdf.table(["Racine", "Intérêt"], rows, [45, 145])

    pdf.h1("6. Recommandations finales")
    pdf.h2("6.1 Coups de cœur (session précédente — marque Facturio)")
    pdf.table(["Domaine", "Commentaire"], PREVIOUS_PICKS, [55, 135])

    pdf.h2("6.2 Coups de cœur (batterie devis / smart / web)")
    pdf.table(
        ["Domaine", "Pourquoi"],
        [
            ["smartfactu.io + .fr", "Smart + facturation, disponible sur de nombreux TLD"],
            ["cloudfactu.io + .fr", "Positionnement SaaS cloud"],
            ["craftdevis.io + .fr", "Lien DanielCraft + devis"],
            ["pulsefactu.io + .fr", "Produit dynamique, notifications"],
            ["devishub.io + .fr", "Hub central devis / clients"],
            ["devismart.io", "Court ; .fr pris mais .io et .cloud libres"],
        ],
        [55, 135],
    )

    pdf.h2("6.3 Prochaines étapes")
    pdf.bullet_list(
        [
            "Choisir 1 à 2 noms finalistes et vérifier à nouveau au registrar avant paiement.",
            "Enregistrer le .fr (marché principal) et un .io ou .cloud (international / SaaS).",
            "Configurer DNS + certificat TLS + variables VITE_* / mentions légales.",
            "Pour .jp / .in / .br : demande de disponibilité directement chez OVH, Gandi, Namecheap, etc.",
        ]
    )

    pdf.add_page()
    pdf.h1("7. Annexe — domaines libres .io")
    pdf.domain_columns(libre_io, per_row=3)

    pdf.add_page()
    pdf.h1("7. Annexe — domaines libres .fr")
    pdf.domain_columns(libre_fr, per_row=3)

    pdf.h2("7.1 Domaines pris (.io et .fr)")
    pdf.body("Pris .io : " + ", ".join(pris_io))
    pdf.body("Pris .fr : " + ", ".join(pris_fr))

    pdf.h2("7.2 Fichiers sources")
    pdf.bullet_list(
        [
            "scripts/whois-generique.json",
            "scripts/whois-europe.json",
            "scripts/whois-asie-oceanie.json",
            "scripts/whois-afrique-ameriques.json",
            "scripts/whois-batch-region.ps1",
        ]
    )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT_PDF))
    print(f"PDF généré : {OUT_PDF}")


if __name__ == "__main__":
    build_report()
