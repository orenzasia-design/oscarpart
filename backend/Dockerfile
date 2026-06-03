# ============================================================
# OSCARPART Backend — Dockerfile
# Multi-stage build: build → production
# ============================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ============================================================
# Stage 2: Production image
# ============================================================

FROM node:20-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodeuser -u 1001 -G nodejs

# Only production dependencies
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Logs directory with correct permissions
RUN mkdir -p logs && chown nodeuser:nodejs logs

USER nodeuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
