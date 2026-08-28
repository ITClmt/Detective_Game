# Collection Bruno — Triviani Detective API

Couvre l'intégralité du flow d'auth : register, login, route protégée,
rotation du refresh, logout, les cas d'erreur et la détection de rejeu. Couvre
aussi la lecture d'une enquête (`GET /cases/:slug`).

## Lancer

Il faut la base, le contenu seedé et l'API debout :

```bash
docker compose up -d db
bun run --cwd apps/api db:migrate
bun run --cwd apps/api db:seed
bun run --cwd apps/api dev
```

Puis, dans l'UI Bruno : ouvrir ce dossier comme collection et sélectionner
l'environnement **Local**.

En ligne de commande, depuis `apps/api/bruno` :

```bash
bunx @usebruno/cli run --env Local -r
```

## Ordre d'exécution

Les dossiers sont numérotés et **l'ordre compte** :

| Dossier | Rôle |
|---|---|
| `Health` | l'API répond |
| `Auth` | le parcours nominal, de l'inscription au logout |
| `Erreurs` | les rejets attendus (400 / 401 / 404 / 409) |
| `Securite` | rotation du refresh et détection de rejeu |
| `Cases` | lecture d'une enquête publiée, et sa progression joueur |

`Auth/Register` génère un email unique à chaque exécution (`sherlock+<timestamp>`),
donc la collection est rejouable sans vider la base entre deux runs. Les
requêtes suivantes réutilisent cet email via la variable runtime `testEmail` :
lancer `Login` seul sans avoir lancé `Register` avant ne marchera pas.

## Variables

`environments/Local.bru` ne contient que ce qui est stable : `host`, `baseUrl`,
le mot de passe de test et `caseSlug` (le slug de l'enquête seedée en local via
`db:seed`, à faire correspondre à `content/verdier.json` — non versionné). Tout
le reste (`accessToken`, `testEmail`, `userId`, les valeurs de refresh) passe
par des **variables runtime** (`bru.setVar`), qui ne sont pas écrites dans le
fichier d'environnement — sinon l'UI Bruno commiterait des tokens à chaque run.

`Cases/Get by slug` s'appuie sur `accessToken`, donc `Auth` doit avoir tourné
avant. Le repository de `cases` filtre `is_published: true` : si l'enquête
seedée est en brouillon (`case.isPublished: false` dans le JSON), ce test
échoue en 404 — c'est attendu, pas un bug de la collection.

Le dossier `Cases` est un scénario ordonné, pas quatre requêtes indépendantes :
`Get by slug` publie `startScene` en variable runtime (lue dans la réponse
plutôt que codée en dur, le contenu n'étant pas versionné), puis
`Get progress` → `Save progress` → `Get progress après sauvegarde` vérifient le
cycle création / écriture / relecture. Le dernier test tient parce que
`Auth/Register` crée un utilisateur neuf à chaque run : sa ligne `player_cases`
n'existe pas encore, donc le premier `GET` doit bien renvoyer l'état de départ.

## Le cookie de refresh

Il n'apparaît jamais dans les réponses JSON : il est posé en `Set-Cookie`
`HttpOnly`, scopé sur `Path=/api/v1/auth`. Bruno gère son cookie jar tout seul,
donc rotation et logout fonctionnent sans rien câbler.

Attention si tu ajoutes des tests : un header `Cookie` écrit à la main **ne
gagne pas** contre le jar, Bruno fusionne les deux et le jar écrase la valeur.
Pour forcer un cookie précis (cas du token volé dans `Securite`), il faut
écrire dans le jar :

```js
const jar = bru.cookies.jar();
await jar.setCookie("{{baseUrl}}/auth/refresh", "refresh_token", maValeur);
```
