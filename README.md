# Site vitrine indusiax.com

Site statique trilingue FR / EN / NL + micro-service de réception des formulaires.
En production sur le VPS Hostinger (76.13.138.23).

## Structure

- `site/` — le site servi par nginx (conteneur `indusiax-landing`, montage
  `/var/www/indusiax-landing`). Pages : accueil, stator, rotor, vector, flux,
  tarifs, essai (funnel + formulaire), a-propos, contact, mentions-legales,
  confidentialite. SEO : `sitemap.xml`, `robots.txt`, JSON-LD par page,
  `hreflang` croisés FR / EN / NL.
- `forms/` — service FastAPI `indusiax-forms` (conteneur `/docker/indusiax-forms`
  sur le VPS, routé par Traefik sur `indusiax.com/api/*`) :
  - `POST /api/essai` et `POST /api/contact` — stockés en SQLite
    (`/var/lib/indusiax-forms/demandes.db`), honeypot + rate-limit 10/h/IP ;
  - `GET /api/demandes?token=<ADMIN_TOKEN>` — consultation des demandes ;
  - notification email si les variables `SMTP_*` sont renseignées dans
    `docker-compose.yml` (mot de passe d'application Gmail).

## Déployer une modification du site

```bash
scp -r site/* root@76.13.138.23:/var/www/indusiax-landing/
```

(nginx sert les fichiers directement, aucun redémarrage nécessaire)

## Déployer une modification de la configuration nginx

La configuration du conteneur `indusiax-landing` vit dans `deploy/default.conf`
(montée en lecture seule depuis `/docker/indusiax-landing/default.conf`). Elle
n'existait que sur le serveur jusqu'au 19/08/2026 : c'est ce qui a laissé passer
l'absence de `charset utf-8`, qui faisait servir `llms.txt` et `sitemap.xml` sans
encodage déclaré — donc en mojibake pour tout client qui ne devine pas l'UTF-8.

```bash
scp deploy/default.conf root@76.13.138.23:/docker/indusiax-landing/default.conf
ssh root@76.13.138.23 "docker exec indusiax-landing nginx -t && docker restart indusiax-landing"
```

## Déployer une modification du service formulaires

```bash
scp forms/main.py root@76.13.138.23:/docker/indusiax-forms/
ssh root@76.13.138.23 "cd /docker/indusiax-forms && docker compose up -d --build"
```

⚠️ Le `docker-compose.yml` du VPS contient `ADMIN_TOKEN` (et les éventuels
réglages SMTP) : ne pas l'écraser sans reporter ces valeurs.

## Multilingue — FR / EN / NL (depuis le 14/10/2026)

> **Règle permanente (Grégory) : toute modification du site se fait dans les
> trois langues, et seulement après validation de Grégory.**

- `site/` = le français, source de vérité. `site/en/` et `site/nl/` sont
  **générés** : ne pas les éditer à la main.
- `i18n/raw/{en,nl}/` = les traductions, à l'arborescence française et avec les
  liens internes laissés en français. `i18n/slugs.json` = les URL traduites.
  `i18n/CONSIGNES-TRADUCTION.md` = ton, glossaire industriel, règles.
- `python -I outils/i18n_build.py` assemble tout : liens réécrits, `hreflang`
  croisés, sélecteur FR · EN · NL, sitemap, empreintes `?v=` des assets, table
  de redirection de `deploy/default.conf`. Il doit sortir sans ligne « ! ».
  `--check` contrôle sans écrire.
- Redirection : nginx renvoie une page FR vers sa version `/en/` ou `/nl/` selon
  la langue du navigateur (nl → NL, fr → FR, autre → EN) ; le cookie `lang` posé
  par le sélecteur passe avant ; les robots ne sont jamais redirigés.
- Textes affichés par `site.js` et `home-film.js` : tables FR/EN/NL dans le code.

Modifier une page : page FR → retraduire `i18n/raw/en/…` et `i18n/raw/nl/…` →
`i18n_build.py` → déployer `site/` (et `deploy/default.conf` si la table de
redirection a changé, c.-à-d. après ajout d'une page).
