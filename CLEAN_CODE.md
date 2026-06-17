# Clean Code Rules — Order API

## Arquitetura em Camadas (Clean Architecture)

```
src/
├── domain/          # Regras de negócio puras — zero dependências externas
│   ├── entities/    # Entidades e tipos fundamentais
│   └── interfaces/  # Contratos (portas)
├── application/
│   └── usecases/    # Casos de uso — orquestram as regras de negócio
├── infrastructure/  # Adaptadores externos (banco, fila, HTTP)
│   ├── database/
│   └── messaging/
└── interface/       # Pontos de entrada (controllers, handlers)
```

### Regras de dependência
- `domain` não importa nada de fora de si mesmo
- `application` importa apenas `domain`
- `infrastructure` implementa interfaces do `domain`
- `interface` coordena `application` e `infrastructure`

---

## Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Classes | PascalCase | `ProcessOrderUseCase` |
| Interfaces | Prefixo `I` + PascalCase | `IOrderRepository` |
| Funções/métodos | camelCase + verbo | `findByExternalId` |
| Arquivos | PascalCase para classes, camelCase para utilitários | `RabbitMQBroker.ts`, `queues.ts` |
| Constantes | SCREAMING_SNAKE_CASE | `QUEUES.ORDERS` |
| Tipos/enums | PascalCase | `OrderStatus` |

---

## Princípios SOLID

### S — Single Responsibility
Cada classe tem **uma única razão para mudar**.

```typescript
// ✅ certo — cada classe faz uma coisa
class ProcessOrderUseCase { ... }      // regras de negócio
class PrismaOrderRepository { ... }   // persistência
class RabbitMQBroker { ... }          // mensageria

// ❌ errado — mistura de responsabilidades
class OrderService {
  saveToDb() { ... }
  publishToQueue() { ... }
  validateAndProcess() { ... }
}
```

### O — Open/Closed
Código aberto para extensão, fechado para modificação via interfaces.

```typescript
// ✅ ProcessOrderUseCase depende de IOrderRepository, não de PrismaOrderRepository
// Trocar Prisma por outro ORM = criar nova implementação, não editar o use case
```

### L — Liskov Substitution
Toda implementação de interface é substituível sem alterar o comportamento.

### I — Interface Segregation
Interfaces pequenas e específicas.

```typescript
// ✅ separado por papel
interface IOrderRepository { save(); updateStatus(); existsByExternalId(); }
interface IDeadLetterPublisher { publish(); }

// ❌ interface gorda
interface IOrderEverything { save(); read(); publish(); consume(); }
```

### D — Dependency Inversion
Use cases recebem dependências via construtor (injeção), nunca instanciam diretamente.

```typescript
// ✅ injeção no construtor
class ProcessOrderUseCase {
  constructor(
    private readonly repository: IOrderRepository,  // interface
    private readonly dlq: IDeadLetterPublisher       // interface
  ) {}
}
```

---

## Use Cases

- Um use case = uma operação de negócio
- Nomeie com verbo no infinitivo: `ProcessOrderUseCase`, `PublishOrderUseCase`
- Método principal sempre `execute(input): Promise<output>`
- Não acessam HTTP, banco ou fila diretamente — usam interfaces

---

## Tratamento de Erros

```typescript
// ✅ erros de negócio como resultado, não exceção
async execute(order: Order): Promise<{ success: boolean; reason?: string }> {
  const errors = validateOrder(order);
  if (errors.length) return { success: false, reason: errors.join("; ") };
  ...
}

// ✅ exceções apenas para situações verdadeiramente excepcionais
if (!this.channel) throw new Error("Channel not initialized");
```

---

## Validação

- Validação de entrada HTTP: Zod schemas em `interface/http/validators/`
- Validação de negócio: funções puras em `domain/entities/`
- Nunca validar a mesma coisa em duas camadas

---

## Comentários

- Código limpo **não precisa de comentários** para explicar **o quê**
- Use comentários apenas para explicar **o porquê** de decisões não óbvias
- Nomes de variáveis, funções e classes são a documentação primária

---

## Idempotência

Toda operação de escrita verifica duplicidade via `externalId` antes de processar:

```typescript
const alreadyExists = await this.repository.existsByExternalId(order.externalId);
if (alreadyExists) return { success: true, reason: "duplicate — skipped" };
```

O cliente pode reenviar o mesmo pedido com segurança.

---

## Mensageria

- A topologia (exchanges, queues, DLQ) é declarada em `infrastructure/messaging/queues.ts`
- Toda fila tem DLQ associada com `x-dead-letter-exchange`
- `prefetch(10)` limita mensagens em voo por consumer
- `nack(msg, false, false)` = não reencaminha para a fila original, vai para DLQ

---

## Frontend

- `domain/` compartilha tipos — single source of truth
- `services/api.ts` encapsula todos os fetch calls
- Componentes são funções puras, sem lógica de negócio
- `useQuery` com `refetchInterval: 5000` para polling automático

---

## Linting

Cada serviço tem `.eslintrc.json` com:
- `@typescript-eslint/no-explicit-any: error` — proibido usar `any`
- `@typescript-eslint/explicit-function-return-type: warn` — tipagem explícita
- `no-console: warn` — apenas `console.info/warn/error` permitidos
