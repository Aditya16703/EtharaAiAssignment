# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# openssl is required by Prisma engine on Alpine (OpenSSL 3.x)
RUN apk add --no-cache openssl

# Install ALL deps (including devDependencies for tsc)
COPY package*.json ./
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client with the linux-musl-openssl-3.0.x binary
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# ── Stage 2: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Same openssl needed at runtime by the Prisma query engine
RUN apk add --no-cache openssl

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs appuser

# Copy only what's needed from the builder
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/dist         ./dist
COPY --from=builder --chown=appuser:nodejs /app/prisma       ./prisma
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

USER appuser

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "dist/index.js"]
