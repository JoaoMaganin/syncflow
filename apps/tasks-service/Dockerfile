FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps ./apps

RUN pnpm install

CMD ["pnpm", "--filter", "tasks-service", "run", "dev"]
