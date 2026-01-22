FROM oven/bun:1 AS base

FROM base AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl

COPY . .
RUN bun x turbo prune --scope=risk-service --docker

FROM base AS installer
WORKDIR /app
RUN apt-get update && apt-get install -y openssl

COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/bun.lock .
RUN bun install

COPY --from=builder /app/out/full/ .
RUN bun run build --filter=risk-service...

FROM base AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y openssl

COPY --from=installer /app .

EXPOSE 4004
CMD ["bun", "run", "--filter", "risk-service", "start"]
