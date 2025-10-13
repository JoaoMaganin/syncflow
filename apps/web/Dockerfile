FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install

EXPOSE 3000

# Comando padrão (será sobrescrito pelo docker-compose)
CMD ["pnpm", "--filter", "web", "run", "dev"]