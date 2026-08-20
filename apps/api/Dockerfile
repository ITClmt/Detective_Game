FROM oven/bun:1

WORKDIR /app

# Copie uniquement les manifests d'abord pour profiter du cache Docker.
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# --production : drizzle-kit, tsx et les @types ne servent qu'au
# développement, inutile de les embarquer dans l'image déployée.
RUN bun install --frozen-lockfile --production

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

WORKDIR /app/apps/api

# L'image oven/bun fournit un utilisateur non privilégié. Sans ça le
# conteneur tourne en root : une faille dans l'API donnerait les pleins
# pouvoirs à l'intérieur du conteneur.
USER bun

EXPOSE 3000

# Les migrations en attente sont appliquées au démarrage, avant que l'API
# n'accepte la moindre requête. Le conteneur ne démarre pas si elles échouent.
#
# Tenable tant qu'une seule instance tourne. Le jour où plusieurs répliques
# démarrent en parallèle, elles se disputeront la table de migrations : il
# faudra sortir l'étape du CMD et en faire un job de déploiement distinct.
#
# Pas de --hot ici : c'est un watcher de développement, et les sources sont
# de toute façon figées dans l'image au moment du build.
CMD ["sh", "-c", "bun run src/db/migrate.ts && bun run src/index.ts"]
