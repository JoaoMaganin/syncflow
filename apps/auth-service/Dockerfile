# Estágio 1: Builder - Instala TUDO, compila, e prepara a pasta de deploy
FROM node:20-slim AS builder

WORKDIR /usr/src/app

RUN npm install -g pnpm
COPY . .
RUN pnpm install

# Compila o projeto específico
RUN pnpm turbo run build --filter=auth-service

# Prepara a pasta de deploy APENAS com o necessário para produção
RUN pnpm deploy --filter=auth-service --prod /prod/auth-service


# ---------------------------------------------------------

# Estágio 2: Runner - Imagem final e limpa
FROM node:20-slim

WORKDIR /usr/src/app

# Copia a pasta de deploy autossuficiente do estágio anterior
COPY --from=builder /prod/auth-service .

# Expõe a porta que a aplicação vai usar
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["node", "./dist/main.js"]