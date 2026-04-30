# SDD — FIT.AI API (Software Design Document)

## 1. Visão Geral da Arquitetura

API Fastify 5 + TypeScript estrito + Prisma 7 + Better Auth, organizada em três camadas:
**Routes (entrada HTTP) → Use Cases (lógica de negócio) → Prisma (persistência)**.
Validação de entrada/saída via Zod 4 com `fastify-type-provider-zod`. OpenAPI gerado por `@fastify/swagger` e exposto via Scalar UI em `/docs`.

```
┌──────────────────────────────────────────────────────────────────┐
│ Fastify App (src/index.ts)                                       │
│  ├── /home          → homeRoutes ── GetHomeData ──┐              │
│  ├── /me            → meRoutes    ── GetUserTrainData / Upsert ──┤
│  ├── /stats         → statsRoutes ── GetStats ────┤              │
│  ├── /workout-plans → workoutPlanRoutes ── (List/Create/Get/    │
│  │                       StartSession/UpdateSession/GetDay) ────┤
│  ├── /ai            → aiRoutes (Vercel AI SDK + tools) ─────────┤
│  └── /api/auth/*    → Better Auth handler (delegate via fetch)   │
│                                                                  │
│ Cross-cutting: zod schemas (src/schemas) · errors · auth/db libs │
└──────────────────────────────────────────────────────────────────┘
                  │
                  ▼ (Prisma client + adapter-pg)
            PostgreSQL 16 (Docker)
```

## 2. Stack

| Camada      | Tecnologia                                                     |
| ----------- | -------------------------------------------------------------- |
| Runtime     | Node `24.x`, pnpm `10.30.0` (engine-strict)                    |
| Framework   | Fastify `5.7.4` + ZodTypeProvider                              |
| ORM         | Prisma `7.4.0` (`@prisma/adapter-pg`)                          |
| DB          | PostgreSQL 16 (Docker local)                                   |
| Auth        | Better Auth `1.4.18` + `@better-auth/infra` (Google OAuth)     |
| Validação   | Zod `4.3.6` (`z.interface()` quando aplicável)                 |
| OpenAPI     | `@fastify/swagger` + `@scalar/fastify-api-reference`           |
| AI          | `ai` `6.0.100` + `@ai-sdk/openai` `3.0.33`                     |
| Datas       | `dayjs`                                                        |
| CORS        | `@fastify/cors`                                                |
| Linguagem   | TypeScript `5.9.3`, target ES2024, moduleResolution `nodenext` |
| Lint/Format | ESLint 9, Prettier 3, `simple-import-sort`                     |

## 3. Estrutura de Pastas

```
src/
  index.ts                    # bootstrap Fastify, plugins, registro de rotas
  lib/
    auth.ts                   # Better Auth (Prisma adapter)
    db.ts                     # Prisma client singleton
  routes/
    home.ts                   # GET /home/:date
    me.ts                     # GET /me, PUT /me
    stats.ts                  # GET /stats
    workout-plan.ts           # /workout-plans (CRUD-lite, sessions)
    ai.ts                     # POST /ai (SSE streaming)
  usecases/
    GetHomeData.ts
    GetStats.ts
    GetWorkoutPlan.ts         # 1 por arquivo, 1 classe
    GetWorkoutDay.ts
    ListWorkoutPlans.ts
    CreateWorkoutPlan.ts      # transação: desativa ativos, cria novo
    StartWorkoutSession.ts    # idempotência por dia/usuário
    UpdateWorkoutSession.ts
    GetUserTrainData.ts
    UpsertUserTrainData.ts
  schemas/
    index.ts                  # Zod schemas compartilhados (request + OpenAPI)
  errors/
    index.ts                  # NotFoundError, WorkoutPlanNotActiveError, SessionAlreadyStartedError
  generated/prisma/           # client + enums (gitignored, gerado)
prisma/
  schema.prisma
  migrations/
docs/
  API_PROMPT.md
```

## 4. Padrões e Decisões

### 4.1 Camadas Routes → Use Cases → Prisma

- **Routes** registram schemas Zod (request/response), extraem sessão (`auth.api.getSession({ headers: fromNodeHeaders(request.headers) })`), instanciam Use Case e tratam erros mapeando para HTTP.
- **Use Cases** são classes com método `execute(dto)`. Recebem `userId` + payload tipado. Usam transações Prisma onde houver mais de uma operação atômica.
- **Schemas** Zod compartilhados entre validação e OpenAPI — uma fonte da verdade.
- **Errors** classes customizadas; routes mapeiam para status:
  - `NotFoundError` → 404 `NOT_FOUND_ERROR`
  - `WorkoutPlanNotActiveError` → 422 `WORKOUT_PLAN_NOT_ACTIVE_ERROR`
  - `SessionAlreadyStartedError` → 409 `SESSION_ALREADY_STARTED_ERROR`
  - Default → 500 `INTERNAL_SERVER_ERROR`

### 4.2 Autenticação

- Better Auth com adaptador Prisma (`src/lib/auth.ts`).
- Rota catch-all `GET|POST /api/auth/*` constrói `Request` Web compatível e delega ao handler do Better Auth.
- Sessão extraída via `auth.api.getSession()`; se `null` → 401 `UNAUTHORIZED`.
- Sem middleware global de auth — cada rota verifica explicitamente (consistência e clareza).

### 4.3 Documentação OpenAPI

- `fastifySwagger` registrado com `jsonSchemaTransform` do `fastify-type-provider-zod`.
- `/swagger.json` (raw) e `/docs` (Scalar UI com 2 sources: API + auth schema gerado pelo Better Auth).
- Frontend consome `/swagger.json` via Orval para gerar tipos.

### 4.4 CORS

- `@fastify/cors` com `origin: ['http://localhost:3000']` e `credentials: true`. Em produção, lista de origins configurável por env.

### 4.5 Banco de Dados

- Prisma 7 com `output = '../src/generated/prisma'` e `provider = 'prisma-client'`.
- Datasource: `postgresql` com `DATABASE_URL`.
- Modelos: `User`, `Session`, `Account`, `Verification` (Better Auth) + `WorkoutPlan`, `WorkoutDay`, `Exercise`, `WorkoutSession`.
- Enum `WeekDay` (MONDAY..SUNDAY).
- Timestamps `@db.Timestamptz()` em entidades de domínio.
- Cascading deletes em relação `User → WorkoutPlan/Session/Account`.

### 4.6 IA (Coach)

- `POST /ai` recebe mensagens, converte para model messages via `convertToModelMessages`, invoca `streamText` do `ai` SDK com modelo OpenAI (`@ai-sdk/openai`).
- System prompt define: personalidade do Coach, regras de interação, princípios de montagem de plano (splits, descanso, progressão), e guia de seleção de `coverImageUrl`.
- Tool `createWorkoutPlan` permite ao LLM persistir plano via `CreateWorkoutPlan` use case (já com transação para desativar ativo anterior).
- Streaming SSE retornado para o frontend via `useChat` (Vercel AI SDK).

### 4.7 Convenções

- TypeScript strict, ES2024, `nodenext` resolution.
- ESLint + `simple-import-sort` (imports ordenados obrigatórios).
- Zod 4 com `z.interface()` quando o ganho de inferência justifica.
- Path imports com extensão `.js` (ESM nodenext).
- Variáveis: `PORT`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## 5. Fluxos Principais

### 5.1 Criar Plano (via Coach AI)

```
POST /ai (SSE) → LLM decide → tool createWorkoutPlan(payload)
  → CreateWorkoutPlan.execute({ userId, name, workoutDays })
    → tx: prisma.workoutPlan.updateMany({ where: { userId, isActive: true }, data: { isActive: false } })
    → tx: prisma.workoutPlan.create({ data: { ..., workoutDays: { create: [...] } } })
  → response 201 com plano completo (validado por WorkoutPlanSchema)
```

### 5.2 Iniciar Sessão

```
POST /workout-plans/:id/days/:dayId/sessions
  → StartWorkoutSession.execute({ userId, workoutPlanId, workoutDayId })
    → valida plano ativo (else WorkoutPlanNotActiveError)
    → valida ausência de sessão aberta no dia (else SessionAlreadyStartedError)
    → cria WorkoutSession (startedAt = now, completedAt = null)
  → 200 { userWorkoutSessionId }
```

### 5.3 Concluir Sessão

```
PATCH /workout-plans/:id/days/:dayId/sessions/:sessionId
  body: { completedAt }
  → UpdateWorkoutSession.execute({ userId, ..., sessionId, completedAt })
    → valida ownership
    → update completedAt
  → 200 (sessão atualizada)
```

### 5.4 Home

```
GET /home/:date
  → GetHomeData.execute({ userId, date })
    → busca plano ativo
    → encontra WorkoutDay com weekDay equivalente a `date`
    → calcula consistência da semana (sessões completas dia a dia)
    → calcula streak corrente
  → 200 HomeDataSchema
```

### 5.5 Stats

```
GET /stats?from=&to=
  → GetStats.execute({ userId, from, to })
    → agrega WorkoutSession completas
    → produz heatmap por dia + KPIs (total, conclusionRate)
  → 200 StatsSchema
```

## 6. Insights da Análise de Grafo (graphify-out)

> Fonte: `bootcamp-treinos-api/graphify-out/GRAPH_REPORT.md` (gerado em 2026-04-30).

- **Tamanho:** 56 nodes, 86 edges, 10 comunidades. **Extração 100% EXTRACTED** (nenhuma relação inferida) — sinal de codebase com acoplamento explícito e direto.
- **Core abstraction (god node):** `GetHomeData` é o use case mais conectado (3 edges). É o ponto de orquestração mais denso, agregando treino do dia + consistência + streak. Mudanças nele têm raio de impacto maior — qualquer evolução de schema de Home deve passar por revisão de contrato.
- **Surprising connections:** nenhuma cross-file inesperada — comunidades são coesas dentro dos arquivos. Indica boa separação por responsabilidade (routes vs usecases vs schemas vs errors).
- **Erros customizados (`NotFoundError`, `WorkoutPlanNotActiveError`, `SessionAlreadyStartedError`)** aparecem como nodes próprios — tratamento de erro está padronizado, não disperso.
- **Recomendação derivada:** cobrir `GetHomeData` com testes de integração (alta centralidade ⇒ alto blast radius).

## 7. Performance e Cache

- Sem cache em runtime hoje. Otimizações imediatas possíveis:
  - `select` Prisma para reduzir payload em `GetHomeData` e `ListWorkoutPlans`.
  - Índices: já há `@unique([email])`, `@@index([userId])` em Session. Adicionar índice em `WorkoutSession(userId, startedAt)` para `GetStats` se volume crescer.
- Logger pino do Fastify com request id; `app.log.error(error)` em todos os catch.

## 8. Segurança

- Cookies httpOnly via Better Auth.
- Em produção: SameSite=None + Secure + domain configurado.
- Sem PII em logs (Better Auth não loga password — Google OAuth).
- CORS restrito a origins explícitos.
- Variáveis sensíveis: `BETTER_AUTH_SECRET`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_SECRET` apenas em `.env` (gitignored).

## 9. Observabilidade

- Logger Fastify (pino) habilitado.
- Erros 5xx capturados e logados com contexto.
- Métricas/tracing fora do escopo atual (futuro: OpenTelemetry).

## 10. Build e Deploy

- Dev: `pnpm dev` (`tsx --watch src/index.ts`).
- Build: `pnpm build` → `tsc -p tsconfig.json` produz `dist/`.
- Start prod: `pnpm start` (`tsx src/index.ts`) ou `node dist/index.js`.
- Migrations: `pnpm prisma migrate dev` (local) / `pnpm prisma migrate deploy` (prod).
- Generate client: `pnpm prisma generate` (após mudanças em schema).

## 11. Testes (futuro)

- Não há testes neste release. Plano:
  - Vitest para unit em use cases (com Prisma mockado ou test DB).
  - Supertest/Fastify inject para integração de rotas.
  - Cobertura mínima alvo: `GetHomeData`, `CreateWorkoutPlan`, `StartWorkoutSession`, `UpdateWorkoutSession` (use cases mais críticos).

## 12. Anti-padrões

- ❌ Lógica de negócio em handlers de rota (deve ir para use case).
- ❌ Ausência de validação Zod em request/response (quebra OpenAPI e Orval).
- ❌ Múltiplas operações sem transação em use cases compostos.
- ❌ Comentários redundantes — TS estrito + nomes descritivos bastam.
- ❌ Logar dados sensíveis (tokens, payload de auth).
- ❌ Imports não ordenados (eslint quebra build).
