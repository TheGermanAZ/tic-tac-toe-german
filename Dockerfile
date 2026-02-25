# Stage 1: Install dependencies and build the frontend
FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Stage 2: Production image with only what's needed
FROM oven/bun:1-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/dist ./dist
COPY --from=build /app/src/server ./src/server

EXPOSE 3000

CMD ["bun", "run", "./src/server/index.ts"]
