# Tech Stack

This document describes the technology stack for each component of the I-Student platform, including the tools, frameworks, and methodologies used or recommended.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend — Node.js/Express API](#backend--nodejsexpress-api)
3. [Frontend — React SPA](#frontend--react-spa)
4. [Database — MongoDB](#database--mongodb)
5. [AI/ML Services](#aiml-services)
6. [DevOps & Deployment](#devops--deployment)
7. [Alternative Open Source Stacks](#alternative-open-source-stacks)
8. [Methodologies](#methodologies)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                  Frontend (React 18)                      │
│  Student Portal  │  Admin Portal  │  Auth Pages           │
└──────────────────────────────────────────────────────────┘
                         ↕ REST API
┌──────────────────────────────────────────────────────────┐
│               Backend (Node.js + Express)                 │
│  Routes → Middleware (JWT, RBAC, Rate Limit) → Services   │
└──────────────────────────────────────────────────────────┘
                         ↕
┌──────────────────────────────────────────────────────────┐
│                     Data Layer                            │
│  MongoDB  │  File System (uploads)  │  OpenAI API         │
└──────────────────────────────────────────────────────────┘
```

---

## Backend — Node.js/Express API

| Component | Technology | Version | License | Role |
|-----------|-----------|---------|---------|------|
| Runtime | **Node.js** | 18+ | MIT | JavaScript server runtime |
| Framework | **Express** | ^4.18.2 | MIT | HTTP routing, middleware pipeline |
| Database ODM | **Mongoose** | ^8.9.5 | MIT | MongoDB object modeling and queries |
| Authentication | **jsonwebtoken** | ^9.0.2 | MIT | JWT token creation and verification |
| Password Hashing | **bcryptjs** | ^2.4.3 | MIT | Secure password storage with salt |
| File Uploads | **multer** | ^2.0.2 | MIT | Multipart form-data handling |
| HTTP Client | **axios** | ^1.12.0 | MIT | External API calls (OpenAI) |
| CORS | **cors** | ^2.8.5 | MIT | Cross-origin request handling |
| Environment Config | **dotenv** | ^16.3.1 | BSD-2-Clause | `.env` file loading |
| Rate Limiting | **express-rate-limit** | ^8.2.1 | MIT | API abuse prevention |
| AI Integration | **openai** | ^4.20.0 | Apache-2.0 | GPT-4 and Whisper API client |
| Unique IDs | **uuid** | ^9.0.1 | MIT | UUID generation for resources |
| Dev Hot Reload | **nodemon** | ^3.0.1 | MIT | Auto-restart on file changes |

### Backend Structure

```
server/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js              # User schema & auth
│   ├── File.js              # File metadata & transcription
│   ├── Group.js             # Study group schema
│   └── StudyContent.js      # Quizzes, flashcards, guides
├── middleware/
│   ├── auth.js              # JWT verification
│   └── adminAuth.js         # Admin role check
├── routes/
│   ├── auth.js              # Register, login, profile
│   ├── files.js             # Upload, CRUD for files
│   ├── transcription.js     # Audio/video → text
│   ├── tutoring.js          # RAG question answering
│   ├── study.js             # Content generation
│   ├── scheduling.js        # Session planning
│   ├── partners.js          # Partner matching & groups
│   └── admin.js             # User & stats management
├── services/
│   ├── transcriptionService.js  # Whisper integration
│   ├── tutoringService.js       # GPT-4 + RAG
│   └── studyService.js          # Content generation
└── index.js                 # Express app entry point
```

---

## Frontend — React SPA

| Component | Technology | Version | License | Role |
|-----------|-----------|---------|---------|------|
| UI Library | **React** | ^18.2.0 | MIT | Component-based UI |
| DOM Renderer | **React DOM** | ^18.2.0 | MIT | Browser rendering |
| Routing | **React Router DOM** | ^6.20.0 | MIT | Client-side navigation |
| HTTP Client | **Axios** | ^1.12.0 | MIT | API communication |
| Build Tooling | **react-scripts** | 5.0.1 | MIT | Create React App build pipeline |
| State Management | **React Context API** | Built-in | MIT | Auth state, global state |

### Frontend Structure

```
client/
├── public/
│   └── index.html
└── src/
    ├── components/
    │   ├── auth/              # Login, Register
    │   ├── student/           # Dashboard, Files, Tutor, Study, Schedule, Partners
    │   └── admin/             # Admin dashboard, user management
    ├── context/
    │   └── AuthContext.js     # Authentication provider
    ├── services/
    │   └── api.js             # Axios API client with interceptors
    ├── App.js                 # Root component with routes
    ├── index.js               # Entry point
    └── index.css              # Global styles
```

---

## Database — MongoDB

| Component | Technology | License | Role |
|-----------|-----------|---------|------|
| Database | **MongoDB** | SSPL | NoSQL document store |
| ODM | **Mongoose** | MIT | Schema validation, queries, middleware |
| Hosting (Dev) | **Local MongoDB** | SSPL | Local development |
| Hosting (Prod) | **MongoDB Atlas** | Free tier available | Managed cloud database |

### Data Models

- **User** — Authentication, profile, preferences, study partners, group memberships
- **File** — Upload metadata, storage paths, transcription status and text
- **Group** — Study groups with members, schedules, shared resources
- **StudyContent** — AI-generated quizzes, flashcards, and study guides

---

## AI/ML Services

| Service | Provider/Tool | License | Purpose |
|---------|--------------|---------|---------|
| **LLM Tutoring** | OpenAI GPT-4 | API (commercial) | RAG-based question answering grounded in student materials |
| **Transcription** | OpenAI Whisper | MIT (model) / API | Speech-to-text for lecture recordings |
| **Content Generation** | OpenAI GPT-4 | API (commercial) | Quiz, flashcard, and study guide generation |
| **Spaced Repetition** | FSRS Algorithm | MIT | Optimal review scheduling for flashcards (recommended) |
| **Knowledge Tracing** | BKT / DKT models | MIT | Student mastery modeling (recommended) |
| **RAG Framework** | LangChain / LlamaIndex | MIT | Document indexing and retrieval for tutoring (recommended) |
| **Embeddings** | OpenAI / Hugging Face | MIT / Apache-2.0 | Text vectorization for semantic search |

### Open Source AI Alternatives

For self-hosted deployments that avoid API costs:

| Component | Open Source Alternative | License | Notes |
|-----------|----------------------|---------|-------|
| LLM | **Llama 3** / **Mistral** | Llama Community License / Apache-2.0 | Run locally with Ollama or vLLM |
| Transcription | **Whisper.cpp** | MIT | C++ port for fast local inference |
| Embeddings | **Sentence Transformers** | Apache-2.0 | Local embedding generation |
| Vector Store | **ChromaDB** / **Weaviate** | Apache-2.0 / BSD-3-Clause | Local vector database for RAG |
| Orchestration | **LangChain** | MIT | Chain LLM calls with retrieval |

---

## DevOps & Deployment

| Component | Technology | License | Role |
|-----------|-----------|---------|------|
| Containerization | **Docker** | Apache-2.0 | Application packaging |
| Orchestration | **Docker Compose** | Apache-2.0 | Multi-container management |
| CI/CD | **GitHub Actions** | N/A (service) | Automated testing and deployment |
| Reverse Proxy | **Nginx** | BSD-2-Clause | Production traffic routing (recommended) |
| Process Manager | **PM2** | AGPL-3.0 | Node.js process management (alternative: use Docker) |
| Monitoring | **Prometheus + Grafana** | Apache-2.0 | Metrics and dashboards (recommended) |
| Logging | **Winston** / **Pino** | MIT | Structured application logging (recommended) |

### Docker Configuration

```yaml
# docker-compose.yml
services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongo-data:/data/db]

  backend:
    build: .
    ports: ["5000:5000"]
    env_file: .env
    depends_on: [mongodb]
```

---

## Alternative Open Source Stacks

If building I-Student from scratch, these are fully open source stack alternatives:

### Stack A: Python/Django + React (Full Open Source)

| Layer | Technology | License |
|-------|-----------|---------|
| Backend | Django + Django REST Framework | BSD-3-Clause |
| Frontend | React | MIT |
| Database | PostgreSQL | PostgreSQL License (permissive) |
| AI | Hugging Face Transformers + LangChain | Apache-2.0 / MIT |
| Search | Elasticsearch / Meilisearch | SSPL / MIT |

### Stack B: SvelteKit + Supabase (Modern Open Source)

| Layer | Technology | License |
|-------|-----------|---------|
| Full-Stack Framework | SvelteKit | MIT |
| Backend/Auth/DB | Supabase (PostgreSQL + Auth + Storage) | Apache-2.0 |
| AI | LangChain.js + Ollama | MIT |
| Search | pgvector (PostgreSQL extension) | PostgreSQL License |

### Stack C: Next.js + tRPC (TypeScript Full-Stack)

| Layer | Technology | License |
|-------|-----------|---------|
| Framework | Next.js | MIT |
| API Layer | tRPC | MIT |
| Database | Prisma + PostgreSQL | Apache-2.0 / PostgreSQL License |
| AI | Vercel AI SDK + LangChain | Apache-2.0 / MIT |
| Auth | NextAuth.js | ISC |

---

## Methodologies

### Development Methodology

| Practice | Description |
|----------|-------------|
| **Agile/Scrum** | Iterative development with sprints, standups, and retrospectives |
| **Git Flow** | Feature branches, pull requests, code reviews before merging |
| **CI/CD** | Automated testing and deployment via GitHub Actions |
| **Code Review** | All changes reviewed before merge; emphasis on security |

### AI/ML Methodology

| Methodology | Application in I-Student |
|-------------|-------------------------|
| **RAG (Retrieval-Augmented Generation)** | Ground AI tutor responses in uploaded study materials to reduce hallucination |
| **Spaced Repetition (FSRS/SM-2)** | Schedule flashcard reviews at optimal intervals for long-term retention |
| **Bayesian Knowledge Tracing (BKT)** | Model student mastery probabilities per concept to adapt difficulty |
| **Deep Knowledge Tracing (DKT)** | Use LSTM networks for more accurate student performance prediction |
| **Prompt Engineering** | Craft effective prompts for quiz generation, study guides, and tutoring |

### Security Methodology

| Practice | Implementation |
|----------|---------------|
| **Authentication** | JWT tokens with expiry, bcrypt password hashing |
| **Authorization** | Role-Based Access Control (RBAC) — Student and Admin roles |
| **Rate Limiting** | Per-endpoint rate limits to prevent abuse |
| **Input Validation** | File type/size validation, request body sanitization |
| **Secrets Management** | Environment variables via `.env`, never committed to source |
| **Dependency Auditing** | Regular `npm audit` and dependency updates |

### Testing Methodology

| Level | Tools | Scope |
|-------|-------|-------|
| **Unit Tests** | Jest | Model validation, service functions, utilities |
| **Integration Tests** | Supertest + Jest | API endpoints, database operations, auth flows |
| **E2E Tests** | Cypress / Playwright | Full user workflows (upload → transcribe → tutor → quiz) |
| **Security Tests** | CodeQL, npm audit | Vulnerability scanning, dependency checks |

---

*Last updated: February 2026*
