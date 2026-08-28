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

Le contenu narratif est pensé pour tenir dans **un JSON par histoire** (scènes,
personnages, dialogues, conditions de déblocage), le moteur se contentant de
l'interpréter. Cette piste est retenue mais **pas encore implémentée** : ni le
format, ni le moteur de scènes, ni le modèle de progression n'existent dans le
code aujourd'hui. Un premier jet complet vit dans
[content/verdier.json](content/verdier.json), pour explorer la forme avant de
la figer en schéma.

Un piège déjà identifié en écrivant ce premier JSON, à trancher explicitement
quand le schéma Zod du moteur se conçoit : la clé `when` n'a pas la même
sémantique selon où elle apparaît. Sur les `branches` d'un hotspot, la
convention est « première branche dont le `when` matche, sinon celle sans
`when` en dernier » — un ordre exclusif. Sur les `options` d'un dialogue,
toutes celles dont le `when` matche s'affichent — un filtre additif. Mélanger
les deux sans le documenter produit des options dupliquées à l'écran (vécu sur
`sofia_studio` / nœud `interphone`). La grammaire de conditions elle-même
(`hasClue`, `hasFlag`, `clueCount`, `all`) manque de `any` et de `not` — ils
finiront par être nécessaires, autant les prévoir dans le schéma dès le
départ plutôt que les ajouter au coup par coup.

Troisième sémantique, distincte des deux précédentes : les `endings` de
`resolution` ont besoin de sélectionner un texte selon la **réponse** donnée
par le joueur (`culprit`, `motive`, `method`), pas selon l'état de partie
(clues/flags) qu'évalue `when` partout ailleurs. C'est un espace de noms qui
n'existe même pas pendant l'exploration — un évaluateur unique appliqué
naïvement à `when` sur les trois structures planterait ou renverrait `false`
en silence sur celle-ci. D'où une clé distincte, `matchAnswers`, réservée aux
`endings` :

```json
{ "score": 2, "matchAnswers": { "culprit": "camille" }, ... }
```

Le contenu actuel utilise déjà les trois — `when` exclusif sur les branches,
`when` additif sur les options de dialogue, `matchAnswers` sur les endings —
et le moteur devra les distinguer explicitement dans son évaluateur, pas les
faire converger sur une seule fonction générique.

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

État réel du dépôt : seule l'authentification est écrite (register / login /
refresh / logout / me). Le domaine de jeu — enquêtes, scènes, progression du
joueur — reste **entièrement à concevoir**, côté schéma DB comme côté front. Le
jeu est en phase de conception : sur ces sujets, proposer et faire valider
plutôt que trancher seul.

## Structure

| Chemin | Rôle |
|---|---|
| `apps/api` | API HTTP — Bun + Hono + Drizzle ORM (Postgres) |
| `apps/web` | SPA — Vue 3 + Vite + Pinia + vue-router |
| `packages/shared` | Schémas Zod et types partagés front/back (`@repo/shared`) |
| `apps/api/bruno` | Collection Bruno : tests d'intégration HTTP de l'API |

Le lockfile (`bun.lock`), la config Biome, `tsconfig.base.json` et le
`docker-compose.yml` vivent à la racine. Il n'y a **aucun script npm à la
racine** : tout passe par `bun run --cwd <app>` ou `bunx`.

## Commandes

### Base de données + API

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
docker compose up -d db
bun run --cwd apps/api dev
```

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

API — pas de tests unitaires, la couverture passe par Bruno. La base et l'API
doivent tourner. Depuis `apps/api/bruno` :

```bash
bunx @usebruno/cli run --env Local -r
```

L'ordre des dossiers compte (`Health` → `Auth` → `Erreurs` → `Securite`) :
`Auth/Register` génère l'email de test et le publie en variable runtime
`testEmail` que les requêtes suivantes réutilisent — lancer `Login` seul ne
marche pas. Voir [apps/api/bruno/README.md](apps/api/bruno/README.md) pour le
détail, notamment la manipulation du cookie jar.

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

