# MAD Gambit — Deploy Guide

## Google Cloud Run (Production)

```bash
# 1. Build + deploy in one command (uses Dockerfile)
gcloud run deploy mad-gambit \
  --source . \
  --allow-unauthenticated \
  --port 8080 \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1

# 2. Set secrets separately (never in source)
gcloud run services update mad-gambit \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest \
  --set-secrets ALCHEMY_API_KEY=alchemy-api-key:latest \
  --region us-central1
```

## AI Studio (Local Preview)

```bash
npm ci && npm run build
# Produces .next/standalone/server.js — runnable directly in AI Studio Node environment
node .next/standalone/server.js
# Visit: http://localhost:8080/gambit
```

## Docker (Local)

```bash
docker build -t mad-gambit .
docker run -p 8080:8080 --env-file .env.local mad-gambit
```

## AI Studio Card Art Integration

Drop AI Studio-generated card images at:
```
/public/cards/{canonicalFactionId}/{serial}.webp
```

Example paths:
- `/public/cards/mad-council/0004.webp` — THE DON (Politicos, serial 4)
- `/public/cards/disruptors/0088.webp` — THE VISIONARY (Disruptors, serial 88)
- `/public/cards/drama-guild/0488.webp` — THE INFLUENCER (Pop Icons, serial 488)

Canonical faction IDs: `disruptors | elites | chaos | drama-guild | degens | royalists | masses | mad-council`

In `components/nft-card.tsx`, replace the ART PLACEHOLDER `<g>` block with:
```tsx
<image
  href={`/cards/${card.canonicalFactionId}/${String(card.serial).padStart(4,"0")}.webp`}
  x="22" y="64" width="276" height="220"
  preserveAspectRatio="xMidYMid slice"
  clipPath={`url(#art-clip-${uid})`}
/>
```
Add the clip path to `<defs>`:
```svg
<clipPath id={`art-clip-${uid}`}>
  <rect x="22" y="64" width="276" height="220" rx="14" />
</clipPath>
```

## Routes

| Route | Type | Purpose |
|---|---|---|
| `/` | static | Conviction simulator |
| `/gambit` | static | Full card game platform |
| `/api/v1/cards` | dynamic | Deck metadata + rarity table |
| `/api/v1/cards/open-pack` | dynamic | Pack opening (5 cards, slot-0 guarantee) |
| `/api/v1/feeds` | ISR 5m | Live RSS ticker |
| `/api/v1/mpp/simulate` | dynamic | Stochastic matrix |
| `/api/v1/mpp/profiles` | dynamic | Gambit profiles |
| `/api/v1/madhatr/zliar` | dynamic | Z-Liar / Sentinel audit |
| `/api/v1/tournament/match` | dynamic | Cull Arena PvP (Gen 2 scoring) |
