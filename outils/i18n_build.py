"""Assemble le site multilingue (FR / EN / NL) d'indusiax.com.

    python -I outils/i18n_build.py            # assemble + contrôle
    python -I outils/i18n_build.py --check    # contrôle seul, n'écrit rien

Entrées
  site/**                 les pages FRANÇAISES (source de vérité, inchangée
                          hors balises hreflang, sélecteur de langue et ?v=)
  i18n/raw/{en,nl}/**     les traductions, à l'arborescence FRANÇAISE et avec
                          les liens internes laissés en français
  i18n/slugs.json         table chemin FR -> chemin EN / NL

Sorties
  site/en/**, site/nl/**  pages traduites, liens réécrits vers leur langue
  site/**.html            hreflang croisés + sélecteur FR · EN · NL
  site/sitemap.xml        bloc EN/NL régénéré + alternates xhtml:link
  deploy/default.conf     bloc de redirection par langue régénéré
  ?v=<md5[:8]>            empreinte des assets recalculée sur TOUTES les pages

Règle permanente (Grégory, 14/10/2026) : toute modification du site se fait
dans les trois langues, après validation de Grégory. Procédure : modifier la
page FR, retraduire la page dans i18n/raw/en et i18n/raw/nl (consignes :
i18n/CONSIGNES-TRADUCTION.md), relancer ce script, déployer.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SITE = RACINE / "site"
RAW = RACINE / "i18n" / "raw"
CONF = RACINE / "deploy" / "default.conf"
DOMAINE = "https://indusiax.com"
LANGUES = ("en", "nl")
LOCALE_OG = {"fr": "fr_FR", "en": "en_GB", "nl": "nl_NL"}
LIB_SW = {"fr": "Langue", "en": "Language", "nl": "Taal"}

SLUGS = json.loads((RACINE / "i18n" / "slugs.json").read_text(encoding="utf-8"))["pages"]


def url_de(fr_chemin, lang):
    """Chemin public (avec / initial et final) de la page FR `fr_chemin` en `lang`."""
    if lang == "fr":
        return "/" + (fr_chemin + "/" if fr_chemin else "")
    cible = SLUGS[fr_chemin][lang]
    return f"/{lang}/" + (cible + "/" if cible else "")


def fichier_de(fr_chemin, lang):
    rel = url_de(fr_chemin, lang).strip("/")
    return SITE / rel / "index.html" if rel else SITE / "index.html"


# --- réécriture des liens internes -----------------------------------------
# Chemins FR connus -> chemin traduit. Tout le reste (/assets/, /api/, /c/,
# favicon, llms.txt…) est laissé tel quel.
def _cible(chemin, lang):
    cle = chemin.strip("/")
    if cle in SLUGS:
        return url_de(cle, lang)
    return None


RE_LIEN = re.compile(r'(href=|"url":\s*|"@id":\s*|"item":\s*|content=)"(?:https://indusiax\.com)?(/[^"#?]*)([?#][^"]*)?"')


def reecrire_liens(html, lang):
    def remplace(m):
        attr, chemin, suite = m.group(1), m.group(2), m.group(3) or ""
        # Ne réécrire que les URL de page (terminées par /) ; un fichier
        # (/assets/x.jpg, /favicon.svg) n'a pas de traduction.
        if not chemin.endswith("/"):
            return m.group(0)
        cible = _cible(chemin, lang)
        if cible is None:
            return m.group(0)
        absolu = m.group(0)[len(attr) + 1:].startswith("https://")
        return f'{attr}"{(DOMAINE if absolu else "") + cible}{suite}"'
    return RE_LIEN.sub(remplace, html)


# --- head : lang, hreflang, og:locale ------------------------------------
RE_HREFLANG = re.compile(r'[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?')
RE_CANON = re.compile(r'(<link rel="canonical" href="[^"]*">\n?)')


def bloc_hreflang(fr_chemin):
    lignes = [f'<link rel="alternate" hreflang="{l}" href="{DOMAINE}{url_de(fr_chemin, l)}">'
              for l in ("fr", "en", "nl")]
    lignes.append(f'<link rel="alternate" hreflang="x-default" href="{DOMAINE}{url_de(fr_chemin, "fr")}">')
    return "\n".join(lignes) + "\n"


def poser_head(html, fr_chemin, lang):
    html = re.sub(r'<html lang="[^"]*"', f'<html lang="{lang}"', html, count=1)
    html = RE_HREFLANG.sub("", html)
    if fr_chemin is not None:
        if RE_CANON.search(html):
            html = RE_CANON.sub(lambda m: m.group(1) + bloc_hreflang(fr_chemin), html, count=1)
    html = re.sub(r'<meta property="og:locale" content="[^"]*">',
                  f'<meta property="og:locale" content="{LOCALE_OG[lang]}">', html)
    return html


# --- sélecteur de langue --------------------------------------------------
RE_SW = re.compile(r'\s*<!--i18n-sw-->.*?<!--/i18n-sw-->', re.S)


def selecteur(fr_chemin, lang, classe):
    liens = []
    for l in ("fr", "en", "nl"):
        cur = ' aria-current="true"' if l == lang else ""
        liens.append(f'<a href="{url_de(fr_chemin, l)}" hreflang="{l}" lang="{l}"{cur}>{l.upper()}</a>')
    return (f'<!--i18n-sw--><div class="{classe}" role="navigation" aria-label="{LIB_SW[lang]}">'
            + "".join(liens) + "</div><!--/i18n-sw-->")


def poser_selecteur(html, fr_chemin, lang):
    html = RE_SW.sub("", html)
    if fr_chemin is None or "</nav>" not in html:
        return html
    # mobile : dans le menu déroulant, juste avant </nav>
    html = html.replace("</nav>", "  " + selecteur(fr_chemin, lang, "lang-sw lang-sw-m") + "\n    </nav>", 1)
    # bureau : dans la barre, juste après </nav>
    html = html.replace("</nav>", "</nav>\n    " + selecteur(fr_chemin, lang, "lang-sw"), 1)
    return html


# --- empreinte des assets -------------------------------------------------
RE_ASSET = re.compile(r'(/assets/[\w./-]+\.(?:css|js))\?v=[0-9a-f]+')
_md5 = {}


def empreinte(html):
    def remplace(m):
        chemin = m.group(1)
        if chemin not in _md5:
            f = SITE / chemin.lstrip("/")
            _md5[chemin] = hashlib.md5(f.read_bytes()).hexdigest()[:8] if f.exists() else None
        return f"{chemin}?v={_md5[chemin]}" if _md5[chemin] else m.group(0)
    return RE_ASSET.sub(remplace, html)


# --- harmonisation des blocs communs ---------------------------------------
# Les pages sont traduites séparément : un même pied de page français pouvait
# devenir « Full suite terms » ici et « Full Suite terms of sale » là. Règle :
# deux blocs IDENTIQUES en français reçoivent la MÊME traduction, celle de la
# page de référence du groupe (l'accueil s'il en fait partie, sinon la
# première page par ordre alphabétique).
BLOCS = (('<header class="site">', "header"), ('<footer class="site">', "footer"),
         ('<div class="nl-block">', "div"), ('<div class="cta-final">', "div"))


def borne(html, debut, balise):
    """(i, j) de l'élément ouvert par `debut`, balises de même nom équilibrées."""
    i = html.find(debut)
    if i < 0:
        return None
    prof, pos = 0, i
    motif = re.compile(rf"<(/?){balise}\b[^>]*>")
    for m in motif.finditer(html, i):
        prof += -1 if m.group(1) else 1
        if prof == 0:
            return i, m.end()
    return None


def harmoniser(sources, traductions):
    """sources : {clé: html FR} ; traductions : {clé: html traduit} (modifié en place)."""
    for debut, balise in BLOCS:
        groupes = {}
        for cle, fr in sources.items():
            b = borne(fr, debut, balise)
            if b and cle in traductions:
                groupes.setdefault(fr[b[0]:b[1]], []).append(cle)
        for cles in groupes.values():
            if len(cles) < 2:
                continue
            ref = "" if "" in cles else min(cles, key=lambda k: (k is None, k or ""))
            b = borne(traductions[ref], debut, balise)
            if not b:
                continue
            bloc = traductions[ref][b[0]:b[1]]
            for cle in cles:
                bt = borne(traductions[cle], debut, balise)
                if bt:
                    traductions[cle] = traductions[cle][:bt[0]] + bloc + traductions[cle][bt[1]:]


# --- pages ----------------------------------------------------------------
def pages_fr():
    """(chemin FR ou None pour 404, fichier source)"""
    for cle in SLUGS:
        yield cle, fichier_de(cle, "fr")
    yield None, SITE / "404.html"


def traiter(ecrire):
    erreurs, ecrits = [], 0
    pages = list(pages_fr())
    sources = {cle: src.read_text(encoding="utf-8") for cle, src in pages}
    traduites = {}
    for lang in LANGUES:
        traduites[lang] = {}
        for cle, src in pages:
            brut = RAW / lang / src.relative_to(SITE)
            if brut.exists():
                traduites[lang][cle] = brut.read_text(encoding="utf-8")
            else:
                erreurs.append(f"traduction manquante : i18n/raw/{lang}/{src.relative_to(SITE).as_posix()}")
        harmoniser(sources, traduites[lang])

    for cle, src in pages:
        fr_html = sources[cle]
        nouveau = empreinte(poser_selecteur(poser_head(fr_html, cle, "fr"), cle, "fr"))
        if nouveau != fr_html and ecrire:
            src.write_text(nouveau, encoding="utf-8", newline="")
        for lang in LANGUES:
            if cle not in traduites[lang]:
                continue
            html = traduites[lang][cle]
            html = reecrire_liens(html, lang)
            # Compteurs animés de site.js (valeur + data-suffix) : « 650 € » en
            # français, mais « €650 » en anglais et « € 650 » en néerlandais.
            html = html.replace('data-suffix=" €"', 'data-prefix="€"' if lang == "en" else 'data-prefix="€ "')
            html = poser_head(html, cle, lang)
            html = poser_selecteur(html, cle, lang)
            html = empreinte(html)
            dest = fichier_de(cle, lang) if cle is not None else SITE / lang / "404.html"
            erreurs += controler(html, lang, dest)
            if ecrire:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(html, encoding="utf-8", newline="")
                ecrits += 1
    return erreurs, ecrits


RE_HREF_INTERNE = re.compile(r'href="(/[^"#?]*)')
PREFIXES_LIBRES = ("/assets/", "/api/", "/c/", "/favicon", "/llms.txt", "/sitemap.xml", "/robots.txt")


def controler(html, lang, dest):
    err = []
    rel = dest.relative_to(SITE).as_posix()
    # Le sélecteur pointe volontairement vers les autres langues : hors contrôle.
    for chemin in RE_HREF_INTERNE.findall(RE_SW.sub("", html)):
        if chemin.startswith(PREFIXES_LIBRES) or chemin.startswith(f"/{lang}/"):
            continue
        if chemin.endswith("/") and chemin not in ("/", "/fr/"):
            err.append(f"{rel} : lien resté en français {chemin}")
    for bloc in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            json.loads(bloc)
        except ValueError as e:
            err.append(f"{rel} : JSON-LD invalide ({e})")
    if not html.rstrip().endswith("</html>"):
        err.append(f"{rel} : fichier tronqué")
    return err


# --- sitemap --------------------------------------------------------------
def sitemap(ecrire):
    p = SITE / "sitemap.xml"
    s = p.read_text(encoding="utf-8")
    s = re.sub(r'\s*<!--i18n-->.*?<!--/i18n-->', "", s, flags=re.S)
    s = re.sub(r'\s*<xhtml:link [^>]*/>', "", s)
    if 'xmlns:xhtml' not in s:
        s = s.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
                      '        xmlns:xhtml="http://www.w3.org/1999/xhtml">')

    def alternates(cle, indent):
        return "".join(f'\n{indent}<xhtml:link rel="alternate" hreflang="{l}" href="{DOMAINE}{url_de(cle, l)}"/>'
                       for l in ("fr", "en", "nl"))

    entrees = re.findall(r'<url><loc>' + re.escape(DOMAINE) + r'(/[^<]*)</loc>(<priority>[^<]*</priority>)?', s)
    cles = []
    for chemin, prio in entrees:
        cle = chemin.strip("/")
        if cle not in SLUGS:
            continue
        cles.append((cle, prio))
        ancien = f'<url><loc>{DOMAINE}{chemin}</loc>{prio}</url>'
        s = s.replace(ancien, f'<url><loc>{DOMAINE}{chemin}</loc>{prio}{alternates(cle, "    ")}\n  </url>', 1)
    bloc = ["  <!--i18n--><!-- Versions EN et NL : bloc régénéré par outils/i18n_build.py,"
            " ne pas éditer à la main. Mêmes pages que le français ci-dessus. -->"]
    for lang in LANGUES:
        for cle, prio in cles:
            bloc.append(f'  <url><loc>{DOMAINE}{url_de(cle, lang)}</loc>{prio}{alternates(cle, "    ")}\n  </url>')
    bloc.append("  <!--/i18n-->")
    s = s.replace("</urlset>", "\n".join(bloc) + "\n</urlset>")
    if ecrire:
        p.write_text(s, encoding="utf-8", newline="")
    return len(cles)


# --- nginx ----------------------------------------------------------------
def nginx(ecrire):
    lignes = []
    for cle in SLUGS:
        for lang in LANGUES:
            lignes.append(f'        "{lang}:{url_de(cle, "fr")}" {url_de(cle, lang)};')
    bloc = ("# >>> i18n — bloc régénéré par outils/i18n_build.py, ne pas éditer à la main\n"
            "map \"$i18n_veut:$uri\" $i18n_cible {\n        default \"\";\n"
            + "\n".join(lignes) + "\n}\n# <<< i18n")
    s = CONF.read_text(encoding="utf-8")
    nouveau = re.sub(r"# >>> i18n.*?# <<< i18n", lambda m: bloc, s, flags=re.S)
    if nouveau == s and "# >>> i18n" not in s:
        raise SystemExit("deploy/default.conf : marqueurs # >>> i18n / # <<< i18n absents")
    if ecrire:
        CONF.write_text(nouveau, encoding="utf-8", newline="")
    return len(lignes)


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows en cp1252
    ecrire = "--check" not in sys.argv
    erreurs, ecrits = traiter(ecrire)
    n_sitemap = sitemap(ecrire)
    n_nginx = nginx(ecrire)
    print(f"pages traduites écrites : {ecrits} ; sitemap : {n_sitemap} pages x 3 langues ;"
          f" redirections nginx : {n_nginx}")
    for e in erreurs:
        print("  !", e)
    sys.exit(1 if erreurs else 0)


if __name__ == "__main__":
    main()
