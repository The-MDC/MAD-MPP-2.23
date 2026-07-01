# MAD Gambit — Google Cloud Run Dockerfile
# Compatible with: Cloud Run (gen2), AI Studio (Node preview), local Docker
# Agent-DELTA build — production-hardened for card game Gen 2

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build (set in next.config.ts: output: "standalone")
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 8080

# AI Studio + Cloud Run both use PORT env var
CMD ["node", "server.js"]
