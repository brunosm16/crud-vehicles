# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/audit/package.json ./packages/audit/package.json
RUN pnpm install --frozen-lockfile

COPY packages/audit ./packages/audit
COPY tsconfig.base.json ./

RUN pnpm --filter @crud-vehicles/audit build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/audit/package.json ./packages/audit/package.json
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/audit/dist ./packages/audit/dist

RUN mkdir -p /app/packages/audit/data

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/packages/audit/data/audit.sqlite

EXPOSE 3001

CMD ["node", "packages/audit/dist/main"]
