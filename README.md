# CRUD Vehicles — Monorepo

Aplicação full-stack de gerenciamento de veículos, construída como **monorepo pnpm** com front-end Angular 17, API REST NestJS 10, microsserviço de auditoria com Kafka e orquestração via Docker Compose.

---

## Visão Geral da Arquitetura

```
┌──────────────┐  HTTP   ┌──────────────┐  Kafka   ┌───────────────┐
│  Angular SPA │ ──────► │  NestJS API  │ ───────► │ Audit Service │
│  (porta 4200)│         │  (porta 3000)│          │  (porta 3001) │
└──────────────┘         └──────┬───────┘          └──────┬────────┘
       │                        │                         │
       │ nginx proxy            │ SQLite                  │ SQLite
       │ /api → api:3000        │ vehicles.sqlite         │ audit.sqlite
       ▼                        ▼                         ▼
  [Navegador]            [Sistema de arquivos]     [Sistema de arquivos]
```

Em produção (Docker Compose), o **nginx** serve o build do Angular e faz proxy reverso das requisições `/api/` para o container da API. Kafka (Confluent) + Zookeeper cuidam do streaming de eventos entre a API e o serviço de auditoria.

---

## Tecnologias Utilizadas

| Camada         | Tecnologia                                                 |
| -------------- | ---------------------------------------------------------- |
| Front-end      | Angular 17, RxJS, SCSS, Zone.js                            |
| Back-end       | NestJS 10, TypeORM, better-sqlite3, class-validator        |
| Mensageria     | Apache Kafka (Confluent 7.4) via KafkaJS                   |
| Auditoria      | NestJS 10 microsserviço, Winston logging, TypeORM + SQLite |
| Testes         | Jest 29, Supertest, jest-preset-angular                    |
| Linting        | ESLint 9 (flat config), Prettier, angular-eslint           |
| Commits        | Commitlint (conventional), Commitizen, Husky, lint-staged  |
| Infraestrutura | Docker (multi-stage), nginx 1.27, Docker Compose           |
| Gerenciador    | pnpm 10 workspaces                                         |
| Runtime        | Node.js 20 (Alpine)                                        |
| Linguagem      | TypeScript ~5.4                                            |

---

## Estrutura do Projeto

```
crud-vehicles/
├── docker-compose.yml          # Orquestração full-stack
├── eslint.config.js            # Configuração compartilhada do ESLint
├── tsconfig.base.json          # Configuração TS compartilhada (extends @tsconfig/node20)
├── commitlint.config.cjs       # Regras de commit convencional
├── pnpm-workspace.yaml         # Definição do workspace pnpm
├── package.json                # Scripts raiz e devDependencies
│
└── packages/
    ├── api/                    # API REST NestJS
    │   ├── src/
    │   │   ├── main.ts
    │   │   ├── app.module.ts
    │   │   ├── kafka/
    │   │   │   ├── kafka.module.ts
    │   │   │   └── kafka-producer.service.ts
    │   │   └── vehicles/
    │   │       ├── vehicle.entity.ts
    │   │       ├── vehicles.controller.ts
    │   │       ├── vehicles.service.ts
    │   │       ├── vehicles.module.ts
    │   │       └── dto/
    │   │           ├── create-vehicle.dto.ts
    │   │           ├── update-vehicle.dto.ts
    │   │           └── list-vehicles-query.dto.ts
    │   └── data/               # Banco SQLite (ignorado pelo git)
    │
    ├── audit/                  # Microsserviço de auditoria Kafka
    │   └── src/
    │       ├── main.ts
    │       ├── audit.module.ts
    │       ├── audit.controller.ts
    │       ├── audit.service.ts
    │       ├── audit-log.entity.ts
    │       └── logger.config.ts
    │
    ├── web/                    # SPA Angular 17
    │   ├── angular.json
    │   ├── proxy.conf.json     # Proxy dev → localhost:3000
    │   └── src/
    │       ├── main.ts
    │       ├── styles.scss
    │       └── app/
    │           ├── app.module.ts
    │           ├── app-routing.module.ts
    │           └── vehicles/
    │               ├── vehicle.model.ts
    │               ├── vehicles.module.ts
    │               ├── vehicles-routing.module.ts
    │               ├── vehicles.service.ts
    │               ├── vehicle-list/
    │               └── vehicle-form/
    │
    └── infra/                  # Configurações Docker e nginx
        ├── api.Dockerfile
        ├── audit.Dockerfile
        ├── web.Dockerfile
        └── nginx.conf
```

---

## Pacotes

### `packages/api` — API REST NestJS

CRUD completo de veículos com validação, paginação, filtros e emissão de eventos via Kafka.

- **Banco de dados**: SQLite via TypeORM + better-sqlite3
- **Validação**: `class-validator` + `class-transformer` com `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`)
- **Prefixo global**: `/api`
- **CORS**: Habilitado

#### Entidade Vehicle

| Campo       | Tipo   | Restrições                |
| ----------- | ------ | ------------------------- |
| `id`        | UUID   | PK gerada automaticamente |
| `placa`     | string | Única, 7–10 caracteres    |
| `chassi`    | string | Único, 17 caracteres      |
| `renavam`   | string | Único, 9–11 dígitos       |
| `modelo`    | string | Máx. 100 caracteres       |
| `marca`     | string | Máx. 50 caracteres        |
| `ano`       | int    | 1900 – ano atual + 1      |
| `createdAt` | Date   | Gerado automaticamente    |
| `updatedAt` | Date   | Gerado automaticamente    |

#### Integração Kafka

A cada `CREATE`, `UPDATE` ou `DELETE`, um `VehicleEvent` é publicado no tópico `vehicles.events`:

Uma camada de logging com Winston registra os eventos recebidos no Kafka Consumer.

```json
{
  "action": "CREATED | UPDATED | DELETED",
  "entityId": "<uuid>",
  "before": null | { ... },
  "after": null | { ... },
  "timestamp": "ISO-8601"
}
```

---

### `packages/web` — SPA Angular

Aplicação Angular 17 baseada em módulos com carregamento lazy do módulo de veículos.

- **Roteamento**: `AppRoutingModule` → carrega `VehiclesModule` sob demanda
- **Componentes**: `VehicleListComponent` (tabela com exclusão), `VehicleFormComponent` (criação/edição)
- **Estilização**: SCSS
- **Proxy API** (dev): `/api` → `http://localhost:3000`
- **Testes**: Jest com `jest-preset-angular`

#### Rotas

| Caminho              | Componente           |
| -------------------- | -------------------- |
| `/vehicles`          | VehicleListComponent |
| `/vehicles/new`      | VehicleFormComponent |
| `/vehicles/:id/edit` | VehicleFormComponent |

---

### `packages/audit` — Microsserviço de Auditoria Kafka

Consome eventos do tópico `vehicles.events` via Kafka e persiste logs de auditoria em um banco SQLite separado.

- **Transporte**: Kafka (grupo de consumo: `audit-consumer-group`)
- **Logging**: Winston via `nest-winston`
- **Endpoint HTTP**: `GET /audit/logs` — retorna todos os registros de auditoria (mais recentes primeiro)

### `packages/infra` — Docker e nginx

Dockerfiles multi-stage baseados em `node:20-alpine`:

| Dockerfile         | Build                                 | Runtime             |
| ------------------ | ------------------------------------- | ------------------- |
| `api.Dockerfile`   | `pnpm build` (NestJS)                 | `node dist/main`    |
| `audit.Dockerfile` | `pnpm build` (NestJS)                 | `node dist/main`    |
| `web.Dockerfile`   | `ng build --configuration production` | `nginx:1.27-alpine` |

O **nginx.conf** gerencia o roteamento HTML5 do Angular (`try_files`) e faz proxy reverso de `/api/` para o container da API.

---

## Como Executar

### Pré-requisitos

- **Node.js** ≥ 20
- **pnpm** ≥ 10 (`corepack enable && corepack prepare pnpm@10.33.0 --activate`)
- **Docker** e **Docker Compose** (para execução containerizada)

### Instalar Dependências

```bash
pnpm install
```

### Execução Local (desenvolvimento)

1. **Iniciar o Kafka** (necessário para a API produzir eventos):

   ```bash
   docker compose up -d zookeeper kafka
   ```

2. **Iniciar a API** (porta 3000):

   ```bash
   pnpm start:api
   ```

3. **Iniciar o servidor Angular** (porta 4200, proxy `/api` → `localhost:3000`):

   ```bash
   pnpm start:web
   ```

4. **(Opcional) Iniciar o microsserviço de Auditoria** (porta 3001):

   ```bash
   pnpm --filter @crud-vehicles/audit start:dev
   ```

5. Abra **http://localhost:4200** no navegador.

### Execução com Docker Compose

Compila e inicia todos os serviços (Zookeeper, Kafka, API, Auditoria, Web):

```bash
pnpm docker:up
# ou
docker compose up -d --build
```

| Serviço     | URL / Porta           |
| ----------- | --------------------- |
| Web (nginx) | http://localhost:4200 |
| API         | http://localhost:3000 |
| Kafka       | localhost:9092 (host) |
| Zookeeper   | localhost:2181        |

Parar todos os serviços:

```bash
pnpm docker:down
```

Visualizar logs:

```bash
pnpm docker:logs
```

---

## Endpoints da API

URL base: `http://localhost:3000/api`

| Método   | Caminho         | Descrição                              |
| -------- | --------------- | -------------------------------------- |
| `GET`    | `/vehicles`     | Listar veículos (paginado/com filtros) |
| `GET`    | `/vehicles/:id` | Buscar veículo por ID                  |
| `POST`   | `/vehicles`     | Criar um veículo                       |
| `PUT`    | `/vehicles/:id` | Substituição completa do veículo       |
| `PATCH`  | `/vehicles/:id` | Atualização parcial do veículo         |
| `DELETE` | `/vehicles/:id` | Remover um veículo                     |
| `GET`    | `/audit/logs`   | Listar logs de auditoria               |

### Parâmetros de Query (`GET /vehicles`)

| Parâmetro | Tipo   | Descrição                            |
| --------- | ------ | ------------------------------------ |
| `page`    | number | Número da página (padrão: 1)         |
| `limit`   | number | Itens por página (1–100, padrão: 10) |
| `placa`   | string | Filtrar por placa (busca parcial)    |
| `chassi`  | string | Filtrar por chassi (busca parcial)   |
| `renavam` | string | Filtrar por renavam (busca parcial)  |
| `modelo`  | string | Filtrar por modelo (busca parcial)   |
| `marca`   | string | Filtrar por marca (busca parcial)    |
| `ano`     | number | Filtrar por ano exato                |

## Variáveis de Ambiente

### API (`packages/api`)

| Variável        | Padrão                 | Descrição                   |
| --------------- | ---------------------- | --------------------------- |
| `PORT`          | `3000`                 | Porta HTTP                  |
| `DB_PATH`       | `data/vehicles.sqlite` | Caminho do banco SQLite     |
| `KAFKA_BROKERS` | `localhost:9094`       | Endereços dos brokers Kafka |

### Auditoria (`packages/audit`)

| Variável        | Padrão              | Descrição                   |
| --------------- | ------------------- | --------------------------- |
| `PORT`          | `3001`              | Porta HTTP                  |
| `DB_PATH`       | `data/audit.sqlite` | Caminho do banco SQLite     |
| `KAFKA_BROKERS` | `localhost:9094`    | Endereços dos brokers Kafka |

---

## Testes

```bash
# Executar todos os testes de todos os pacotes
pnpm test

# Executar testes de um pacote específico
pnpm --filter @crud-vehicles/api test
pnpm --filter @crud-vehicles/web test
pnpm --filter @crud-vehicles/audit test

# Modo watch
pnpm --filter @crud-vehicles/api test:watch

# Cobertura
pnpm --filter @crud-vehicles/api test:cov
```

---

## Linting e Formatação

```bash
# Lint em todos os pacotes
pnpm lint

# Correção automática
pnpm lint:fix
```
