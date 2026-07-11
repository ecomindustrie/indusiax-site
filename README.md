# Site vitrine indusiax.com

Site statique (9 pages FR) + micro-service de réception des formulaires.
En production sur le VPS Hostinger (76.13.138.23).

## Structure

- `site/` — le site servi par nginx (conteneur `indusiax-landing`, montage
  `/var/www/indusiax-landing`). Pages : accueil, stator, rotor, vector, flux,
  tarifs, essai (funnel + formulaire), a-propos, contact, mentions-legales,
  confidentialite. SEO : `sitemap.xml`, `robots.txt`, JSON-LD par page,
  `hreflang` prêt pour le multilingue (FR seul pour l'instant).
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

## Déployer une modification du service formulaires

```bash
scp forms/main.py root@76.13.138.23:/docker/indusiax-forms/
ssh root@76.13.138.23 "cd /docker/indusiax-forms && docker compose up -d --build"
```

⚠️ Le `docker-compose.yml` du VPS contient `ADMIN_TOKEN` (et les éventuels
réglages SMTP) : ne pas l'écraser sans reporter ces valeurs.

## Multilingue (plus tard)

Une langue = un sous-dossier (`/en/`, `/nl/`, `/it/`) reproduisant l'arbo
française avec les contenus traduits + balises `hreflang` croisées dans chaque
`<head>` + entrées ajoutées au `sitemap.xml`.
