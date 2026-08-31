# CLAUDE.md

Guidance pour Claude Code sur ce dépôt.

## Projet

Triviani Detective : jeu d'enquête point & click. Boucle : un **hub** (bureau
du détective) → une **boîte mail** où chaque mail est une enquête proposée →
accepter débloque scènes/personnages/dialogues jusqu'à résolution. Objectif
V1 : une histoire complète jouable de bout en bout, pas un catalogue.

Contenu narratif = **un JSON par histoire** (scènes, personnages, dialogues,
conditions), figé par [case.schema.ts](packages/shared/src/schemas/case.schema.ts)
et interprété par [engine.ts](packages/shared/src/game/engine.ts). Fixture de
test : `content/verdier.json` (non versionné). Back (auth + `cases`) écrit ;
**front à faire** (`apps/web` = scaffold `create-vue`, routes vides). Manque
côté moteur : `isSceneUnlocked()` et `refreshUnlockedScenes()` (rien ne relie
encore `scene.unlockWhen` à `PlayerState.unlockedScenes`).

**Prototype de bout en bout disponible sur la branche
`spike/full-loop-prototype`** : hub → mail → scène (fond + hotspots) →
dialogues, effet `showText`, `interaction`, résolution, changement de scène.
C'est un spike, pas du code final — à reprendre et améliorer, mais c'est la
direction/le rendu qu'on suit pour la suite du front (voir
`apps/web/src/views/SceneView.vue` et `apps/web/src/components/scene/` sur
cette branche).

TODO : l'outil de debug hotspots du prototype (`HotspotDebugOverlay`, touche
D en jeu — glisser un rectangle sur le fond affiche x/y/w/h en %, bouton pour
copier) est à conserver et formaliser en vrai outil d'auteur, pas à perdre en
reprenant le reste du prototype.

Jeu en phase de conception : sur gameplay/format, proposer et faire valider
plutôt que trancher seul.

## Stack

| Chemin | Rôle |
|---|---|
| `apps/api` | Bun + Hono + Drizzle ORM (Postgres) |
| `apps/web` | Vue 3 + Vite + Pinia + vue-router |
| `packages/shared` | Schémas Zod + moteur de jeu (`@repo/shared`) |
| `apps/api/bruno` | Tests d'intégration HTTP (Bruno) |
| `content/` | Enquêtes JSON, non versionné, seedé en local |

Aucun script npm à la racine : tout passe par `bun run --cwd <app>` ou `bunx`.

## Piège de format : sémantique de `when`

| Où | Sémantique | Fonction moteur |
|---|---|---|
| `hotspot.branches[]`, `scene.background[]` | exclusive — 1ère qui matche gagne | `pickFirstMatch()` |
| `dialogueNode.options[]` | additive — toutes celles qui matchent s'affichent | `filterAllMatches()` |
| `solution.endings[]` (`matchAnswers`) | compare les réponses, pas l'état de jeu | `matchAnswers()`, `pickEnding()` |

Ne jamais mélanger les deux premières (vécu sur `laya_studio`/`interphone` →
options dupliquées). Trois fonctions distinctes, jamais d'appel croisé.
Grammaire de conditions : `hasClue`, `hasFlag`, `hasItem`, `clueCount`, `all`,
`any`, `not`.

Personnage optionnellement présent dans une scène → **planche de fond
différente** (branches `{when, image}` dans `scene.background[]`), jamais un
sprite superposé (ne passe pas derrière le décor). Limiter le nombre de
personnages conditionnels par scène (combinatoire en 2ⁿ).

Mécaniques interactives (taper un code...) → effet générique `interaction`
(`action` sélectionne le composant front, `params` libre par `action`,
`onSuccess`/`onFailure` réutilisent le vocabulaire d'effets standard).
Nouvelle mécanique = nouvelle valeur d'`action`, jamais un nouveau verbe
d'effet racine.

## Commandes

**DB + API**
```bash
cp .env.example .env && cp apps/api/.env.example apps/api/.env
docker compose up -d db
bun run --cwd apps/api db:migrate
bun run --cwd apps/api db:seed
bun run --cwd apps/api dev
```
Postgres port hôte **5433**, API **3000**. `db:seed` upsert sur `slug`,
relançable. `docker compose up` sans service nommé build aussi l'API et
écrase `DATABASE_URL` pour viser `db:5432`.

**Schéma Drizzle** — après modif de `src/db/schema/` :
```bash
bun run --cwd apps/api db:generate && bun run --cwd apps/api db:migrate
```
Relire la migration : un renommage de colonne peut sortir en `DROP`+`ADD`.
`drizzle-kit push` seulement en local sur schéma instable. Lancer depuis
`apps/api` (`drizzle.config.ts` lit le `.env` du cwd).

**Front / Tests**
```bash
cp apps/web/.env.example apps/web/.env
bun run --cwd apps/web dev
bun run --cwd apps/web build        # type-check (vue-tsc) puis vite build
bun run --cwd packages/shared test:unit --run
bun run --cwd apps/web test:unit -- --run -t "mounts renders"
```
API sans tests unitaires : couverture via Bruno, DB+seed+API doivent tourner
(`bunx @usebruno/cli run --env Local -r` depuis `apps/api/bruno`). Ordre des
dossiers obligatoire (`Health→Auth→Erreurs→Securite→Cases`) : `Auth/Register`
publie `testEmail`, réutilisé ensuite. Rejouer plusieurs fois/heure épuise le
rate limiter de `register` (5/h). Store en mémoire, reset au redémarrage API.

**Lint**
```bash
bunx biome check --write .
```
Tabulations, guillemets doubles. `apps/api/drizzle` et `apps/api/bruno`
exclus (contenu généré) — ne pas reformater à la main.

## Architecture API

Chaîne par module (`src/modules/<domaine>/`) : `routes.ts` → `controller.ts`
(validation + forme HTTP) → `service.ts` (métier, lève `AppError`) →
`repository.ts` (seul accès Drizzle). `publicUserColumns` exclut le hash mdp
par défaut, exposé seulement via `findByEmailWithPassword`.

**Erreurs** — toujours via `AppError` ([errors.ts](apps/api/src/lib/errors.ts)),
sérialisées uniquement par le handler global. Une `Error` nue = bug serveur.
Utiliser `jsonValidator` ([validator.ts](apps/api/src/lib/validator.ts)), jamais
`zValidator` brut (répondrait en 400 hors `onError`, deux enveloppes
différentes).

**Auth** — access token JWT HS256 15 min, jamais stocké. Refresh token opaque
(48 octets base64url, pas un JWT), cookie `httpOnly` scopé
`Path=/api/v1/auth`, seul son SHA-256 est stocké. Rotation à chaque
`/auth/refresh` ; token déjà révoqué = rejeu → révocation de **toutes** les
sessions (update conditionnel `WHERE revoked_at IS NULL` contre la course
entre deux refresh concurrents). `requireAuth` relit l'utilisateur en base à
chaque requête. `register` renvoie `409` vague (pas d'énumération d'emails),
`login` hash bidon si email inconnu (temps constant), `logout` idempotent.

**Cases** — le back stocke, ne rejoue pas le moteur (le front appelle
`applyEffects`, l'API persiste le `PlayerState` tel quel). `resolution.unlockWhen`
n'est pas revérifié côté serveur (jeu solo, triche inoffensive). `stripSolution()`
retire `solution` de `GET /cases/:slug` (seul `solve` la lit) ;
`interaction.params.answer` part au client, décision assumée. `getProgress`
fait un `return` anticipé si la ligne existe (pas d'upsert, évite d'écraser
une partie en cours) ; `solved_at` posé par update conditionnel
(`WHERE solved_at IS NULL`) — rejouable, mais la date du premier succès ne
doit pas glisser (déclenche `cases.unlock_requirement`).

**Env** — [apps/api/src/env.ts](apps/api/src/env.ts) et
[apps/web/src/env.ts](apps/web/src/env.ts) valident au chargement du module
(crash au démarrage si invalide). Toujours importer `env`/`isProduction` de
là, jamais `process.env` direct.

## Code partagé

Schémas Zod d'entrée API dans `packages/shared`, source de vérité des deux
côtés — exporter tout nouveau schéma depuis `packages/shared/src/index.ts`.

`PlayerState.seenDialogueNodes` : la clé est `${characterId}.${nodeId}`,
**pas** `${dialogueId}.${nodeId}` (ex. `camille.capuchon`) — une confrontation
peut réutiliser des nœuds d'un dialogue antérieur du même personnage.
Toujours passer par `dialogueNodeKey()`, jamais de concaténation manuelle.
Deux dialogues d'un même personnage ne réutilisent un id de nœud que pour le
**même** sujet.

## Conventions

- Commits en anglais, Conventional Commits + scope : `feat(auth): ...`.
- Commentaires/doc en français, expliquent le *pourquoi* pas le *quoi*.
- `.env` jamais committés ; `.env.example` modifié doit rester synchro avec
  le schéma Zod.

## Docs

- Hono complet : https://hono.dev/llms-full.txt
- Hono liste : https://hono.dev/llms.txt
