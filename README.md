# Sistema de Gestão de Tarefas Colaborativo - Desafio Jungle Gaming

Este repositório contém a implementação do desafio prático para a vaga de Full-stack Developer na Jungle Gaming. O projeto consiste em um Sistema de Gestão de Tarefas Colaborativo construído com uma arquitetura de microserviços, utilizando React.js no front-end e NestJS no back-end, tudo orquestrado com Docker.

## 🚀 Status Atual do Projeto

Atualmente, a base da infraestrutura e o serviço de autenticação estão completos e funcionais. O que já foi implementado:
- Estrutura do monorepo com `pnpm` e `Turborepo`.
- Ambiente de desenvolvimento containerizado com Docker e Docker Compose.
- Microserviços `api-gateway` e `auth-service`.
- Conexão com banco de dados PostgreSQL via TypeORM.
- Fluxo completo de autenticação com JWT:
  - Registro de usuário (`POST /api/auth/register`) com criptografia de senha.
  - Login de usuário (`POST /api/auth/login`) com geração de `accessToken`.
  - Proteção de rotas com `JwtAuthGuard` no API Gateway.
- CRUD completo de usuários (`PATCH` e `DELETE`).
- Documentação da API com Swagger (`/api/docs`).

## 🏗️ Arquitetura

A arquitetura atual é focada no serviço de autenticação, seguindo um padrão de microserviços com um API Gateway como ponto único de entrada.

```ascii
[ Cliente Externo (Navegador / Postman) ]
                |
                | HTTPS (Ex: localhost:3001)
                v
+-------------------------------------------------------------------------+
|                          REDE DOCKER COMPOSE                            |
|                                                                         |
|  +-----------------------------+        +-----------------------------+ |
|  |     API Gateway (NestJS)    |------->|    Auth Service (NestJS)    | |
|  | (Porta 3001)                |  TCP   | (Porta 3002)                | |
|  | - Validação de JWT          |        | - Lógica de CRUD de User    | |
|  | - Roteamento de Requisições |        | - Geração de JWT            | |
|  | - Swagger UI                |        +-----------------------------+ |
|  +-----------------------------+                      |                 |
|                                                       | TCP (db:5432)   |
|                                                       v                 |
|                                          +-----------------------------+ |
|                                          |  Banco de Dados (PostgreSQL)| |
|                                          |  (Porta 5432 / 5433 local)  | |
|                                          +-----------------------------+ |
|                                                                         |
+-------------------------------------------------------------------------+
```

## ⚙️ Decisões Técnicas e Trade-offs

1.  **Monorepo com `pnpm` e `Turborepo`:** A estrutura de monorepo foi escolhida para centralizar o gerenciamento de todos os serviços e pacotes. O `pnpm` foi adotado no lugar do `npm` após a identificação de problemas de resolução de workspaces no ambiente de desenvolvimento (Windows), garantindo maior robustez e performance na instalação de dependências.

2.  **Desenvolvimento "Docker-First":** Optou-se por configurar e utilizar o ambiente Docker desde o início do desenvolvimento do back-end. Apesar de uma curva de aprendizado inicial maior na depuração de `Dockerfile`s, essa abordagem garante consistência total entre o ambiente de desenvolvimento e o de produção.

3.  **Configuração de Ambiente Flexível:** As configurações sensíveis (credenciais de banco, segredos JWT) são gerenciadas através de arquivos `.env` na raiz e em cada serviço. O `docker-compose.yml` foi parametrizado para ler essas variáveis, permitindo que cada desenvolvedor (ou ambiente de deploy) use suas próprias configurações sem alterar os arquivos versionados. Um exemplo foi a porta do PostgreSQL, que foi configurada para `5433` localmente para evitar conflitos, mas mantém `5432` como padrão.

4.  **Autenticação Centralizada no API Gateway:** A validação dos tokens JWT é realizada no `API Gateway` usando Passport.js. Isso cria uma barreira de segurança na entrada da nossa arquitetura, desacoplando os microserviços internos (como o `auth-service`) da responsabilidade de validar tokens, simplificando sua lógica.

## 🚀 Como Rodar o Projeto

**Pré-requisitos:**
- [Docker](https://www.docker.com/products/docker-desktop/) e Docker Compose
- [Node.js](https://nodejs.org/) (para ter acesso ao `pnpm`)
- `pnpm` (instale com `npm install -g pnpm`)
- [Postgresql](https://www.postgresql.org/download/)

**1. Clonar o Repositório**
```bash
git clone https://github.com/JoaoMaganin/syncflow.git
cd syncflow
```

**2. Configuração do Ambiente**

Crie os arquivos `.env` necessários a partir dos exemplos existentes no projeto. O mais importante é o `.env` da raiz, que deve ser criado a partir do `env.example` e preenchido com os valores de `POSTGRES_PASSWORD` e `JWT_SECRET`.

**3. Iniciar os Contêineres**

Na raiz do projeto, execute:
```bash
docker-compose up --build
```
Os serviços estarão disponíveis nos seguintes endereços:
- **API Gateway:** `http://localhost:3001`
- **Documentação Swagger:** `http://localhost:3001/api/docs`
- **Banco de Dados (via pgAdmin):** `localhost:5433` (ou a porta que você configurou no `.env` da raiz)

## 🔮 Problemas Conhecidos e Melhorias Futuras

- **Tratamento de Erros:** Atualmente, um erro de banco de dados (como tentar cadastrar um email duplicado) retorna um `500 Internal Server Error`. Uma melhoria seria implementar *Exception Filters* no NestJS para capturar esses erros específicos e retornar respostas mais amigáveis (ex: `409 Conflict`).
- **Autorização:** O CRUD de usuários está protegido por autenticação (só usuários logados acessam), mas não por autorização. Qualquer usuário logado pode alterar ou deletar outro usuário se souber o ID. O próximo passo seria adicionar essa camada de verificação (ex: um usuário só pode alterar a si mesmo, ou apenas um 'admin' pode alterar outros).

## 🕒 Tempo Gasto (Preencha com suas horas)

| Etapa | Tempo Gasto |
| :--- | :---: |
| Configuração do Monorepo e Ambiente Docker | 3 horas |
| Desenvolvimento do Auth Service e DB | 9 horas |
| Implementação do JWT e Rotas Protegidas | 2 horas |
| Documentação (Swagger e README) | 1 horas |
| **Total** | **15 horas** |
