# Sistema de Gestão de Tarefas Colaborativo - Desafio Jungle Gaming

Este repositório contém a implementação do desafio prático para a vaga de Full-stack Developer na Jungle Gaming. O projeto consiste em um Sistema de Gestão de Tarefas Colaborativo construído com uma arquitetura de microserviços, utilizando React.js no front-end e NestJS no back-end, tudo orquestrado com Docker.

## 🚀 Status Atual do Projeto
O projeto já possui uma base sólida com a infraestrutura de back-end e a fundação do front-end totalmente funcionais.

### Back-end (`/apps/api-gateway`, `/apps/auth-service`)
- Estrutura do monorepo com `pnpm` e `Turborepo`.
- Ambiente de desenvolvimento containerizado com Docker e Docker Compose.
- Microserviços `api-gateway` e `auth-service`.
- Conexão com banco de dados PostgreSQL via TypeORM.
- Fluxo completo de autenticação com JWT:
  - Registro de usuário (`POST /api/auth/register`) com criptografia de senha.
  - Login de usuário (`POST /api/auth/login`) com geração de `accessToken` e `refreshToken`.
  - Proteção de rotas com `JwtAuthGuard` no API Gateway.
- CRUD completo de usuários.
- Documentação da API com Swagger (`/api/docs`).

### Front-end (`/apps/web`)
- Aplicação criada com Vite, React e TypeScript.
- Sistema de roteamento configurado com **TanStack Router**.
- UI baseada em **Tailwind CSS** e componentes **shadcn/ui**.
- Gerenciamento de estado global para autenticação implementado com **Zustand**.
- Fluxo de autenticação de usuário completo na UI:
  - Componente de **Navbar universal** que exibe o estado do usuário (nome ou botão de login).
  - **Modal de autenticação global** e reutilizável, com formulários para Login e Cadastro.
  - Validação de formulários com **`react-hook-form`** e **`zod`**.
  - Componente **`AuthWall`** que implementa "Acesso Progressivo" (Login Wall), permitindo a visualização do conteúdo mas exigindo login para interação.

## 🏗️ Arquitetura

A arquitetura atual integra o front-end e os serviços de back-end dentro da mesma rede Docker, com o API Gateway servindo como ponto central de comunicação.

```ascii
[ Navegador do Usuário ]
        |
(localhost:3000)
        v
+-------------------------------------------------------------------------+
|                          REDE DOCKER COMPOSE                            |
|                                                                         |
|  +------------------------+  (O App React no navegador faz chamadas API) |
|  |      Web (Vite)        | ----------------------> (localhost:3001)     |
|  | (Serve a UI na Porta 3000) |          |                               |
|  +------------------------+          v                               |
|                                +-----------------------------+         |
|                                |     API Gateway (NestJS)    | ------> |
|                                | (Recebe chamadas API)       |   TCP   |
|                                +-----------------------------+         |
|                                                                        |
|  +-----------------------------+        +-----------------------------+ |
|  |    Auth Service (NestJS)    |<-------|      Tasks Service (TBD)    | |
|  | (Lógica de Usuários/JWT)    |         +-----------------------------+ |
|  +-----------------------------+                                         |
|                |                                                         |
|         (TCP, db:5432)                                                   |
|                v                                                         |
|  +-----------------------------+                                         |
|  |  Banco de Dados (PostgreSQL)|                                         |
|  +-----------------------------+                                         |
|                                                                         |
+-------------------------------------------------------------------------+
```

## ⚙️ Decisões Técnicas e Trade-offs

1.  **Monorepo com `pnpm` e `Turborepo`:** A estrutura de monorepo foi escolhida para centralizar o gerenciamento de todos os serviços e pacotes. O `pnpm` foi adotado no lugar do `npm` após a identificação de problemas de resolução de workspaces no ambiente de desenvolvimento (Windows), garantindo maior robustez e performance na instalação de dependências.

2.  **Desenvolvimento "Docker-First":** Optou-se por configurar e utilizar o ambiente Docker desde o início do desenvolvimento do back-end. Apesar de uma curva de aprendizado inicial maior na depuração de `Dockerfile`s, essa abordagem garante consistência total entre o ambiente de desenvolvimento e o de produção.

3.  **Configuração de Ambiente Flexível:** As configurações sensíveis (credenciais de banco, segredos JWT) são gerenciadas através de arquivos `.env` na raiz e em cada serviço. O `docker-compose.yml` foi parametrizado para ler essas variáveis, permitindo que cada desenvolvedor (ou ambiente de deploy) use suas próprias configurações sem alterar os arquivos versionados. Um exemplo foi a porta do PostgreSQL, que foi configurada para `5433` localmente para evitar conflitos, mas mantém `5432` como padrão.

4. **Gerenciamento de Estado Global com Zustand:** Para o front-end, **Zustand** foi escolhido em vez da Context API nativa do React. A decisão foi baseada na simplicidade da API do Zustand, na performance (evitando re-renderizações desnecessárias) e na facilidade de criar um estado persistente sem a necessidade de envolver a aplicação em Providers.

5.  **Autenticação Centralizada no API Gateway:** A validação dos tokens JWT é realizada no `API Gateway` usando Passport.js. Isso cria uma barreira de segurança na entrada da nossa arquitetura, desacoplando os microserviços internos (como o `auth-service`) da responsabilidade de validar tokens, simplificando sua lógica.

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
- **Tema Claro/Escuro:** A UI está configurada com variáveis de CSS para suportar temas, mas ainda não há um "toggle" para o usuário alternar entre eles.
- **Armazenar o refreshToken pelo onlyHttp**

## 🕒 Tempo Gasto (Preencha com suas horas)

| Etapa | Tempo Gasto |
| :--- | :---: |
| Configuração do Monorepo e Ambiente Docker | 3 horas |
| Desenvolvimento do Auth Service e DB | 14 horas |
| Implementação do JWT e Rotas Protegidas | 2 horas |
| Documentação (Swagger e README) | 1 horas |
| Login no frontend | 6 horas |
| **Total** | **26 horas** |
