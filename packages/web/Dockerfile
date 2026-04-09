# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/web/package.json ./packages/web/package.json
RUN pnpm install --frozen-lockfile

COPY packages/web ./packages/web
COPY tsconfig.base.json ./

RUN pnpm --filter @crud-vehicles/web build:prod

# ---- Runtime stage (nginx) ----
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/packages/web/dist/web /usr/share/nginx/html
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
