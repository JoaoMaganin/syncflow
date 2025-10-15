FROM node:20-slim

WORKDIR /app

# Instala pnpm
RUN npm install -g pnpm

# Copia os arquivos de manifesto para otimizar o cache da instalação
COPY package.json pnpm-lock.yaml turbo.json ./
COPY apps/ /app/apps/
COPY packages/ /app/packages/

# Instala TODAS as dependências
RUN pnpm install

# Copia o resto do código fonte
COPY . .

# O comando para iniciar o servidor de desenvolvimento
CMD ["pnpm", "--filter", "tasks-service", "run", "dev"]