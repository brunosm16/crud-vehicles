# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/package.json
RUN pnpm install --frozen-lockfile

COPY packages/api ./packages/api
COPY tsconfig.base.json ./

RUN pnpm --filter @crud-vehicles/api build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/package.json
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/api/dist ./packages/api/dist

RUN mkdir -p /app/packages/api/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/packages/api/data/vehicles.sqlite

EXPOSE 3000

CMD ["node", "packages/api/dist/main"]
