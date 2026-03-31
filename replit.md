# A.M.E.L.I.A. — Totem de Triagem Médica

**Atendimento Médico Eficiente e Lenitivo com Inteligência Artificial**

Sistema de triagem médica com IA para o SUS (Sistema Único de Saúde) do Brasil. Totem de autoatendimento com classificação de prioridade automatizada por ML.

## Arquitetura

### Monorepo (pnpm workspaces)
- `artifacts/amelia-totem` — Frontend React + Vite (previewPath: `/`)
- `artifacts/api-server` — Backend Express + PostgreSQL (porta 8080, proxy em `/api`)
- `lib/db` — Schema Drizzle ORM + migrações PostgreSQL
- `lib/api-client-react` — Hooks React Query gerados do OpenAPI spec
- `lib/api-spec` — OpenAPI 3.0 spec (`openapi.yaml`)

### Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Wouter
- **Backend**: Express, TypeScript, Drizzle ORM, bcrypt, express-session
- **Banco de dados**: PostgreSQL (via `DATABASE_URL`)
- **Auth**: Session-based (express-session com cookies httpOnly)
- **ML**: Classificador keyword-scoring + análise de sinais vitais (`ml-triage.ts`)

## Credenciais de Teste

| Tipo | CPF | Senha | Papel |
|------|-----|-------|-------|
| Administrador | `000.000.000-00` | `admin123` | admin |
| Paciente 1 | `123.456.789-01` | `senha123` | paciente |
| Paciente 2 | `987.654.321-00` | `senha123` | paciente |

## Rotas Frontend

| Rota | Descrição |
|------|-----------|
| `/` | Home — Totem de boas-vindas com seleção de acesso |
| `/login` | Login via CPF ou Cartão SUS |
| `/cadastro` | Primeiro cadastro de paciente |
| `/triagem` | Wizard de triagem 3 etapas (sintomas → sinais vitais → revisão) |
| `/senha/:id` | Senha/Ticket gerado com prioridade |
| `/admin` | Painel administrativo (requer papel=admin) |

## Rotas API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/cadastro` | Registrar novo paciente |
| POST | `/api/auth/login` | Login (campo: `identificador` + `senha`) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Usuário atual (requer sessão) |
| POST | `/api/triagem` | Realizar triagem com IA |
| GET | `/api/tickets` | Listar tickets do usuário |
| GET | `/api/tickets/:id` | Obter ticket por ID |
| PATCH | `/api/tickets/:id` | Atualizar status do ticket |
| GET | `/api/admin/fila` | Fila de espera por prioridade |
| POST | `/api/admin/chamar` | Chamar próximo ticket |
| GET | `/api/admin/estatisticas` | Estatísticas em tempo real |
| GET | `/api/admin/pacientes` | Lista de todos os pacientes |
| POST | `/api/ml/retreinar` | Retreinar modelo ML |
| GET | `/api/ml/logs` | Logs de predições ML |

## Prioridades

| Código | Cor | Critério |
|--------|-----|----------|
| U (Urgente) | Vermelho `#E74C3C` | Dor peito, falta de ar, inconsciência, dor ≥8, febre ≥39.5 |
| M (Moderado) | Laranja `#F39C12` | Febre, dor ≥5, sintomas moderados |
| L (Leve) | Verde `#27AE60` | Sintomas leves, sem alarmes |

## Formato dos Tickets
- Urgente: `U001`, `U002`, ...
- Moderado: `M001`, `M002`, ...
- Leve: `L001`, `L002`, ...

## Design
- Fundo: gradiente azul escuro `#0f2447` → `#2E4A7A`
- Botões touch-friendly (mínimo 60px)
- Animações com Framer Motion
- Logo AMELIA em `/amelia-logo.png`
- Totalmente em PT-BR
