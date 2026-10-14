"""Cherche du français oublié dans le texte VISIBLE des pages EN et NL générées.

    python -I outils/i18n_residus.py

Ignore les commentaires, <script>, <style>, les attributs techniques et les
noms propres. Signale les mots-outils français fréquents (« le », « des »,
« votre »…) et les lettres accentuées typiquement françaises. Les références
réglementaires gardées volontairement en français (arrêtés, Code du travail,
VGP…) apparaîtront : à relire, pas forcément à corriger.
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "site"
MOTS = re.compile(r"\b(le|la|les|des|du|une|est|sont|avec|pour|votre|vos|nous|vous|dans|sur|pas|qui|que|mais|aussi|très|être|avoir)\b", re.I)
ACCENTS = re.compile(r"[éèêàùçœ]")
ATTRS = ("alt", "title", "aria-label", "placeholder", "content")


class Texte(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.morceaux, self.ignore = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.ignore += 1
        for k, v in attrs:
            if k in ATTRS and v and not v.startswith(("http", "/", "#")):
                self.morceaux.append(v)

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.ignore:
            self.ignore -= 1

    def handle_data(self, data):
        if not self.ignore and data.strip():
            self.morceaux.append(data.strip())


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows en cp1252
    total = 0
    for lang in ("en", "nl"):
        for f in sorted((SITE / lang).rglob("*.html")):
            p = Texte()
            p.feed(f.read_text(encoding="utf-8"))
            suspects = []
            for m in p.morceaux:
                n_mots = len(MOTS.findall(m))
                # un mot-outil isolé peut être néerlandais (« de », « is »…) : on
                # exige soit deux mots-outils FR, soit un accent FR + un mot-outil
                if n_mots >= 2 or (n_mots and ACCENTS.search(m)):
                    suspects.append(m[:110])
            if suspects:
                total += len(suspects)
                print(f"{f.relative_to(SITE).as_posix()} ({len(suspects)})")
                for s in suspects[:6]:
                    print("    ", s)
    print(f"total : {total} passage(s) suspect(s)")


if __name__ == "__main__":
    main()
