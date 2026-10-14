# Consignes de traduction — indusiax.com (FR → EN, FR → NL)

Ces consignes s'appliquent à chaque traduction de page, initiale ou future.
**Règle permanente (Grégory, 14/10/2026) : toute modification du site se fait
dans les trois langues (FR, EN, NL), après validation de Grégory.**

## Le lectorat

Dirigeants, responsables commerciaux, responsables maintenance et
techniciens de TPE/PME industrielles : fabricants, distributeurs techniques,
mainteneurs, prestataires de contrôle. Ce sont des lecteurs techniques, pressés
et méfiants envers le jargon marketing. Le ton du site français est direct,
concret et sobre. Il faut le garder.

- **EN** : anglais britannique (organise, optimise, colour, centre), registre
  B2B sobre. Pas de superlatifs américains (« game-changing », « supercharge »,
  « unlock »).
- **NL** : néerlandais standard, compréhensible aux Pays-Bas comme en Flandre.
  Vouvoiement « u » partout (B2B). Composés soudés à la néerlandaise
  (« onderhoudsplanning », « buitendiensttechnicus »).
- Traduis le sens, pas les mots. Une tournure française idiomatique devient une
  tournure naturelle dans la langue cible. Un lecteur natif ne doit jamais
  sentir la traduction.

## Ce qu'il faut traduire

Tout le texte visible et tout ce que lisent les moteurs ou les lecteurs d'écran :
- `<title>`, `meta description`, `og:title`, `og:description`, `twitter:*` ;
- les attributs `alt`, `aria-label`, `title`, `placeholder` ;
- les valeurs texte du JSON-LD (`name`, `headline`, `description`, questions et
  réponses `FAQPage`, `HowTo`…), y compris `"inLanguage": "fr"` → `"en"` / `"nl"`
  quand la clé existe ;
- le texte des `<option>` (pas leur `value`), des boutons et des labels ;
- les chaînes affichées à l'utilisateur dans les `<script>` en ligne de la page
  (messages, libellés) ;
- le texte inscrit dans les SVG en ligne (`<text>`, `<tspan>`).

## Ce qu'il ne faut JAMAIS toucher

- **Les `href` internes** : laisse-les EXACTEMENT comme en français
  (`/tarifs/`, `/blog/relance-client-pme-industrielle/`, `/essai/?produit=stator`).
  Un script les réécrit ensuite vers `/en/…` et `/nl/…`. Ne les préfixe pas, ne
  les traduis pas.
- Les URL absolues `https://indusiax.com/...` (canonical, og:url, JSON-LD) :
  laisse-les telles quelles, le script les gère aussi.
- Les liens externes (sous-domaines `*.indusiax.com`, sites tiers).
- Les attributs `id`, `class`, `name`, `value`, `for`, `data-*`, `style`, et les
  ancres `#…` : la table des matières et les formulaires en dépendent.
- Les chemins d'images et d'assets (`/assets/...`), les balises `<link>`,
  `<script src>`, les `<style>`, le code JavaScript lui-même (seulement ses
  chaînes affichées).
- La structure HTML : même nombre de balises, même ordre. N'ajoute ni ne retire
  de section. Ne « résume » rien et ne coupe rien.
- Les commentaires HTML/CSS/JS peuvent rester en français.
- Les balises `hreflang` et `<html lang>` : laisse-les, le script les réécrit.

## Noms, prix et faits

- Noms de produits inchangés : **Stator-CRM, Rotor-FSM, Vector-MOM, Flux-Link,
  Contiax, Indusiax**, « Suite Indusiax » → « Indusiax Suite » (EN) /
  « Indusiax Suite » (NL).
- Signature **« By industry, for industry. »** : en anglais d'origine, ne pas
  traduire, dans aucune langue.
- Prix : garde les montants et l'euro. Format EN `€650`, `€12`. Format NL
  `€ 650`, `€ 12`. « HT » → EN « excl. VAT », NL « excl. btw ». « par
  utilisateur et par an » → « per user per year » / « per gebruiker per jaar ».
- « TVA non applicable, art. 293 B du CGI » → EN « VAT not applicable — French
  VAT exemption, art. 293 B CGI » / NL « Btw niet van toepassing — Franse
  btw-vrijstelling, art. 293 B CGI ».
- Ne change aucun chiffre, aucune date, aucun délai, aucune promesse (30 jours
  d'essai, 24 h, sans carte bancaire, hébergement en UE…).
- Les références réglementaires françaises (arrêtés, Code du travail, CGI, RGPD,
  CNIL, SIRET) restent françaises : ce sont des faits. Garde le nom français et
  ajoute si utile une courte glose entre parenthèses à la première occurrence,
  par exemple « VGP (vérifications générales périodiques — France's mandatory
  periodic inspections) ». N'invente pas d'équivalent néerlandais ou britannique.
- RGPD → EN « GDPR », NL « AVG (GDPR) ».
- Les concurrents et outils tiers gardent leur nom.
- « Made in France » / « PME industrielle française » : garde l'origine
  française, c'est un argument.

## Glossaire imposé

| Français | English | Nederlands |
|---|---|---|
| TPE & PME industrielles | small and mid-sized industrial companies | industriële kmo's en mkb-bedrijven (préférer « industriële mkb-bedrijven ») |
| PME | SME | mkb-bedrijf |
| entreprise industrielle | industrial company | industrieel bedrijf |
| CRM commercial | sales CRM | sales-CRM |
| devis | quote | offerte |
| demande de devis | quote request | offerteaanvraag |
| relance (client, devis) | follow-up | opvolging |
| affaire / opportunité | deal | deal / verkoopkans |
| fiche client | customer record | klantfiche |
| tournée | sales round / route | ronde / route |
| SAV | after-sales service | after-sales / klantenservice |
| intervention terrain | field intervention / field service job | interventie / buitendienstopdracht |
| technicien terrain | field technician | buitendiensttechnicus |
| contrôle, vérification périodique | inspection, periodic inspection | keuring, periodieke keuring |
| bureau de contrôle | inspection body | keuringsinstantie |
| rapport d'intervention (PDF) | service report (PDF) | interventierapport (pdf) |
| maintenance préventive / curative | preventive / corrective maintenance | preventief / correctief onderhoud |
| GMAO | CMMS | CMMS (onderhoudsbeheersysteem) |
| parc (machines) | equipment base / installed base | machinepark |
| compte-rendu de réunion | meeting minutes | vergaderverslag |
| salon professionnel | trade show | vakbeurs |
| carte de visite | business card | visitekaartje |
| essai gratuit 30 jours | 30-day free trial | 30 dagen gratis proberen |
| sans carte bancaire | no credit card required | zonder creditcard |
| sur devis | on quotation | op offerte |
| Tarifs | Pricing | Prijzen |
| À propos | About | Over ons |
| Outils | Tools | Tools |
| Mentions légales | Legal notice | Wettelijke vermeldingen |
| Confidentialité | Privacy | Privacy |
| CGV | Terms of sale | Verkoopvoorwaarden |
| Sécurité | Security | Beveiliging |
| hébergé en UE / en Europe | hosted in the EU / in Europe | gehost in de EU / in Europa |
| saisie (ressaisie) | data entry (re-keying) | invoer (dubbele invoer) |
| atelier | workshop / shop floor | werkplaats |
| dirigeant | managing director / owner | directeur / zaakvoerder |

## Pages juridiques (CGV, mentions légales, confidentialité)

Traduction fidèle et complète, article par article, sans reformuler le fond.
Ajoute en tête du contenu principal, juste après le titre H1, un paragraphe :
- EN : « This translation is provided for information only. The French version
  of this document is the only legally binding version. »
- NL : « Deze vertaling wordt uitsluitend ter informatie verstrekt. Alleen de
  Franse versie van dit document is juridisch bindend. »
Donne-lui la même classe que le premier paragraphe qui suit le H1, s'il en a une.

## Contrôle avant de rendre le fichier

1. Plus aucun mot français dans le texte visible, le `<head>` et le JSON-LD
   (hors noms propres, références réglementaires, commentaires de code).
2. Le JSON-LD est toujours du JSON valide (guillemets échappés).
3. Le fichier traduit a la même structure que l'original (mêmes balises
   ouvrantes, à quelques `<br>` près).
4. Encodage UTF-8, entités HTML conservées (`&amp;`, `&nbsp;`).
