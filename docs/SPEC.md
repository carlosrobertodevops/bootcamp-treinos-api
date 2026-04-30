# SPEC — FIT.AI API (Especificação Técnica)

Especificação completa de endpoints, schemas, regras de negócio, erros, modelo de dados e contratos esperados.

## 1. Configuração Base

| Item | Valor |
|---|---|
| Base URL (dev) | `http://localhost:8080` |
| OpenAPI JSON | `GET /swagger.json` |
| API Reference UI | `GET /docs` (Scalar) |
| Auth handler | `GET\|POST /api/auth/*` |
| CORS allowed origin (dev) | `http://localhost:3000` (`credentials: true`) |
| Sessão | Cookie httpOnly emitido pelo Better Auth |

## 2. Modelo de Dados (Prisma)

### 2.1 User

```
User {
  id                  String  PK
  name                String
  email               String  @unique
  emailVerified       Boolean
  image               String?
  weightInGrams       Int?
  heightInCentimeters Int?
  age                 Int?
  bodyFatPercentage   Int?    // 100 = 100%
  createdAt           DateTime
  updatedAt           DateTime
  workoutPlans        WorkoutPlan[]
  sessions            Session[]
  accounts            Account[]
}
```

### 2.2 WorkoutPlan

```
WorkoutPlan {
  id          String  PK (uuid)
  name        String
  userId      String  FK→User (cascade)
  isActive    Boolean default(true)
  createdAt   Timestamptz
  updatedAt   Timestamptz
  workoutDays WorkoutDay[]
}
```

### 2.3 WorkoutDay

```
WorkoutDay {
  id                          String  PK (uuid)
  workoutPlanId               String  FK→WorkoutPlan (cascade)
  name                        String
  weekDay                     WeekDay (enum MONDAY..SUNDAY)
  isRest                      Boolean default(false)
  estimatedDurationInSeconds  Int
  coverImageUrl               String?
  exercises                   Exercise[]
  sessions                    WorkoutSession[]
}
```

### 2.4 Exercise

```
Exercise {
  id                String  PK (uuid)
  workoutDayId      String  FK→WorkoutDay (cascade)
  order             Int
  name              String
  sets              Int
  reps              Int
  restTimeInSeconds Int
}
```

### 2.5 WorkoutSession

```
WorkoutSession {
  id           String  PK (uuid)
  workoutDayId String  FK→WorkoutDay
  userId       String  FK→User
  startedAt    Timestamptz
  completedAt  Timestamptz?
  createdAt    Timestamptz
  updatedAt    Timestamptz
}
```

### 2.6 Better Auth (Session, Account, Verification)

Não detalhar — gerados/gerenciados pelo Better Auth com adaptador Prisma.

## 3. Endpoints

### 3.1 `GET /` — Hello World

- Tag: `Hello World`. Sem auth. 200 → `{ message: "Hello World" }`.

### 3.2 `GET /home/:date` — Home Data

- **Tag:** Home. **Auth:** sim.
- **Params:** `date` (ISO `YYYY-MM-DD`).
- **Responses:**
  - 200 `HomeDataSchema`
  - 401 `UNAUTHORIZED`
  - 404 `NOT_FOUND_ERROR`
  - 500
- **Lógica:** retorna treino do `weekDay` correspondente ao `date` no plano ativo + consistência da semana (squares por dia) + streak corrente + flags `workoutDayCompleted`/`workoutDayStarted`.

### 3.3 `GET /me` — User Train Data

- **Auth:** sim. **Response:** 200 `UserTrainDataSchema | null`. 401, 500.
- Retorna dados antropométricos do usuário (`weightInGrams`, `heightInCentimeters`, `age`, `bodyFatPercentage`) ou `null` se nunca preenchidos.

### 3.4 `PUT /me` — Upsert User Train Data

- **Body:** `UpsertUserTrainDataBodySchema`:
  ```
  {
    weightInGrams?: number,
    heightInCentimeters?: number,
    age?: number,
    bodyFatPercentage?: number
  }
  ```
- **Response:** 200 `UpsertUserTrainDataSchema`. 401, 500.

### 3.5 `GET /stats?from=YYYY-MM-DD&to=YYYY-MM-DD` — Stats

- **Auth:** sim. **Querystring:** `StatsQuerySchema`. **Response:** 200 `StatsSchema`. 401, 404, 500.
- Agrega `WorkoutSession` no intervalo: total iniciados, total concluídos, `conclusionRate`, heatmap por dia.

### 3.6 `GET /workout-plans?active=` — List

- **Auth:** sim. **Query:** `ListWorkoutPlansQuerySchema { active?: boolean }`.
- **Response:** 200 `ListWorkoutPlansSchema` (array de planos com dias e exercícios).

### 3.7 `POST /workout-plans` — Create

- **Auth:** sim (chamado pelo Coach AI via tool, mas aceita qualquer caller autenticado).
- **Body:** `WorkoutPlanSchema.omit({ id: true })`.
- **Response:** 201 `WorkoutPlanSchema`. 400, 401, 404, 500.
- **Atomicidade:** transação Prisma — desativa todos os planos ativos do usuário, cria novo com `isActive: true`.

### 3.8 `GET /workout-plans/:workoutPlanId` — Get Plan

- **Auth:** sim. **Params:** `workoutPlanId: uuid`.
- **Response:** 200 `GetWorkoutPlanSchema`. 401, 404, 500.

### 3.9 `GET /workout-plans/:workoutPlanId/days/:workoutDayId` — Get Day

- **Auth:** sim. **Response:** 200 `GetWorkoutDaySchema`. 401, 404, 500.

### 3.10 `POST /workout-plans/:id/days/:dayId/sessions` — Start Session

- **Auth:** sim. **Response:** 200 `StartWorkoutSessionSchema { userWorkoutSessionId: uuid }`.
- **Erros:**
  - 401 `UNAUTHORIZED`
  - 404 `NOT_FOUND_ERROR` (plano/dia não encontrado)
  - 409 `SESSION_ALREADY_STARTED_ERROR`
  - 422 `WORKOUT_PLAN_NOT_ACTIVE_ERROR`
  - 500
- **Regras:**
  - Plano deve estar `isActive=true`.
  - Não pode existir sessão aberta para o mesmo dia/usuário (em janela de 24h).

### 3.11 `PATCH /workout-plans/:id/days/:dayId/sessions/:sessionId` — Update Session

- **Body:** `UpdateWorkoutSessionBodySchema { completedAt: ISO datetime }`.
- **Response:** 200 `UpdateWorkoutSessionSchema`. 401, 404, 500.
- **Regra:** sessão deve pertencer ao `userId` da sessão de auth.

### 3.12 `POST /ai` — Coach AI (SSE)

- **Auth:** sim. **Body:** mensagens compatíveis com Vercel AI SDK (`useChat`).
- **Response:** stream SSE com chunks de texto + tool calls.
- **Tools disponíveis:**
  - `createWorkoutPlan(payload)` → invoca `CreateWorkoutPlan` use case.
- **System prompt** define personalidade, regras de interação, princípios de montagem (splits, descanso, progressão), seleção de `coverImageUrl`.

### 3.13 `GET\|POST /api/auth/*` — Better Auth catch-all

- Delega ao handler do Better Auth via `Request` Web. Suporta Google OAuth, sessão e logout.

## 4. Schemas Zod (resumo)

### 4.1 `ErrorSchema`

```
{ error: string, code: string }
```

### 4.2 `WorkoutPlanSchema`

```
{
  id: uuid,
  name: string (min 1, trim),
  workoutDays: [{
    name: string (min 1),
    weekDay: WeekDay,
    isRest: boolean (default false),
    estimatedDurationInSeconds: number (min 1),
    coverImageUrl?: url,
    exercises: [{
      order: number (min 0),
      name: string (min 1),
      sets: number (min 1),
      reps: number (min 1),
      restTimeInSeconds: number (min 1),
    }],
  }],
}
```

### 4.3 `GetWorkoutDaySchema`

```
{
  id: uuid,
  name: string,
  isRest: boolean,
  coverImageUrl?: url,
  estimatedDurationInSeconds: number,
  weekDay: WeekDay,
  exercises: [{ id, name, order, workoutDayId, sets, reps, restTimeInSeconds }],
  sessions: [{ id, workoutDayId, userId, startedAt, completedAt? }],
}
```

### 4.4 `HomeDataSchema`

Inclui treino do dia, exercícios, status `workoutDayStarted/Completed`, consistência semanal, streak.

### 4.5 `StatsSchema` / `StatsQuerySchema`

`{ from: ISO date, to: ISO date }` → KPIs + heatmap.

### 4.6 `UserTrainDataSchema` / `UpsertUserTrainDataBodySchema`

Antropometria opcional (4 campos numéricos).

### 4.7 `StartWorkoutSessionSchema` / `UpdateWorkoutSessionBodySchema` / `UpdateWorkoutSessionSchema`

Tipados acima nos endpoints.

## 5. Códigos de Erro

| Code | HTTP | Origem |
|---|---|---|
| `UNAUTHORIZED` | 401 | Sessão ausente em endpoint protegido |
| `NOT_FOUND_ERROR` | 404 | `NotFoundError` |
| `SESSION_ALREADY_STARTED_ERROR` | 409 | `SessionAlreadyStartedError` |
| `WORKOUT_PLAN_NOT_ACTIVE_ERROR` | 422 | `WorkoutPlanNotActiveError` |
| `INTERNAL_SERVER_ERROR` | 500 | catch genérico |

## 6. Regras de Negócio Críticas

| ID | Regra |
|---|---|
| RN-01 | Apenas 1 plano ativo por usuário ao mesmo tempo (transação no create) |
| RN-02 | Iniciar sessão requer plano ativo + dia válido + sem sessão aberta no mesmo dia |
| RN-03 | Atualizar sessão verifica ownership (sessão.userId === auth.userId) |
| RN-04 | Streak conta dias consecutivos com sessão `completedAt != null` até "hoje" ou "ontem" |
| RN-05 | `weekDay` da home derivado do parâmetro `date` (dayjs locale-agnostic) |
| RN-06 | Coach AI deve devolver plano completo (7 dias, com `isRest=true` para dias de descanso) |
| RN-07 | `coverImageUrl` opcional, mas Coach é instruído a sempre fornecer URL pública válida |

## 7. Variáveis de Ambiente

```
PORT=8080
DATABASE_URL=postgresql://user:pass@localhost:5432/treinos
BETTER_AUTH_SECRET=<random>
BETTER_AUTH_URL=http://localhost:8080
OPENAI_API_KEY=<sk-...>
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
```

## 8. Comandos

```
pnpm dev          # tsx --watch src/index.ts
pnpm start        # tsx src/index.ts
pnpm build        # tsc -p tsconfig.json
pnpm lint:fix     # eslint . --fix
pnpm format       # prettier --write .
pnpm check        # eslint . && prettier --check .
pnpm prisma migrate dev
pnpm prisma generate
```

## 9. Insights da Análise de Grafo

> Fonte: `graphify-out/GRAPH_REPORT.md`.

- **56 nodes / 86 edges / 10 comunidades** com **100% das relações EXTRACTED** (zero inferência) — sinaliza acoplamento explícito e baixa ambiguidade entre módulos.
- **God node:** `GetHomeData` (3 edges) é a abstração mais conectada. Funciona como agregador (treino do dia + consistência + streak) e tem o maior blast radius. Priorizar testes e revisar contrato dele em qualquer mudança de schema de Home.
- **Surprising connections:** nenhuma — comunidades coesas dentro dos arquivos. Boa separação Routes ↔ Use Cases ↔ Schemas ↔ Errors.
- **Knowledge Gaps:** poucos pendentes; corpus pequeno e bem extraído. Em uma próxima evolução (mais use cases, jobs assíncronos), rodar `--mode deep` para enriquecer relações inferidas.
- **Erros customizados** (`NotFoundError`, `WorkoutPlanNotActiveError`, `SessionAlreadyStartedError`) aparecem como nodes próprios — confirmação de tratamento padronizado, não disperso por handlers.

## 10. Critérios de Aceitação

### `/home/:date`

- [ ] Retorna 200 < 300ms p75 com plano ativo populado.
- [ ] Retorna 404 se usuário não tem plano ativo.
- [ ] Heatmap reflete últimos 7 dias com flags corretas.

### `/workout-plans` (POST)

- [ ] Body validado por Zod; campos faltando → 400.
- [ ] Plano anterior `isActive=true` é desativado na mesma transação.

### `/workout-plans/:id/days/:dayId/sessions` (POST)

- [ ] 409 se sessão já existir aberta.
- [ ] 422 se plano não está ativo.
- [ ] Cria com `startedAt = now`, `completedAt = null`.

### `/ai` (POST)

- [ ] Stream SSE iniciado em < 1.5s p75.
- [ ] Tool `createWorkoutPlan` persiste com transação.
- [ ] Resposta segue regras de personalidade do system prompt.

### `/api/auth/*`

- [ ] Login Google define cookie httpOnly.
- [ ] CORS permite credentials a partir de `localhost:3000`.
