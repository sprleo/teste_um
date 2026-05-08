# Order API — RabbitMQ + Clean Architecture

Sistema de recebimento e processamento de pedidos com:
- **API Gateway** — webhook HTTP → publica na fila
- **Order Consumer** — consome fila, processa com idempotência, grava no banco ou DLQ
- **Frontend** — dashboard React para visualizar pedidos em tempo real

## Stack

| Camada | Tecnologia |
|--------|-----------|
| API Gateway | Node.js + TypeScript + Express |
| Mensageria | RabbitMQ 3.13 |
| Consumer | Node.js + TypeScript |
| Banco de Dados | PostgreSQL 16 + Prisma ORM |
| Frontend | React 18 + TypeScript + Vite |
| Infra | Docker Compose |

## Subir o ambiente

```bash
# Clonar e subir tudo
docker compose up --build

# Serviços disponíveis:
# API Gateway  → http://localhost:3000
# Frontend     → http://localhost:5173
# RabbitMQ UI  → http://localhost:15672  (guest/guest)
```

## Endpoints da API

### Webhook — Enviar pedido
```http
POST /api/webhook/orders
Content-Type: application/json

{
  "customerId": "customer-123",
  "customerName": "João Silva",
  "items": [
    {
      "productId": "prod-001",
      "productName": "Notebook",
      "quantity": 1,
      "unitPrice": 4999.90
    }
  ]
}
```

Resposta `202 Accepted`:
```json
{
  "externalId": "uuid-gerado",
  "message": "Order queued for processing"
}
```

### Listar pedidos
```http
GET /api/orders?status=completed&page=1&limit=20
```

### Buscar pedido por ID
```http
GET /api/orders/{externalId}
```

## Fluxo completo

```
Cliente
  │
  ▼ POST /api/webhook/orders
API Gateway (Express)
  │  valida schema (Zod)
  │  gera externalId se não fornecido
  │
  ▼ publish → orders.exchange
RabbitMQ (orders.queue)
  │
  ▼ consume
Order Consumer
  ├── verifica idempotência (externalId já existe?)
  ├── valida regras de negócio
  │     ├── totalAmount ≤ 100.000
  │     └── itens ≤ 50
  ├── salva no PostgreSQL (status: processing)
  ├── atualiza status → completed
  └── em caso de erro → nack → orders.dlq (Dead Letter Queue)
```

## Idempotência

Cada pedido tem um `externalId` (UUID). Se o mesmo pedido for enviado múltiplas vezes, o consumer detecta a duplicidade e ignora silenciosamente sem erro.

## Desenvolvimento local (sem Docker)

```bash
# Pré-requisitos: Node 20+, PostgreSQL e RabbitMQ rodando localmente

# API Gateway
cd api-gateway
cp ../.env.example .env
npm install
npm run dev

# Consumer (outro terminal)
cd order-consumer
cp ../.env.example .env
npm install
npm run dev

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

## Estrutura do projeto

```
.
├── docker-compose.yml
├── .env.example
├── CLEAN_CODE.md          ← Regras de código limpo
├── api-gateway/
│   └── src/
│       ├── domain/        ← Entidades e interfaces
│       ├── application/   ← Use cases
│       ├── infrastructure/← Banco e fila
│       └── interface/     ← Controllers e rotas HTTP
├── order-consumer/
│   └── src/
│       ├── domain/
│       ├── application/   ← ProcessOrderUseCase
│       ├── infrastructure/
│       └── interface/     ← Message handlers
└── frontend/
    └── src/
        ├── domain/        ← Tipos compartilhados
        ├── services/      ← Chamadas à API
        ├── components/    ← UI components
        └── pages/         ← Dashboard
```
