FROM node:26-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build
RUN npm prune --omit=dev

FROM node:26-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8082

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER node

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8082/health/live || exit 1

CMD ["node", "dist/src/main.js"]
