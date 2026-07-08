# Stage 1: Base
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 4: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# yt-dlp standalone 바이너리 (Python 불필요, Innertube 변경을 따라가 안 깨짐)
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && curl -fL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
       -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 30301

ENV PORT=30301
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
