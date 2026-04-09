# CRUD Vehicles — Monorepo

Aplicação full-stack de gerenciamento de veículos, construída como **monorepo pnpm** com front-end em Angular 17 e API REST com NestJS, microsserviço de auditoria com Kafka e orquestração da aplicação via Docker Compose.

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

---

## Demonstração em Vídeo

#### Operações CRUD

https://github.com/user-attachments/assets/132e8201-211c-4b29-91f3-ff5c9f0ee839

#### Audição de Operações

https://github.com/user-attachments/assets/f45efffd-90dc-4ddb-800e-132ae31dae07

## Tecnologias Utilizadas

| Camada         | Tecnologia                                             |
| -------------- | ------------------------------------------------------ |
| Front-end      | Angular 17, RxJS, SCSS                                 |
| Back-end       | NestJS, TypeORM, better-sqlite3                        |
| Mensageria     | Apache Kafka via KafkaJS                               |
| Auditoria      | NestJS(Microserviço), Winston, TypeORM, better-sqlite3 |
| Testes         | Jest, Supertest                                        |
| Linting        | ESLint 9, Prettier                                     |
| Commits        | Commitlint, Commitizen, Husky, lint-staged             |
| Infraestrutura | Docker, Docker Compose, NGINX                          |
| Linguagem      | TypeScript                                             |

---

## Estrutura do Projeto

```
crud-vehicles/
├── docker-compose.yml          # Orquestração completa da aplicação
├── eslint.config.js            # Configuração compartilhada do ESLint
├── tsconfig.base.json          # Configuração do TypeScript compartilhada
├── commitlint.config.cjs       # Regras de commit convencional
├── pnpm-workspace.yaml         # Definição do workspace com pnpm
├── package.json                # Scripts da aplicação
│
└── packages/
    ├── api/                    # API REST em NestJS
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
    │   └── data/               # Arquivo de dados do SQLite
    │
    ├── audit/                  # Microsserviço de auditoria em Kafka com NestJS
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
    └── infra/                  # Configurações de Docker e NGINX
        ├── api.Dockerfile
        ├── audit.Dockerfile
        ├── web.Dockerfile
        └── nginx.conf
```

---

## Pacotes

### `packages/api` — API REST NestJS

CRUD completo de veículos com validação, paginação, filtros e emissão de eventos via Kafka.

- **Prefixo global**: `/api`

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

A cada ação `CREATE`, `UPDATE` ou `DELETE`, um evento chamado `VehicleEvent` é publicado no tópico `vehicles.events`:

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

Aplicação Angular 17 para listagem de veículos, consumindo dados da API REST.

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
- **pnpm** ≥ 10
- **Docker** e **Docker Compose**

### Instalar Dependências

```bash
pnpm install
```

### Execução via Containers (desenvolvimento)

1. **Subir containers da aplicação**:

   ```bash
   pnpm docker:up ou docker compose up -d --build
   ```

2. Abra **http://localhost:4200** no navegador.

### Execução local

1. **Iniciar API e Front-end** (porta 4200, proxy `/api` → `localhost:3000`):
   - Em
   ```bash
   pnpm start:all
   ```
2. Abra **http://localhost:4200** no navegador.

3. **Iniciar o microsserviço de Auditoria** (porta 3001):

   ```bash
   pnpm start:audit
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
pnpm lint
pnpm lint:fix
```
