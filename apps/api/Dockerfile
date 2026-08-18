FROM oven/bun:1

WORKDIR /app

# Copie uniquement les manifests d'abord pour profiter du cache Docker.
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN bun install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["bun", "run", "--hot", "src/index.ts"]
