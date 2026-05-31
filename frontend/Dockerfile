FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm install --legacy-peer-deps
ARG CACHEBUST=1
COPY . .
RUN npm run build

FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
