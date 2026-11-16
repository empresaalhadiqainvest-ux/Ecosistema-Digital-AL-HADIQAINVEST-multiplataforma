# Stage 1: Build stage (reproducible Vite + TypeScript compilation)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* bun.lock* ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run lint && npm run build

# Stage 2: Hardened production runtime (non-root user, PoLP)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Instalar curl solo para HEALTHCHECK ligero y limpiar caché apk
RUN apk add --no-cache curl && rm -rf /var/cache/apk/*

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copiar artefactos compilados y servidor headless API-First
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server ./server
COPY --from=builder /app/firestore.rules ./firestore.rules

# Principio de Mínimo Privilegio (PoLP): ejecutar como usuario sin privilegios 'node'
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Sondeo continuo de salud (Auto-Healing en Docker / Swarm)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health/live || exit 1

CMD ["npx", "tsx", "server.ts"]
