# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Le projet

Triviani Detective est un **jeu d'enquête point & click**. On incarne un jeune
détective qui résout des affaires pour gagner sa vie.

Boucle de jeu visée :

- un **hub**, le bureau du détective, d'où part tout le reste ;
- une **boîte mail** dans ce bureau : chaque mail est une enquête proposée, les
  affaires arrivent au fil de la progression ;
- **accepter une enquête** débloque ses scènes, ses personnages et ses
  dialogues, et le joueur la suit jusqu'à sa résolution.

Objectif de la V1 : **une histoire complète et jouable** de bout en bout —
quelques scènes, des personnages, des dialogues — pas un catalogue d'affaires.

Le contenu narratif tient dans **un JSON par histoire** (scènes, personnages,
dialogues, conditions de déblocage), le moteur se contentant de l'interpréter.
Le format est figé par [case.schema.ts](packages/shared/src/schemas/case.schema.ts)
et le moteur vit dans [engine.ts](packages/shared/src/game/engine.ts) ; la
première enquête complète est [content/verdier.json](content/verdier.json),
non versionnée (voir `.gitignore`) mais servant de fixture aux tests de
`packages/shared`.

Le piège central du format, déjà tranché mais à ne jamais refaire converger :
la clé `when` n'a pas la même sémantique selon où elle apparaît.

| Où | Sémantique | Fonction du moteur |
|---|---|---|
| `hotspot.branches[]`, `scene.background[]` | **exclusive** — la première qui matche gagne, celle sans `when` en dernier recours | `pickFirstMatch()` |
| `dialogueNode.options[]` | **additive** — toutes celles qui matchent s'affichent | `filterAllMatches()` |
| `solution.endings[]` (`matchAnswers`) | **réponses** — compare `culprit`/`motive`/`method`, pas l'état de partie | `matchAnswers()`, puis `pickEnding()` |

Mélanger les deux premières produit des options dupliquées à l'écran (vécu sur
`laya_studio` / nœud `interphone`). La troisième n'est même pas une
`Condition` : elle évalue un espace de noms qui n'existe pas pendant
l'exploration, et un évaluateur de `when` appliqué là renverrait `false` en
silence. D'où trois fonctions distinctes qui ne s'appellent jamais entre elles.

```json
{ "score": 2, "matchAnswers": { "culprit": "camille" }, ... }
```

La grammaire de conditions porte `hasClue`, `hasFlag`, `hasItem`, `clueCount`,
`all`, `any`, `not`. `any` et `not` ne servent nulle part dans le contenu
actuel : ils ont été prévus dès le départ pour ne pas avoir à re-valider tout
le contenu déjà écrit le jour où ils deviennent nécessaires.

Choix d'art retenu : un personnage optionnellement présent dans une scène
(Camille, absente du duplex une fois l'hôpital débloqué) se traduit par une
**planche de fond différente**, pas par un sprite superposé au runtime. Un
sprite ne peut pas se placer derrière un élément de décor (comptoir, meuble),
alors qu'une planche dédiée le peut nativement. Le coût en images reste
maîtrisable tant que les scènes futures limitent le nombre de personnages
simultanément conditionnels — au-delà, le nombre de planches explose en 2ⁿ.
`scenes[].background` accepte donc soit une chaîne (fond fixe), soit un
tableau de branches `{ when, image }` avec la même convention que les
hotspots — première branche dont le `when` matche, sinon celle sans `when`.

Les mécaniques d'interaction (le joueur doit *faire* quelque chose — taper un
code, pas juste avoir vu un indice) passent par un effet générique
`interaction`, plutôt qu'un verbe d'effet ad hoc par mécanique :

```json
{
  "interaction": {
    "action": "input",
    "prompt": "L'écran réclame un code à quatre chiffres.",
    "params": { "kind": "number", "length": 4, "answer": "1403" },
    "onSuccess": [{ "showText": "..." }, { "addClue": "..." }],
    "onFailure": [{ "showText": "..." }]
  }
}
```

`action` est le seul champ que le moteur doit connaître à l'avance — il
sélectionne le composant à monter (`{ input: InputWidget, ... }` côté front).
`params` est libre, propre à chaque `action` (`kind`/`length`/`answer` pour
`input`, autre chose pour une future serrure à combinaison). `onSuccess` /
`onFailure` restent dans le même vocabulaire d'effets que partout ailleurs
(`showText`, `addClue`...) — la résolution succès/échec ne se réinvente pas à
chaque mécanique, seul le rendu de la mécanique elle-même varie. Une nouvelle
enquête avec une mécanique différente ajoute une valeur d'`action` et un
composant, jamais un nouveau verbe d'effet au niveau racine.

État réel du dépôt : l'authentification et le domaine de jeu côté serveur sont
écrits — format d'enquête, moteur, tables `cases` / `player_cases`, et les
quatre routes du module `cases` (lecture, progression, résolution). **Le front
reste entièrement à faire** : `apps/web` est le scaffold `create-vue` d'origine,
avec un tableau `routes` vide.

Ce qui manque encore côté moteur, volontairement laissé de côté : rien ne relie
`scene.unlockWhen` à `PlayerState.unlockedScenes`. Il faudra un
`isSceneUnlocked()` (une scène **sans** `unlockWhen` est ouverte d'emblée, elle
n'entre jamais dans `unlockedScenes` — sinon Halo Studio est injouable) et un
`refreshUnlockedScenes()` appelé après chaque `applyEffects`, qui renvoie les
scènes nouvellement ouvertes pour que leur `unlockText` se joue une seule fois.

Le jeu reste en phase de conception : sur le gameplay et le format, proposer et
faire valider plutôt que trancher seul.

## Structure

| Chemin | Rôle |
|---|---|
| `apps/api` | API HTTP — Bun + Hono + Drizzle ORM (Postgres) |
| `apps/web` | SPA — Vue 3 + Vite + Pinia + vue-router |
| `packages/shared` | Schémas Zod, types partagés et moteur de jeu (`@repo/shared`) |
| `apps/api/bruno` | Collection Bruno : tests d'intégration HTTP de l'API |
| `content/` | Enquêtes au format JSON — **non versionné**, seedé en local |

Le lockfile (`bun.lock`), la config Biome, `tsconfig.base.json` et le
`docker-compose.yml` vivent à la racine. Il n'y a **aucun script npm à la
racine** : tout passe par `bun run --cwd <app>` ou `bunx`.

## Commandes

### Base de données + API

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
docker compose up -d db
bun run --cwd apps/api db:migrate
bun run --cwd apps/api db:seed
bun run --cwd apps/api dev
```

`db:seed` charge `content/verdier.json`, le valide avec `parseCaseFile()` et
l'insère dans `cases` — les colonnes SQL (`slug`, `title`, `sort_order`,
`is_published`) sont dérivées du jsonb, jamais l'inverse. Le script est un
upsert sur `slug` : relançable à volonté pendant qu'on itère sur le contenu.
Une enquête dont `case.isPublished` vaut `false` est seedée mais invisible de
l'API, qui filtre `is_published: true`.

Postgres est exposé sur le port hôte **5433**, l'API sur **3000**.
`docker compose up` (sans service nommé) build aussi l'image API et la fait
tourner sur le réseau Docker : dans ce cas le `DATABASE_URL` du `.env` est
écrasé par le compose pour viser `db:5432` au lieu de `localhost:5433`.

### Schéma Drizzle

Les migrations sont **générées et committées** dans `apps/api/drizzle/`. Après
toute modification d'un fichier de `src/db/schema/` :

```bash
bun run --cwd apps/api db:generate
```

```bash
bun run --cwd apps/api db:migrate
```

La migration produite se relit comme n'importe quel diff — vérifier notamment
qu'un renommage de colonne n'a pas été généré en `DROP` + `ADD`, ce que le
diffing ne sait pas distinguer.

`drizzle-kit push` reste utilisable **sur ta base locale uniquement**, pendant
qu'un schéma est encore instable : `generate` diffe le snapshot du dossier
`drizzle/`, pas la base vivante, donc pousser en local ne fausse pas la
migration générée ensuite. En revanche la base locale dérive de l'historique —
la recréer et rejouer les migrations depuis zéro est le vrai test.

Toujours lancer drizzle-kit **depuis `apps/api`** (ce que fait `--cwd`) :
`drizzle.config.ts` importe `src/env.ts`, qui lit le `.env` du répertoire
courant. Depuis la racine, la validation Zod de l'env échoue.

En production, les migrations tournent **au démarrage du conteneur**, avant
l'API (voir le `CMD` du Dockerfile). Le script est
[src/db/migrate.ts](apps/api/src/db/migrate.ts) : il passe par le migrator de
`drizzle-orm` et non par `drizzle-kit migrate`, car drizzle-kit est une
devDependency absente de l'image (`bun install --production`). Ne pas déplacer
drizzle-kit en dépendance de production pour contourner ça.

### Front

```bash
cp apps/web/.env.example apps/web/.env
bun run --cwd apps/web dev
bun run --cwd apps/web build
bun run --cwd apps/web type-check
```

`build` enchaîne `type-check` (vue-tsc) et `build-only` (vite build) via `run-p`.

### Tests

`packages/shared` — Vitest, couvre le schéma d'enquête et le moteur contre
`content/verdier.json` pris comme fixture :

```bash
bun run --cwd packages/shared test:unit --run
```

Les tests lisent la fixture au lieu de coder en dur des valeurs de contenu :
un renommage de personnage ou une URL d'asset changée ne doit pas les casser.

Front — Vitest + jsdom :

```bash
bun run --cwd apps/web test:unit
```

```bash
bun run --cwd apps/web test:unit -- --run src/__tests__/App.spec.ts
```

```bash
bun run --cwd apps/web test:unit -- --run -t "mounts renders"
```

API — pas de tests unitaires, la couverture passe par Bruno. La base, le seed
et l'API doivent tourner. Depuis `apps/api/bruno` :

```bash
bunx @usebruno/cli run --env Local -r
```

L'ordre des dossiers compte (`Health` → `Auth` → `Erreurs` → `Securite` →
`Cases`) : `Auth/Register` génère l'email de test et le publie en variable
runtime `testEmail` que les requêtes suivantes réutilisent — lancer `Login`
seul ne marche pas. Même chose pour `Cases`, qui est un scénario ordonné
(lecture → progression → résolution) sur l'utilisateur neuf du run.

Piège de rejeu : relancer la collection plusieurs fois dans l'heure épuise le
rate limiter de `register` (5/heure) et fait échouer tout le reste en cascade
par manque de token. Le store est une `Map` en mémoire — redémarrer l'API le
remet à zéro.

Voir [apps/api/bruno/README.md](apps/api/bruno/README.md) pour le détail :
manipulation du cookie jar, dépendances d'ordre, et le fait que `bru.getVar()`
ne lit que les variables runtime, jamais celles du fichier d'environnement.

### Lint / format

Biome 2.5.8, dev dependency à la racine :

```bash
bunx biome check --write .
```

Conventions imposées par `biome.json` : indentation **tabulations**, guillemets
doubles, imports triés automatiquement.

`apps/api/drizzle` et `apps/api/bruno` sont exclus : leur contenu est généré
(snapshots drizzle-kit, fichiers de l'UI Bruno) et serait reformaté à chaque
régénération. Ne pas les reformater à la main.

## Architecture de l'API

### Découpage en modules

`src/index.ts` (middlewares globaux + handler d'erreurs) → `src/router.ts`
(monte tout sous `/api/v1`) → `src/modules/<domaine>/`. Chaque module suit la
même chaîne de responsabilités, à respecter pour tout nouveau domaine :

```
<domaine>.routes.ts      déclare les chemins, spread des handlers du controller
<domaine>.controller.ts  createFactory().createHandlers → validation + forme de la réponse HTTP
<domaine>.service.ts     règles métier, lève des AppError
<domaine>.repository.ts  accès Drizzle, seul endroit qui parle à la DB
```

Le controller n'accède jamais à la DB ; le repository ne connaît pas HTTP. Le
repository expose une constante `publicUserColumns` — les colonnes sensibles
(hash du mot de passe) ne sortent que par une méthode explicitement nommée
(`findByEmailWithPassword`).

`/ping` est monté hors de `/api/v1`, directement dans `src/index.ts`.

### Erreurs

Toute erreur destinée au client passe par `AppError`
([src/lib/errors.ts](apps/api/src/lib/errors.ts)) et ses helpers `badRequest` /
`unauthorized` / `conflict`. Le handler global de `src/index.ts` est le seul
point qui sérialise, toujours sous la même forme :

```json
{ "error": { "code": "...", "message": "..." } }
```

Ce qui n'est pas une `AppError` est loggé côté serveur et renvoyé en 500
anonyme. Ne jamais construire une réponse d'erreur depuis un handler.

Le choix entre les deux n'est pas cosmétique : `AppError` veut dire « le client
peut corriger sa requête ». Un contenu d'enquête incomplet (aucune fin ne
couvrant un score atteignable, dans `casesService.solve`) lève un `Error` nu —
le client n'y peut rien, c'est un bug serveur.

Corollaire pour la validation : utiliser `jsonValidator` de
[src/lib/validator.ts](apps/api/src/lib/validator.ts), jamais `zValidator`
brut — `zValidator` répond lui-même en 400 avec le `ZodError` sans passer par
`onError`, ce qui donnerait deux enveloppes d'erreur différentes au client.

### Authentification

Deux tokens de nature différente :

- **Access token** : JWT HS256 court (`ACCESS_TOKEN_TTL`, 15 min par défaut),
  jamais stocké en base, renvoyé dans le body, à garder en mémoire côté client.
  Payload `{ sub, role, exp }`.
- **Refresh token** : valeur opaque aléatoire (48 octets base64url), **pas un
  JWT**. Envoyé en cookie `httpOnly` scopé sur `Path=/api/v1/auth`. La base ne
  stocke que son SHA-256.

Le refresh est **à rotation** : chaque `/auth/refresh` révoque le token présenté
et en émet un nouveau. Présenter un token déjà révoqué est traité comme un
rejeu → révocation de **toutes** les sessions de l'utilisateur. La révocation
est conditionnelle (`WHERE revoked_at IS NULL ... RETURNING`) pour que deux
refresh concurrents ne puissent pas passer tous les deux.

`requireAuth` ([src/middlewares/auth.middleware.ts](apps/api/src/middlewares/auth.middleware.ts))
relit l'utilisateur en base à chaque requête, pour qu'une suppression de compte
ou un changement de rôle prenne effet sans attendre l'expiration du JWT. Il
expose l'utilisateur via `c.get("user")` — typer le `Hono<AuthEnv>`
correspondant.

Autres invariants de sécurité déjà en place, à ne pas casser : `register`
renvoie un `409 ERROR_REGISTER` volontairement vague (pas d'énumération
d'emails) ; `login` vérifie un hash bidon quand l'email est inconnu pour rester
à temps constant ; `logout` est idempotent. Les mots de passe sont hachés avec
`Bun.password`.

### Enquêtes et progression

Module `cases`, quatre routes, toutes derrière `requireAuth` :

| Route | Rôle |
|---|---|
| `GET /cases/:slug` | le `CaseFile` **sans `solution`** |
| `GET /cases/:slug/progress` | crée l'état de départ au premier appel, relit ensuite |
| `PUT /cases/:slug/progress` | remplace l'état par celui envoyé par le front |
| `POST /cases/:slug/solve` | score les réponses, choisit la fin, pose `solved_at` |

**Le back stocke, il ne rejoue pas le moteur.** C'est le front qui appelle
`applyEffects` et compagnie à chaque clic ; l'API se contente de persister le
`PlayerState` qu'on lui tend. Corollaire assumé : `resolution.unlockWhen` n'est
pas vérifié côté serveur, et un joueur peut appeler `solve` quand il veut. Le
jeu est solo et sans classement — la triche ne lèse personne, et une
revalidation métier côté back avait justement été retirée pour ça.

La seule chose que le serveur protège, c'est le **spoiler non sollicité** :
`stripSolution()` retire `solution` de `GET /cases/:slug`, parce que n'importe
qui ouvrant l'onglet Réseau y verrait le coupable sans l'avoir cherché. En
revanche `interaction.params.answer` (un code d'énigme) part au client — décision
explicite, pas un oubli. `solve` est le seul endroit qui lit `solution`.

Deux gardes-fou à ne pas casser :

- `getProgress` fait un `return` anticipé quand la ligne existe, au lieu de
  passer par l'upsert : sinon un premier appel concurrent écraserait une partie
  entamée par l'état de départ.
- `solved_at` est posé par update conditionnel (`WHERE solved_at IS NULL`), même
  patron que `revokeRefreshToken`. Rejouer la résolution reste permis, mais la
  date du premier succès est ce qui débloquera les enquêtes suivantes
  (`cases.unlock_requirement`) et ne doit pas glisser.

`GET /cases/:slug/progress` revalide l'état relu avec `playerStateSchema` avant
de le renvoyer : une sauvegarde écrite avant une évolution du format lève une
erreur nette au lieu de casser le front sur un champ absent.

### Environnement

[apps/api/src/env.ts](apps/api/src/env.ts) valide `process.env` avec Zod **au
chargement du module** : une variable manquante ou invalide fait crasher le
process au démarrage. Toujours lire la config via `env` / `isProduction`
importés de là, jamais `process.env` directement. Même principe côté web avec
[apps/web/src/env.ts](apps/web/src/env.ts), plus la déclaration de type dans
`apps/web/env.d.ts` à tenir à jour.

## Code partagé

Les schémas Zod d'entrée d'API vivent dans `packages/shared` et sont la source
de vérité des deux côtés : le back valide avec, le front doit valider ses
formulaires avec les mêmes. Ajouter un schéma = l'exporter depuis
`packages/shared/src/index.ts`.

L'import se fait par sous-chemin (`@repo/shared/schemas/auth.schema`) ou par la
racine (`@repo/shared`) ; les deux marchent via les `exports` du package.

`packages/shared` porte aussi le **moteur de jeu** (`src/game/`) : `engine.ts`
(évaluation des conditions, effets, score et fins), `state.ts` (`PlayerState`
et son schéma) et `public.ts` (`stripSolution`). Il tourne côté front ; le back
n'en importe que `playerStateSchema`, `createPlayerState`, `stripSolution` et
`pickEnding`.

Un point de vigilance sur `PlayerState.seenDialogueNodes` (les sujets de
dialogue déjà joués, pour les griser sans les interdire) : la clé est
`${characterId}.${nodeId}`, **pas** `${dialogueId}.${nodeId}`. La question du
joueur est « ai-je déjà demandé ça à Camille ? », pas « dans quelle pièce » —
et `camille_confrontation` reprend volontairement des nœuds de `camille_duplex`
au cas où le joueur les aurait manqués. Toujours passer par `dialogueNodeKey()`
plutôt que de concaténer à la main, sinon front et sauvegarde divergent en
silence sur le séparateur. Conséquence côté contenu : deux dialogues d'un même
personnage ne doivent réutiliser un id de nœud que pour le **même** sujet.

## Front

Scaffold Vue 3 encore quasi vierge : `src/router/index.ts` a un tableau `routes`
vide, `src/stores/counter.ts` est le store d'exemple du template, et
`apps/web/README.md` est celui de `create-vue`. Alias `@` → `src`.
`noUncheckedIndexedAccess` est activé sur l'app (pas sur l'API).

## Conventions

- Commits en **anglais**, Conventional Commits avec scope :
  `feat(auth): ...`, `fix(api): ...`, `chore: ...`, `test(api): ...`.
- Commentaires et documentation en **français**. Le style en place explique le
  *pourquoi* (le piège évité, la propriété de sécurité visée), pas le *quoi*.
- Les `.env` ne sont jamais committés ; tout `.env.example` modifié doit rester
  synchronisé avec le schéma Zod correspondant.
- Tu peux utiliser les outils disponible (comme Bruno for API testing)

## Docs

- Full Docs Hono : https://hono.dev/llms-full.txt
- Docs List Hono : https://hono.dev/llms.txt

