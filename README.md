# Sistema de Gestão de Tarefas Colaborativo - Desafio Jungle Gaming

Este repositório contém a implementação do desafio prático para a vaga de Full-stack Developer na Jungle Gaming. O projeto consiste em um Sistema de Gestão de Tarefas Colaborativo construído com uma arquitetura de microserviços, utilizando React.js no front-end e NestJS no back-end, tudo orquestrado com Docker.

## 🚀 Status Atual do Projeto
O projeto está em um estágio avançado, com a infraestrutura completa de microserviços de back-end (autenticação, tarefas e notificações) e um front-end robusto e totalmente funcional.

### Back-end (`/apps/api-gateway`, `/apps/auth-service`)
- Estrutura do monorepo com `pnpm` e `Turborepo`.
- Ambiente de desenvolvimento 100% containerizado com Docker e Docker Compose, incluindo serviços para `NestJS`, `PostgreSQL` e `RabbitMQ`.
- **`api-gateway`:**
  - Ponto de entrada único para todos os serviços.
  - Proteção de rotas com `JwtAuthGuard` (Passport.js).
  - Validação de DTOs com `class-validator` para todas as requisições.
  - Documentação completa da API com Swagger (`/api/docs`).
- **`auth-service`:**
  - Fluxo completo de autenticação com JWT: Registro, Login (`accessToken` + `refreshToken`) e Refresh.
  - CRUD completo de usuários.
- **`tasks-service`:**
  - **CRUD de Tarefas:** `POST`, `GET`, `PUT`, `DELETE` para tarefas.
  - **CRUD de Comentários:** `POST` e `GET` para comentários aninhados em tarefas.
  - **Atribuição Múltipla:** Lógica `ManyToMany` para atribuir múltiplos usuários a tarefas (via `assigneeIds`).
  - **Paginação e Busca:** Endpoint de listagem (`GET /api/tasks`) implementado com paginação (`page`, `size`) e busca textual (`search`).
  - **Produtor de Eventos:** Publica eventos no `RabbitMQ` nos eventos `task_created`, `task_updated` e `comment_created`.
- **`notifications-service`:**
  - **Consumidor de Eventos:** Ouve a fila `tasks_queue` do `RabbitMQ` para receber eventos de tarefas e comentários.
  - **Servidor WebSocket:** Atua como uma aplicação híbrida (NestJS), servindo um `WebSocketGateway` (Socket.IO).
  - **Transmissão em Tempo Real:** Envia eventos (`new_task`, `new_comment`, etc.)

### Front-end (`/apps/web`)
- Aplicação criada com Vite, React e TypeScript.
- **Roteamento:** Configurado com **TanStack Router**, incluindo rotas dinâmicas (`/tasks/:id`) e gerenciamento de parâmetros de busca na URL.
- **Gerenciamento de Estado:**
  - **TanStack Query:** Para todo o estado do servidor (tarefas, comentários), com invalidação automática de cache via eventos WebSocket.
  - **Zustand:** Para o estado global da UI (autenticação do usuário, estado dos modais).
- **UI:** Construída com **Tailwind CSS** e componentes **shadcn/ui**.
- **Funcionalidades Implementadas:**
  - Fluxo de autenticação completo com modal global de Login/Registro.
  - **`AuthWall`** para acesso progressivo (login necessário para interagir).
  - **CRUD de Tarefas:** Listagem, criação, edição e exclusão de tarefas.
  - **Busca e Paginação:** A UI da lista de tarefas é 100% controlada pela URL (busca por `?search=` e paginação com `?page=` e `?size=`).
  - **Página de Detalhes da Tarefa:** Exibe detalhes da tarefa, lista de atribuídos e comentários (com paginação).
  - **Notificações em Tempo Real:** Conecta-se ao `notifications-service` via **WebSocket**. Recebe eventos (ex: `new_comment`) e exibe **toasts de notificação** (`sonner`), além de **atualizar automaticamente** a lista de tarefas/comentários (`invalidateQueries`).

## 🏗️ Arquitetura

A arquitetura utiliza uma abordagem de microserviços orientada a eventos. Os serviços síncronos (Auth, Tasks) são desacoplados dos serviços assíncronos (Notifications) através de um message broker (RabbitMQ).

```ascii
[ Navegador do Usuário (React @ :3000) ]
    |       ^
(HTTP API)  | (WebSocket @ :3004)
    v       |
+---+-----------------------------------------------------------------------+
|                             REDE DOCKER COMPOSE                           |
|                                                                           |
|  +------------------------+      +-----------------------------+          |
|  |      Web (Vite)        |----->|     API Gateway (NestJS)    |          |
|  | (Renderiza UI @ :3000)  |      |     (Porta 3001)            |         |
|  +------------------------+      +-------------+---------------+          |
|                                                | (TCP)                    |
|     +-----------------------------+ <----------+                          |
|     |    Auth Service (NestJS)    |                                       |
|     +-------------+---------------+                                       |
|                   | (TCP)                                                 |
|                   v                                                       |
|  +-----------------------------+ <-------------------------------------+  |
|  |  Banco de Dados (PostgreSQL)|   (TCP)                               |  |
|  +-----------------------------+   +-----------------------------+   | |
|                 ^                  |    Tasks Service (NestJS)   |   | |
|                 | (TCP)            +-------------+---------------+   | |
|                 |                                | (Evento AMQP)       |  |
|                 |                                v                     |  |
|   +-----------------------------+    +-----------------------------+   |  |
|   | Notifications Service (NestJS)|<---|    RabbitMQ (Broker)      |   |  |
|   | (WS @ 3004 / Consumidor)    |    |    (Painel @ :15672)      |   | |
|   +-----------------------------+    +-----------------------------+   |  |
|                                                                           |
+-----------------------------------------------------------------------------+
```

## ⚙️ Decisões Técnicas e Trade-offs

1.  **Monorepo com `pnpm`:** A estrutura de monorepo foi escolhida para centralizar o gerenciamento de todos os serviços. O `pnpm` foi adotado para lidar com os `workspaces` de forma eficiente, resolvendo problemas de `PATH` e `node_modules` no ambiente Docker.
2.  **Pacotes Compartilhados:** Foi criado um pacote `packages/types` para compartilhar definições de tipos (como `Task`, `Enums`, etc.) entre o back-end e o front-end, garantindo consistência.
3.  **Desenvolvimento "Docker-First":** A aplicação é 100% containerizada. Os `Dockerfile`s são padronizados para o modo de desenvolvimento, utilizando `volumes` para live-reload e `CMD` para executar os scripts de `dev` filtrados pelo `pnpm`.
4.  **Arquitetura Orientada a Eventos (RabbitMQ):** Para as notificações, foi implementada uma arquitetura assíncrona. O `tasks-service` **publica** eventos sem esperar por uma resposta (`emit`), e o `notifications-service` **consome** esses eventos. Isso desacopla totalmente os serviços; o `tasks-service` nem sabe que as notificações existem, tornando o sistema altamente escalável e resiliente.
5.  **Gerenciamento de Estado no Front-end:**
    * **Zustand:** Para o estado global da UI (ex: usuário logado, estado dos modais).
    * **TanStack Query:** Para todo o estado do servidor (tarefas, comentários). Sua integração com `invalidateQueries` foi crucial para criar a experiência de tempo real, atualizando a UI automaticamente ao receber um evento WebSocket.
    * **TanStack Router:** O estado da UI (busca, paginação) é armazenado na URL (`useSearch`), tornando a aplicação "linkável".

## 🚀 Como Rodar o Projeto

**Pré-requisitos:**
- [Docker](https://www.docker.com/products/docker-desktop/) e Docker Compose
- [Node.js](https://nodejs.org/)
- `pnpm` (instale com `npm install -g pnpm`)
- [Postgresql](https://www.postgresql.org/download/)

**1. Clonar o Repositório**
```bash
git clone [https://github.com/JoaoMaganin/syncflow.git](https://github.com/JoaoMaganin/syncflow.git)
cd syncflow
```

**2. Configuração do Ambiente**

Crie os arquivos `.env` necessários a partir dos exemplos existentes no projeto. O mais importante é o `.env` da raiz, que deve ser criado a partir do `env.example` e preenchido com os valores de `POSTGRES_PASSWORD` e `JWT_SECRET`.

**3. Instalar Dependências (Primeira Vez)**

Antes do primeiro build do Docker, gere o `pnpm-lock.yaml` na sua máquina local:
```bash
pnpm install
```

**4. Iniciar os Contêineres**

Na raiz do projeto, execute:
```bash
docker-compose up --build
```
Os serviços estarão disponíveis nos seguintes endereços:
- **Front-end (Aplicação):** `http://localhost:3000`
- **API Gateway:** `http://localhost:3001`
- **Documentação Swagger:** `http://localhost:3001/api/docs`
- **Painel do RabbitMQ:** `http://localhost:15672` (Login: `admin` / `admin`)
- **Banco de Dados (via pgAdmin):** `localhost:5433` (ou a porta que você configurou no `.env` da raiz)

## 🔮 Problemas Conhecidos e Melhorias Futuras

- **Tratamento de Erros:** Atualmente, um erro de banco de dados (como tentar cadastrar um email duplicado) retorna um `500 Internal Server Error`. Uma melhoria seria implementar *Exception Filters* no NestJS para capturar esses erros específicos e retornar respostas mais amigáveis (ex: `409 Conflict`).
- **Autorização:** O CRUD de usuários está protegido por autenticação (só usuários logados acessam), mas não por autorização. Qualquer usuário logado pode alterar ou deletar outro usuário se souber o ID. O próximo passo seria adicionar essa camada de verificação (ex: um usuário só pode alterar a si mesmo, ou apenas um 'admin' pode alterar outros).
- **Tema Claro/Escuro:** A UI está configurada com variáveis de CSS para suportar temas, mas ainda não há um "toggle" para o usuário alternar entre eles.
- **Armazenar o refreshToken pelo onlyHttp**
- **Lógica de Notificações:** Atualmente, o `notifications-service` envia o evento WebSocket para **todos** os clientes conectados (`sendToAll`). A próxima etapa de refinamento seria implementar a lógica de direcionamento, enviando a notificação apenas para os usuários relevantes (o `ownerId` e os `assignees` da tarefa).
- **Histórico de Alterações:** A funcionalidade de "audit log" ainda não foi implementada.
- **Autorização de Atribuição:** Atualmente, qualquer usuário logado pode criar uma tarefa e atribuí-la a qualquer outro usuário (se souber o ID). Uma melhoria seria limitar a atribuição, permitindo que apenas o dono da tarefa possa adicionar/remover `assignees`.

## 🕒 Tempo Gasto (Preencha com suas horas)

| Etapa | Tempo Gasto |
| :--- | :---: |
| Configuração do Monorepo e Ambiente Docker | 5 horas |
| Desenvolvimento do Auth Service e DB | 14 horas |
| Implementação do JWT e Rotas Protegidas | 2 horas |
| Documentação (Swagger e README) | 1 horas |
| Login no frontend | 6 horas |
| Desenvolvimento do tasks-service | 16 horas |
| Desenvolvimento da tasks + home | 11 horas |
| Desenvolvimento do notifications-service | 10 horas |
| **Total** | **65 horas** |
