# PRD — FIT.AI API (Bootcamp Treinos)

## 1. Visão do Produto

API REST que serve o app FIT.AI: gerencia usuários, dados antropométricos, planos de treino semanais, dias e exercícios, sessões de execução, estatísticas de consistência e o Coach AI (chat com tool calling para criar/ajustar planos). Construída sobre Fastify 5 + Prisma 7 + Better Auth, com OpenAPI auto-gerado, validação via Zod 4 e PostgreSQL como fonte da verdade.

## 2. Problema

O frontend precisa de uma API:

- **Estável** — contratos versionados via Zod + OpenAPI consumíveis por Orval.
- **Stateful em sessão** — Better Auth com cookies seguros cross-origin.
- **Transacional** — operações como criar plano e iniciar sessão precisam de atomicidade (desativar plano anterior, garantir 1 sessão por dia).
- **Auditável** — todo acesso autenticado, erros tipados com códigos.
- **Compatível com IA** — endpoint de chat streaming que pode invocar tools internas (ex.: criar plano) com contexto do usuário.

## 3. Usuários e Personas (consumidores da API)

- **Frontend Next.js (P1)** — único consumidor humano-mediado; chama via `fetch` com cookies.
- **Coach AI (P2)** — consumidor interno (LLM via Vercel AI SDK) com acesso a tools que chamam endpoints próprios.
- **Devs do bootcamp (P3)** — exploram via Scalar UI em `/docs` e Swagger JSON em `/swagger.json`.

## 4. Objetivos

- Servir todos os fluxos do PRD do Frontend (login, home, plano, dia, sessão, stats, perfil, chat).
- Produzir OpenAPI fiel para Orval gerar tipos sem drift.
- Garantir atomicidade nos use cases críticos via transações Prisma.
- Manter latência p75 < 300ms para endpoints síncronos comuns.
- Streamar respostas de IA com tempo até primeiro token (TTFB) < 1.5s.

## 5. Não Objetivos

- Não há catálogo público de exercícios (vem do Coach AI).
- Não há marketplace nem pagamentos.
- Não há rate limiting fino por usuário neste release (apenas Better Auth padrão).
- Não há multi-tenant — 1 usuário, 1 conjunto de planos.
- Não há rotas administrativas/back-office.

## 6. Requisitos Funcionais (alto nível)

| ID | Requisito |
|---|---|
| RF-01 | Autenticação Google OAuth via Better Auth com sessão em cookie httpOnly |
| RF-02 | CRUD-lite de plano de treino (list, create, get) |
| RF-03 | Get de dia de treino com exercícios |
| RF-04 | Iniciar sessão de treino (POST) — exclusiva por dia/plano ativo |
| RF-05 | Atualizar sessão (PATCH) — completar treino |
| RF-06 | Get de dados da home por data (treino do dia + consistência) |
| RF-07 | Get/Upsert de dados do usuário (peso, altura, idade, %GC) |
| RF-08 | Get de estatísticas (heatmap + KPIs) por intervalo de datas |
| RF-09 | POST `/ai` com streaming SSE para Coach AI |
| RF-10 | OpenAPI 3 disponível em `/swagger.json` e Scalar UI em `/docs` |
| RF-11 | CORS para `http://localhost:3000` com `credentials: true` |

## 7. Requisitos Não Funcionais

| Categoria | Requisito |
|---|---|
| Performance | p75 < 300ms em endpoints síncronos; AI TTFT < 1.5s |
| Segurança | Cookies httpOnly + Secure em prod; CORS restrito; sem secrets em logs |
| Observabilidade | Logger Fastify (pino) com request id; níveis info/error |
| Tipagem | TypeScript strict + Zod compartilhado entre validação e OpenAPI |
| Banco | Migrations versionadas em `prisma/migrations`; transações em ops compostas |
| Escala | Stateless app; Postgres pode escalar verticalmente; conexão via `@prisma/adapter-pg` |

## 8. Métricas de Sucesso

| Métrica | Alvo |
|---|---|
| Disponibilidade local | ≥ 99% no horário do bootcamp |
| Latência p75 (sync endpoints) | < 300ms |
| TTFT do `/ai` | < 1.5s |
| Erros 5xx / total requests | < 0.5% |
| Drift de tipos (frontend ↔ swagger) | 0 incidentes por release |

## 9. Escopo de Release (Atual)

### Incluído

- Rotas: `/home`, `/me`, `/workout-plans`, `/stats`, `/ai`, `/api/auth/*`, `/swagger.json`, `/docs`, `/`.
- Use cases: GetHomeData, GetStats, GetWorkoutPlan, GetWorkoutDay, ListWorkoutPlans, CreateWorkoutPlan, StartWorkoutSession, UpdateWorkoutSession, GetUserTrainData, UpsertUserTrainData.
- Modelos Prisma: User, WorkoutPlan, WorkoutDay, Exercise, WorkoutSession, Session, Account, Verification.
- Erros tipados: `NotFoundError`, `WorkoutPlanNotActiveError`, `SessionAlreadyStartedError`.
- Coach AI com tool calling para criar plano completo.

### Fora do escopo

- Rotas de admin/moderação.
- Webhooks externos.
- Filas/jobs assíncronos (BullMQ etc.).
- Versionamento de API (`/v1/...`) — caminho é raiz neste ciclo.
- Rate limiting customizado.

## 10. Ambiente e Deploy

- Node `24.x`, pnpm `10.30.0` (engine-strict).
- PostgreSQL 16 via Docker (local).
- Variáveis: `PORT`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Porta default: `8080`.
- Build: `tsc -p tsconfig.json` → `dist/index.js`.

## 11. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Drift entre Zod e Prisma | Médio | Schemas Zod referenciam enums gerados pelo Prisma |
| Cookie cross-origin bloqueado | Crítico | CORS com origin explícito + credentials; SameSite=None+Secure em prod |
| Race em criar plano enquanto outro existe ativo | Alto | Transação Prisma desativa ativos antes de inserir |
| Tool calling do Coach AI gerar plano inválido | Alto | Validação Zod no use case antes do persist |
| Custo de tokens OpenAI | Médio | Limite de mensagens/contexto + cache de prompt do system |
