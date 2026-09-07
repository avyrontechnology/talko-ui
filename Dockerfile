# Talko UI — production image (standalone Next.js server).
# Build with the LIVE api url baked in (NEXT_PUBLIC_* is compile-time):
#   docker build --build-arg NEXT_PUBLIC_TALKO_API_BASE_URL=https://<api-host>/talko-service/v1 -t talko-ui:prod .
FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_TALKO_API_BASE_URL=http://localhost:8003/talko-service/v1
ARG NEXT_PUBLIC_APP_NAME=Talko Admin
ENV NEXT_PUBLIC_TALKO_API_BASE_URL=$NEXT_PUBLIC_TALKO_API_BASE_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
