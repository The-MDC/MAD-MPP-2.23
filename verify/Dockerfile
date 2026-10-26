# MAD Gambit — container image for the Next.js standalone server.
# Compatible with: Cloud Run (gen2), AI Studio (Node preview), local Docker.
# Node 24 to match the Vercel/CI runtime (output: "standalone" in next.config.ts).

FROM node:24-alpine AS base
WORKDIR /app

# Production-only dependencies (kept out of the final image's build layer).
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Build (needs dev deps).
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runner.
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone build (self-contained Node server + traced deps).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 8080

# Liveness probe — hits the unguarded /api/health route (Basic-Auth middleware
# excludes /api, so this is reachable without the guest login).
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# AI Studio + Cloud Run both use the PORT env var.
CMD ["node", "server.js"]
