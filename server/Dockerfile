# syntax=docker/dockerfile:1

ARG NODE_VERSION=18

FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app

# Installe quelques dépendances système utiles (openssl pour Prisma)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
  && rm -rf /var/lib/apt/lists/*

# Étape deps: installe toutes les deps (dev incluses) pour build et Prisma
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Étape build: génère Prisma Client et build TypeScript
FROM deps AS build
WORKDIR /app
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
RUN npm run build

# Étape final: runtime avec node_modules (incluant dev pour avoir Prisma CLI)
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]


