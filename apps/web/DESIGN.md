# NOIR CASE — Design system

Documentation des trois écrans existants : **Landing** (variante `centered`, la seule retenue), **Auth / connexion**, **Auth / inscription**. Cible d'implémentation : Tailwind CSS v4, tokens déclarés dans `@theme`, aucun `tailwind.config.js`.

Convention de nommage : **sémantique, jamais descriptive**. `--color-accent` et non `--color-amber` ; `--color-surface-raised` et non `--color-gray-900`. Un renommage de palette ne doit toucher que le bloc `@theme`.

---

## 1. Fondations

### 1.1 Couleurs — rôles

**Surfaces** (du plus profond au plus proche du lecteur)

| Token | Valeur | Emploi |
| --- | --- | --- |
| `surface` | `#0A0E13` | Fond de page. Hero, section « comment ça marche », footer, fond de l'écran auth. |
| `surface-alt` | `#0C1117` | Sections alternées (concept, aperçu) et boîte de dialogue in-game. Crée le rythme vertical de la landing — jamais deux sections `surface-alt` consécutives. |
| `surface-raised` | `#111821` | Cartes qui se détachent : les 3 cartes QUI/POURQUOI/COMMENT, la carte du formulaire, l'onglet actif. |
| `surface-inset` | `#0D141B` | Creux : champs de saisie, onglet inactif. Toujours plus sombre que le conteneur qui l'accueille. |

**Bordures**

| Token | Valeur | Emploi |
| --- | --- | --- |
| `border` | `#24303C` | Contour des cartes, des champs, des cadres d'aperçu. Bordure « portante », visible. |
| `border-subtle` | `#1A232D` | Filets de séparation : haut de section, séparateur sous un groupe de champs, grille des cartes concept. Presque invisible, structure seulement. |

**Texte** (six niveaux — c'est beaucoup, mais chacun est utilisé et la lisibilité sur fond sombre dépend de cette granularité)

| Token | Valeur | Contraste sur `surface` | Emploi |
| --- | --- | --- | --- |
| `content` | `#E7ECF2` | 14.9:1 | Titres, réplique de dialogue, valeurs saisies. |
| `content-lede` | `#B6C2D0` | 9.4:1 | Chapô du hero, options de réponse. Réservé aux phrases d'accroche à 20-22px. |
| `content-muted` | `#93A1B0` | 6.4:1 | Corps de texte courant, labels de champs. **Plancher pour tout paragraphe.** |
| `content-subtle` | `#7D8A98` | 4.7:1 | Sous-titres, mentions secondaires, liens de nav en repos. Limite AA pour du texte ≥ 14px. |
| `content-faint` | `#5F6C7A` | 3.1:1 | Métadonnées mono ≤ 12px, texte d'aide sous les champs, copyright. **Décoratif ou non essentiel uniquement** — n'atteint pas AA. |
| `content-ghost` | `#4E5B69` | 2.3:1 | Placeholders de champ, indice de défilement. Jamais porteur d'information. |

**Accent**

| Token | Valeur | Emploi |
| --- | --- | --- |
| `accent` | `#E3B563` | CTA principal, onglet actif, kickers mono, hotspots, numéro d'affaire, liens. |
| `accent-hover` | `#F2CD8A` | Survol du CTA et des liens. |
| `accent-contrast` | `#0A0E13` | Texte posé **sur** l'accent (bouton plein). Identique à `surface` : volontaire, pas une coïncidence à dé-dupliquer. |
| `accent-glow` | `rgb(227 181 99 / 16%)` | Halo « lampe de bureau » du hero et anneau des hotspots. Décliner l'opacité à l'usage (`/16`, `/14`, `/11`, `/7`, `/5`) plutôt que créer cinq tokens.

**États système** — non présents dans les trois écrans, à ajouter avec les formulaires réels :

| Token | Valeur | Emploi |
| --- | --- | --- |
| `danger` | `#D9705E` | Bordure et message d'erreur de champ. Rouge désaturé, tenu dans la même famille froide/chaude que l'accent pour ne pas jurer. |
| `danger-surface` | `rgb(217 112 94 / 10%)` | Fond du bandeau d'erreur de formulaire. |
| `success` | `#7FA98B` | Confirmation (« dossier créé »). Vert éteint, jamais saturé. |

### 1.2 Typographie

| Token | Pile | Rôle |
| --- | --- | --- |
| `font-display` | `'Zilla Slab', Georgia, serif` | Titres. Slab serif : lit comme un rapport dactylographié, reste lisible en très grand. Graisses 600 / 700 seulement. |
| `font-sans` | `'IBM Plex Sans', system-ui, sans-serif` | Corps, boutons, champs. Graisses 400 / 500 / 600. |
| `font-mono` | `'IBM Plex Mono', ui-monospace, monospace` | Le registre « dossier » : kickers, labels de champ, métadonnées, numéros d'affaire. Graisse 400 / 500, **toujours en capitales avec du tracking**. |

Échelle typographique — nommée par rôle, pas par taille :

| Token | Taille / interligne | Font | Emploi |
| --- | --- | --- | --- |
| `text-hero` | 132px / 0.9 / `-0.03em` | display 700 | Titre du hero. Descend à 84px < 1024px, 56px < 768px. |
| `text-title` | 46px / 1.15 / `-0.01em` | display 600 | Titre de section (« Une affaire se résout… »). |
| `text-numeral` | 56px / 1 | display 700 | Chiffres 01/02/03 de « comment ça marche ». |
| `text-heading` | 26–27px / 1.25 | display 600 | Titres d'étape, titre de la carte auth. |
| `text-subheading` | 23px / 1.3 | display 600 | Titres des cartes concept. |
| `text-lede` | 22px / 1.6 | sans 400 | Accroche du hero. |
| `text-body-lg` | 18px / 1.7 | sans 400 | Paragraphe d'introduction de section. |
| `text-body` | 16px / 1.75 | sans 400 | Corps courant, réplique de dialogue. |
| `text-body-sm` | 15px / 1.7 | sans 400 | Texte des cartes, valeurs de champ. |
| `text-ui` | 14px / 1.6 | sans 500/600 | Boutons, texte de bascule, sous-titre de carte. |
| `text-meta` | 13px / 1.7 / `0.06em` | mono 400 | Ligne de contexte sous l'accroche, options de dialogue. |
| `text-label` | 11–12px / `0.18–0.22em` | mono 500 | Labels de champ, kickers de section, onglets. |
| `text-micro` | 10px / `0.18em` | mono 400 | Étiquettes internes de l'aperçu in-game. |

**Tracking.** Trois valeurs seulement, appliquées par famille : display serré (`-0.03em` à `-0.01em`, d'autant plus serré que le corps est grand), sans neutre (`0`, sauf boutons à `0.06em`), mono très ouvert (`0.18em` par défaut, `0.22em` pour les kickers de section). Les autres valeurs relevées dans le code (`0.04em`, `0.1em`, `0.12em`, `0.14em`, `0.16em`, `0.2em`, `0.24em`) sont des dérives d'écriture : **normaliser sur `0.12em` / `0.18em` / `0.22em`** à l'implémentation.

Sur tout paragraphe : `text-wrap: pretty`. Sur les titres : `text-wrap: balance`.

### 1.3 Espacement et mesure

Grille de base **4px**, l'échelle Tailwind par défaut suffit. Rythmes récurrents à retenir :

- Padding vertical de section : `120px` (`py-30`) desktop, `80px` (`py-20`) < 1024px, `64px` < 768px.
- Gouttière de page : `64px` (`px-16`), `32px` < 1024px, `24px` < 640px.
- Largeur de contenu max : `1180px` — token `--container-shell`. La carte auth : `472px` — token `--container-card`.
- Padding de carte : `38px 32px` (cartes concept), `36px` (carte auth), `14–15px` (champ).
- Mesure de texte : `max-w-[46ch]` accroche, `62ch` paragraphe de section, `24ch` titre de section. Ces valeurs en `ch` sont des contraintes de lecture, pas des tokens.
- Intervalle entre champs : `20px` (`gap-5`). Entre label et champ : `9px`.

### 1.4 Profondeur

| Token | Valeur | Emploi |
| --- | --- | --- |
| `shadow-card` | `0 50px 110px -30px rgb(0 0 0 / 95%)` | Carte du formulaire auth. Ombre très basse et très diffuse : la carte semble posée sous une lampe, pas flottante. |
| `shadow-frame` | `0 60px 120px -40px rgb(0 0 0 / 95%)` | Cadre d'aperçu de la scène de jeu. |

**Vignettage** — la signature de l'ambiance, présente sur le hero et l'écran auth. Un pseudo-élément plein écran : `box-shadow: inset 0 0 240px 100px rgb(0 0 0 / 90%)`, `pointer-events-none`. À encapsuler en utilitaire `@utility vignette`.

**Halo de lampe** : `radial-gradient(75% 55% at 50% 22%, var(--color-accent-glow), transparent 60%)`. Sur le hero il porte l'animation `flick` (scintillement de 7s, amplitude faible) ; sur l'auth il est statique. Un seul halo par écran.

### 1.5 Breakpoints

Les défauts Tailwind, sans redéfinition. Ceux qui portent réellement une décision de layout :

| Breakpoint | Ce qui change |
| --- | --- |
| `< 640px` | Gouttière 24px. Boîte de dialogue de l'aperçu : la colonne « répondre » passe sous la réplique. Hero à 56px. |
| `< 768px` (`md`) | Les grilles 3 colonnes (concept, étapes) passent à 1 colonne. La grille concept perd ses filets internes au profit d'un empilement séparé par `border-subtle`. |
| `< 1024px` (`lg`) | Padding de section 80px, gouttière 32px, hero à 84px. |
| `≥ 1280px` (`xl`) | Rien : le contenu est plafonné à `1180px` et se centre. Aucun palier au-delà. |

L'écran auth est **fluide sans breakpoint** : une carte de 472px max qui se centre. Seule la gouttière change.

### 1.6 Mouvement

| Token | Valeur | Emploi |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | Transitions d'interface. |
| Durée UI | `150ms` | Couleurs de survol, bordures de focus. La seule durée de transition du système. |
| `hotspot` | `2.6–2.8s` `ease-in-out` en boucle | Pulsation des points d'interaction. Décalages de `0.7s` entre voisins pour éviter le battement synchrone. |
| `flick` | `7s` `ease-in-out` en boucle | Scintillement du halo. |

Respecter `prefers-reduced-motion: reduce` : `hotspot` et `flick` deviennent des états statiques (opacité pleine, pas de transformation).

---

## 2. Inventaire des composants

### 2.1 `Button` — primaire

CTA plein, ambre. Un seul par écran de valeur (« Commencer l'enquête », « Se connecter », « Créer mon compte »).

Base : `font-sans font-semibold text-ui tracking-[0.06em]`, fond `accent`, texte `accent-contrast`, bordure `1px solid accent`, padding `18px 34px` (hero) ou `16px` pleine largeur (formulaire), **angles vifs — aucun `border-radius` dans tout le système**.

| État | Rendu |
| --- | --- |
| `hover` | fond et bordure `accent-hover`, transition 150ms |
| `active` | fond `accent`, `translate-y-px` |
| `focus-visible` | `outline: 2px solid accent-hover; outline-offset: 3px` — jamais `outline-none` sans remplacement |
| `disabled` | fond `accent/25`, texte `content-faint`, bordure `accent/25`, `cursor-not-allowed`, pas de survol |
| `loading` | libellé conservé mais `opacity-60`, `pointer-events-none`, `aria-busy="true"`, et un indicateur mono à droite : trois points ambrés en pulsation décalée (`hotspot`, 0.9s). Pas de spinner circulaire — étranger au vocabulaire anguleux du système. |

Variante **large** : `px-[34px] py-[18px]`, hero uniquement. Variante **block** : `w-full`, formulaires uniquement.

### 2.2 `Button` — fantôme / lien souligné

Action secondaire (« Le concept », « Créer un compte », « Retour à l'accueil »).

Base : `font-mono text-label`, couleur `content-subtle`, `border-bottom: 1px solid border`, `padding-bottom: 4px`. Pas de fond, pas de padding horizontal.

| État | Rendu |
| --- | --- |
| `hover` | texte `content`, bordure basse `accent` |
| `focus-visible` | `outline: 2px solid accent; outline-offset: 4px` |
| `disabled` | texte `content-ghost`, bordure `border-subtle`, `cursor-not-allowed` |

Sous-variante **inline** (« Créer un compte » dans le pied de carte) : couleur `accent`, `border-bottom: 1px solid accent/40`, `font-sans text-[13px]`.

### 2.3 `Tabs` — bascule connexion / inscription

Deux onglets en `grid-cols-2`, sur `border-b border-border`, sans arrondi ni indicateur glissant.

| État | Rendu |
| --- | --- |
| actif | fond `surface-raised`, texte `accent`, `border-b-2 border-accent`, `font-mono text-label` |
| inactif | fond `surface-inset`, texte `content-subtle`, `border-b-2 border-transparent` |
| `hover` (inactif) | texte `content-muted` |
| `focus-visible` | `outline: 2px solid accent; outline-offset: -2px` (vers l'intérieur : l'onglet touche les bords de la carte) |
| `disabled` | texte `content-ghost`, `cursor-not-allowed` |

Sémantique : `role="tablist"` / `role="tab"` + `aria-selected`, navigation clavier par flèches gauche/droite.

### 2.4 `Field` — champ de saisie

Composé : label mono + input + texte d'aide optionnel + message d'erreur optionnel. `flex flex-col gap-[9px]`.

- **Label** : `font-mono text-label uppercase`, couleur `content-muted`. Peut porter une action alignée à droite (« Oublié ? » en `text-micro`, `content-faint`).
- **Input** : fond `surface-inset`, bordure `1px solid border`, texte `content` en `text-body-sm`, padding `14px 15px`. Champs mot de passe : `letter-spacing: 0.08em`.
- **Aide** : `font-mono text-[11px]`, couleur `content-faint`, interligne 1.6. Porte les contraintes réelles de l'API (`3 à 32 caractères` ; `6 à 32 caractères — une majuscule, une minuscule, un chiffre, un caractère spécial`).

| État | Rendu |
| --- | --- |
| repos | comme ci-dessus ; placeholder `content-ghost` |
| `hover` | bordure `border` éclaircie de 6% (utiliser `color-mix`), sans changement de fond |
| `focus-visible` | bordure `accent`, fond légèrement relevé, **pas d'outline supplémentaire** — la bordure ambre suffit et reste dans le langage anguleux |
| erreur | bordure `danger` ; message sous le champ en `font-mono text-[11px]` couleur `danger`, précédé de `> ` (même préfixe que les lignes de narration in-game) ; `aria-invalid="true"` + `aria-describedby` |
| `disabled` | fond `surface`, bordure `border-subtle`, texte `content-faint`, `cursor-not-allowed` |
| lecture seule | comme `disabled` mais texte `content-muted` et curseur normal |

Le fond de focus `#131C25` relevé du code actuel n'est utilisé qu'ici : le laisser en valeur littérale ou le dériver en `color-mix(in oklab, var(--color-surface-inset), white 3%)`. **Pas de token.**

### 2.5 `Card`

Conteneur `surface-raised` + `border-border`. Deux emplois :

- **Card / concept** : sans ombre, assemblées en grille `gap-px` sur un fond `border-subtle` qui devient les filets internes. Padding `38px 32px`.
- **Card / formulaire** : avec `shadow-card` et un liseré interne `inset 0 0 0 1px rgb(255 255 255 / 2%)` qui décolle la carte du fond. Padding `36px`, en-tête d'onglets à ras bord.

Aucune variante arrondie, aucune variante à accent latéral gauche.

### 2.6 `SectionHeader`

Kicker + filet horizontal. `flex items-center gap-3.5`, marge basse `52px`. Kicker en `font-mono text-label tracking-[0.22em]` couleur `accent`, numéroté (`01 — LE CONCEPT`). Le filet est un `flex-1 h-px bg-border-subtle`.

Variante **centrée** (hero) : filet de 40px de part et d'autre, en `border`.

### 2.7 `Kicker`

Étiquette mono autonome : `font-mono text-label uppercase`. Trois tons selon la fonction — `accent` (identifiant d'affaire, catégorie de carte), `content-muted` (label de champ), `content-faint` (métadonnée, horodatage).

### 2.8 `StepItem`

Numéro fantôme + titre sur un filet, puis paragraphe. Le numéro utilise `text-numeral` en couleur `#1F2A36` : une valeur **utilisée trois fois dans un seul composant**, pour un usage purement décoratif. La dériver de `border` (`color-mix(in oklab, var(--color-border), var(--color-surface) 55%)`) plutôt que d'ajouter un token de palette.

### 2.9 `Hotspot`

Point d'interaction sur une scène. Cercle `12–14px` en `accent`, anneau `box-shadow: 0 0 0 8px accent-glow`, animation `hotspot` en boucle. Le seul élément arrondi du système — c'est un objet de jeu, pas un élément d'interface.

| État | Rendu |
| --- | --- |
| repos | pulsation en boucle |
| `hover` | animation en pause, échelle 1.25, anneau porté à `accent/28`, et affichage de l'étiquette associée |
| `focus-visible` | `outline: 2px solid accent-hover; outline-offset: 6px` (rond, exception assumée) |
| examiné | opacité 45%, plus d'animation |

Étiquette associée (`TIROIR FORCÉ`) : fond `surface/92` + `backdrop-blur-sm`, bordure `1px solid accent`, texte `font-mono text-micro` en `accent`, `whitespace-nowrap`.

### 2.10 `ScenePlaceholder`

Substitut d'illustration en attendant les visuels réels. Rayures diagonales `repeating-linear-gradient(135deg, #151D26 0 12px, #111821 12px 24px)` + légende mono centrée en `content-faint` décrivant ce qui doit y être déposé. Ratios : `16/9` (aperçu), `4/3` (carte pièce à conviction).

Les deux couleurs de rayure ne servent qu'ici et **disparaîtront avec les vraies images** : littéraux, pas de tokens.

### 2.11 `DialogueBox`

Panneau in-game : deux colonnes séparées par un `1px bg-border`, sur `surface-alt/96` + `backdrop-blur-sm`, bordure `border`. Colonne gauche = locuteur (`Kicker` accent) + réplique en `text-body` couleur `content`, guillemets français. Colonne droite (230px) = options de réponse, chacune avec un liseré gauche de 2px : `accent` pour l'option active, `border` pour les autres.

### 2.12 `Footer`

`border-t border-subtle`, padding `56px 64px`. Marque en `font-display` 20px à gauche, liens mono `text-label` en `content-subtle` (survol `accent`) en `flex gap-9 flex-wrap` à droite. Copyright en `content-faint`.

---

## 3. Valeurs à usage unique — ne pas tokeniser

Relevé explicite, pour éviter qu'elles ne deviennent des tokens par réflexe :

- `#131C25` — fond de champ au focus (1 usage). Dériver par `color-mix` ou laisser littéral.
- `#1F2A36` — numéros fantômes des étapes (1 composant). Dériver de `border`.
- `#151D26` / `#111821` — rayures du placeholder d'image. Temporaires par nature.
- `760px` / `520px` — anneaux concentriques du fond de l'auth. Décor géométrique unique.
- `230px` — largeur de la colonne de réponses de la boîte de dialogue.
- `472px` / `1180px` — deux largeurs seulement, mais **elles méritent un token** (`--container-card`, `--container-shell`) parce qu'elles reviennent dans chaque nouvel écran.
- Opacités de l'accent (`/5`, `/7`, `/11`, `/14`, `/16`, `/28`, `/40`) — utiliser la syntaxe d'opacité Tailwind sur `accent`, pas sept tokens.
- Ratios `16/9` et `4/3` — utilitaires natifs.
- `7s` (scintillement) et les décalages `0.7s` / `0.9s` / `1.4s` des hotspots — valeurs d'ambiance, réglées à l'œil.

---

## 4. Bloc `@theme` — prêt à copier

```css
@import "tailwindcss";

@theme {
  /* ---- Surfaces ---- */
  --color-surface:          #0A0E13;
  --color-surface-alt:      #0C1117;
  --color-surface-raised:   #111821;
  --color-surface-inset:    #0D141B;

  /* ---- Bordures ---- */
  --color-border:           #24303C;
  --color-border-subtle:    #1A232D;

  /* ---- Contenu ---- */
  --color-content:          #E7ECF2;
  --color-content-lede:     #B6C2D0;
  --color-content-muted:    #93A1B0;
  --color-content-subtle:   #7D8A98;
  --color-content-faint:    #5F6C7A;
  --color-content-ghost:    #4E5B69;

  /* ---- Accent ---- */
  --color-accent:           #E3B563;
  --color-accent-hover:     #F2CD8A;
  --color-accent-contrast:  #0A0E13;
  --color-accent-glow:      rgb(227 181 99 / 16%);

  /* ---- États système ---- */
  --color-danger:           #D9705E;
  --color-danger-surface:   rgb(217 112 94 / 10%);
  --color-success:          #7FA98B;

  /* ---- Typographie ---- */
  --font-display: 'Zilla Slab', Georgia, serif;
  --font-sans:    'IBM Plex Sans', system-ui, -apple-system, sans-serif;
  --font-mono:    'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;

  --text-hero:            8.25rem;   /* 132px */
  --text-hero--line-height: 0.9;
  --text-hero--letter-spacing: -0.03em;
  --text-hero--font-weight: 700;

  --text-title:           2.875rem;  /* 46px */
  --text-title--line-height: 1.15;
  --text-title--letter-spacing: -0.01em;

  --text-numeral:         3.5rem;    /* 56px */
  --text-numeral--line-height: 1;

  --text-heading:         1.6875rem; /* 27px */
  --text-heading--line-height: 1.25;

  --text-subheading:      1.4375rem; /* 23px */
  --text-subheading--line-height: 1.3;

  --text-lede:            1.375rem;  /* 22px */
  --text-lede--line-height: 1.6;

  --text-body-lg:         1.125rem;  /* 18px */
  --text-body-lg--line-height: 1.7;

  --text-body:            1rem;      /* 16px */
  --text-body--line-height: 1.75;

  --text-body-sm:         0.9375rem; /* 15px */
  --text-body-sm--line-height: 1.7;

  --text-ui:              0.875rem;  /* 14px */
  --text-ui--line-height: 1.6;

  --text-meta:            0.8125rem; /* 13px */
  --text-meta--line-height: 1.7;
  --text-meta--letter-spacing: 0.06em;

  --text-label:           0.6875rem; /* 11px */
  --text-label--line-height: 1.4;
  --text-label--letter-spacing: 0.18em;

  --text-micro:           0.625rem;  /* 10px */
  --text-micro--letter-spacing: 0.18em;

  --tracking-tight-display: -0.03em;
  --tracking-cta:           0.06em;
  --tracking-mono:          0.18em;
  --tracking-mono-wide:     0.22em;

  /* ---- Mesure ---- */
  --container-shell: 1180px;
  --container-card:  472px;

  /* ---- Profondeur ---- */
  --shadow-card:  0 50px 110px -30px rgb(0 0 0 / 95%);
  --shadow-frame: 0 60px 120px -40px rgb(0 0 0 / 95%);

  /* ---- Mouvement ---- */
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --animate-hotspot: hotspot 2.6s ease-in-out infinite;
  --animate-flick:   flick 7s ease-in-out infinite;

  /* Aucun --radius-* : le système est entièrement anguleux.
     Seul le composant Hotspot est rond, via rounded-full local. */
}

@keyframes hotspot {
  0%, 100% { transform: scale(1);    opacity: 0.85; }
  50%      { transform: scale(1.35); opacity: 0.35; }
}

@keyframes flick {
  0%, 100% { opacity: 0.5; }
  47%      { opacity: 0.5; }
  50%      { opacity: 0.34; }
  53%      { opacity: 0.5; }
}

@utility vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 240px 100px rgb(0 0 0 / 90%);
}

@utility lamp-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    75% 55% at 50% 22%,
    var(--color-accent-glow),
    transparent 60%
  );
}

@layer base {
  body {
    background-color: var(--color-surface);
    color: var(--color-content);
    font-family: var(--font-sans);
  }
  h1, h2, h3 {
    font-family: var(--font-display);
    text-wrap: balance;
  }
  p { text-wrap: pretty; }
  a { color: var(--color-accent); text-decoration: none; }
  a:hover { color: var(--color-accent-hover); }
  input::placeholder { color: var(--color-content-ghost); }
  ::selection {
    background: var(--color-accent);
    color: var(--color-accent-contrast);
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. Notes d'implémentation

- La variante `split` du hero est écartée. Le hero retenu est `centered` : pleine hauteur, halo scintillant, titre `text-hero`, deux actions (CTA plein + lien fantôme), indice de défilement en bas.
- Les contraintes affichées sous les champs d'inscription doivent rester synchronisées avec `packages/shared/src/schemas/auth.schema.ts` : c'est la source de vérité (username 3–32 ; mot de passe 6–32 avec majuscule, minuscule, chiffre et caractère spécial parmi `@ $ ! % * ? &`). Faire porter les messages d'erreur par les messages Zod, pas par des chaînes dupliquées côté front.
- Les placeholders rayés sont un dispositif d'attente. Quand les visuels de scène arriveront, `ScenePlaceholder` disparaît et `Hotspot` / `DialogueBox` se posent directement sur l'image ; le vignettage interne du cadre reste, il fait le lien entre l'image et le fond de page.
- Aucun `border-radius`, aucun dégradé multicolore, aucune icône décorative. Le seul dégradé du système est le halo radial ambre.
