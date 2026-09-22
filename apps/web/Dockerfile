FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/exercise-engine/package.json ./packages/exercise-engine/

RUN cd apps/web && npm install

COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN cd apps/web && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

WORKDIR /app/apps/web
EXPOSE 3000

CMD ["npm", "start"]
