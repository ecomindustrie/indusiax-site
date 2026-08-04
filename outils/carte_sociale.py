"""Fabrique la vignette de partage d'une page produit : assets/social/<nom>.jpg

C'est l'image qu'affichent LinkedIn, WhatsApp ou Slack quand quelqu'un
partage un lien. Une page qui n'en a pas s'affiche en texte nu, ce qui la
fait passer pour un lien douteux.

Le gabarit est celui des cartes existantes — fond sombre, lueur à la
couleur du produit concentrée à droite, logo, sur-titre lettré, titre en
gras, pied de page. Les réglages de la lueur ont été ajustés sur le PROFIL
horizontal du fond des cartes déjà en ligne, mesuré dans une bande sans
texte : une simple moyenne de luminance ne suffit pas à les reproduire,
elle se règle aussi bien avec un halo concentré qu'avec une teinte
uniforme, et seul le halo appartient à la famille.

    python outils/carte_sociale.py contiax

Dépendances : pillow, fonttools, brotli.
"""

import pathlib
import sys

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

RACINE = pathlib.Path(__file__).resolve().parent.parent
SITE = RACINE / "site"

L, H = 1200, 630
FOND = (11, 13, 18)
BLANC = (255, 255, 255)
GRIS = (138, 140, 144)
ROUGE = (232, 76, 43)          # le « x » du logo ne change jamais de couleur
BRAS = [(232, 76, 43), (59, 130, 246), (167, 139, 250), (14, 165, 233)]

# Une carte par produit. La couleur est celle déclarée dans site.css.
PRODUITS = {
    "contiax": ((16, 185, 129), "Contiax · Scanner de cartes · Gratuit",
                ["Scannez, le prospect", "est enregistré"]),
}


def police_du_site() -> pathlib.Path:
    """Convertit le woff2 que le site sert déjà en TrueType lisible par Pillow.

    On part du fichier servi plutôt que d'une copie séparée : deux sources
    de vérité typographique finissent toujours par diverger.
    """
    ttf = RACINE / "outils" / ".outfit.ttf"
    if not ttf.exists():
        fonte = TTFont(str(SITE / "assets" / "fonts" / "outfit-1.woff2"))
        fonte.flavor = None
        fonte.save(str(ttf))
    return ttf


def fonte(taille: int, graisse: int) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(police_du_site()), taille)
    f.set_variation_by_axes([graisse])   # Outfit est une police variable
    return f


def lueur(img, couleur, centre, rayon, force, decroissance):
    """Halo radial, dessiné au huitième puis agrandi.

    Le tracer pixel par pixel en pleine taille prendrait plusieurs
    secondes ; à cette échelle le dégradé est identique une fois lissé.
    """
    e = 8
    petit = Image.new("L", (L // e, H // e), 0)
    px = petit.load()
    cx, cy, r = centre[0] / e, centre[1] / e, rayon / e
    for y in range(H // e):
        for x in range(L // e):
            d = (((x - cx) ** 2 + (y - cy) ** 2) ** 0.5) / r
            if d < 1:
                px[x, y] = int(255 * min(1.0, force * (1 - d) ** decroissance))
    img.paste(Image.new("RGB", (L, H), couleur), (0, 0),
              petit.resize((L, H), Image.BICUBIC))


def texte_espace(d, xy, texte, police, couleur, espace):
    """Dessine avec interlettrage — Pillow ne sait pas le faire seul."""
    x, y = xy
    for c in texte:
        d.text((x, y), c, font=police, fill=couleur)
        x += d.textlength(c, font=police) + espace


def marque(d, x, y, t):
    """Le viseur du logo : point central et quatre bras, repris du SVG."""
    u = t / 24
    d.ellipse([x + 12 * u - 3.1 * u, y + 12 * u - 3.1 * u,
               x + 12 * u + 3.1 * u, y + 12 * u + 3.1 * u], fill=BRAS[0])
    ep = max(2, int(2.5 * u))
    d.line([x + 12 * u, y + 2.2 * u, x + 12 * u, y + 6.4 * u], fill=BRAS[0], width=ep)
    d.line([x + 21.8 * u, y + 12 * u, x + 17.6 * u, y + 12 * u], fill=BRAS[1], width=ep)
    d.line([x + 12 * u, y + 21.8 * u, x + 12 * u, y + 17.6 * u], fill=BRAS[2], width=ep)
    d.line([x + 2.2 * u, y + 12 * u, x + 6.4 * u, y + 12 * u], fill=BRAS[3], width=ep)


def croix(d, x, y, t):
    """Le « x » d'Indusiax : deux traits croisés, plus hauts que la casse."""
    ep = max(3, int(t * 0.15))
    d.line([x, y + t, x + t, y], fill=ROUGE, width=ep)
    d.line([x, y, x + t, y + t], fill=ROUGE, width=ep)
    # Pillow ne pose pas de capuchon arrondi sur un trait : on les ajoute.
    for p in ((x, y), (x + t, y), (x, y + t), (x + t, y + t)):
        d.ellipse([p[0] - ep / 2, p[1] - ep / 2, p[0] + ep / 2, p[1] + ep / 2], fill=ROUGE)


def carte(nom: str) -> pathlib.Path:
    couleur, surtitre, titre = PRODUITS[nom]
    img = Image.new("RGB", (L, H), FOND)
    # Le tiers gauche reste au fond pur : le titre y perdrait son contraste.
    lueur(img, couleur, (1050, 150), 800, 1.25, 1.6)
    d = ImageDraw.Draw(img)

    marque(d, 74, 58, 48)
    f_mot = fonte(41, 800)
    d.text((136, 57), "Indusia", font=f_mot, fill=BLANC)
    croix(d, 136 + int(d.textlength("Indusia", font=f_mot)) + 4, 66, 27)

    texte_espace(d, (75, 168), surtitre.upper(), fonte(20, 700), couleur, 3.4)

    f_titre = fonte(63, 800)
    for i, ligne in enumerate(titre):
        d.text((74, 222 + i * 87), ligne, font=f_titre, fill=BLANC)

    texte_espace(d, (75, 564), "indusiax.com", fonte(20, 700), couleur, .2)
    d.text((75, 590), "By industry, for industry", font=fonte(18, 400), fill=GRIS)

    sortie = SITE / "assets" / "social" / f"{nom}.jpg"
    img.save(sortie, "JPEG", quality=88, optimize=True, progressive=True)
    return sortie


if __name__ == "__main__":
    noms = sys.argv[1:] or list(PRODUITS)
    for n in noms:
        if n not in PRODUITS:
            sys.exit(f"produit inconnu : {n} (connus : {', '.join(PRODUITS)})")
        chemin = carte(n)
        print(f"{chemin.relative_to(RACINE)} — {chemin.stat().st_size // 1024} Ko")
