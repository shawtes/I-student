# iStudent - Setup and Infrastructure

This doc covers how the web app is built, what libraries we use, what database we're on, and how it's deployed on AWS.

## Overview

iStudent is a two-tier web app. There's a React single page app in the browser that talks to a Node.js/Express API over HTTPS. The API uses MongoDB Atlas for persistence and AWS S3 for file uploads. Authentication is handled by AWS Cognito. The live site is hosted on AWS Amplify (frontend) with a Beanstalk environment for the backend, fronted by CloudFront for HTTPS.

```
Browser
  |
  v
Amplify static hosting (React bundle, SPA rewrites)
  |  /api/*
  v
CloudFront (HTTPS -> HTTP re-termination)
  |
  v
Elastic Beanstalk (Node 22, Express app)
  |
  +--> MongoDB Atlas (all app data)
  +--> S3 (uploaded files)
  +--> Gemini / OpenAI / Bedrock (AI calls)
  +--> Cognito (token verification)
```

## Frontend

The UI is a plain Create React App project under `client/`. We chose CRA because the project started before the team had exposure to Next.js and it's the simplest path for a pure SPA.

### Core libraries

| Package | Version | What it does |
|---|---|---|
| `react` | 18.x | UI framework |
| `react-router-dom` | 6.x | Client-side routing for student/tutor/admin pages |
| `axios` | 1.12 | HTTP client with interceptors for auth tokens |
| `aws-amplify` | latest | Cognito sign in/up/confirm and fetching the ID token |

### UI libraries

| Package | What it does |
|---|---|
| `react-big-calendar` | Month/week/day calendar on the Schedule page |
| `moment` | Date formatting/parsing for the calendar localizer |

No Tailwind, no component library. Styles are a mix of a small `index.css` with CSS custom properties for colors/spacing, plus inline style objects on components.

### Project layout

```
client/src/
  components/
    auth/            Login, Register, DevLogin
    student/         Dashboard shell + all student pages
    tutor/           Tutor dashboard (Availability, Requests, Earnings, Profile)
    admin/           Admin dashboard + HelpDeskAdmin
  context/
    AuthContext.js   Cognito session + dev-login fallback
  services/
    api.js           Axios instance with auth interceptor
  data/
    gsuCourses.js    GSU course catalog (used across pickers)
```

## Backend

Node.js 22 running Express. Code is organized by feature: each top-level concept has a route file, a Mongoose model, and sometimes a service for heavier logic like AI calls.

### Core libraries

| Package | Version | What it does |
|---|---|---|
| `express` | 4.18 | HTTP server and routing |
| `mongoose` | 8.x | MongoDB ODM (schemas + queries) |
| `jsonwebtoken` | 9.x | Verifying Cognito JWTs |
| `jwks-rsa` | 4.x | Fetching Cognito's signing keys from the JWKS endpoint |
| `cors` | 2.x | CORS middleware (for dev; prod is same-origin) |
| `dotenv` | 16.x | Loading `.env` locally |
| `express-rate-limit` | 8.x | Per-IP rate limits on auth and AI endpoints |
| `multer` | 2.x | Multipart file uploads (memory storage, streams straight to S3) |
| `bcryptjs` | 2.x | Legacy password hashing (not used now that auth is Cognito) |

### AWS SDKs

| Package | What it does |
|---|---|
| `@aws-sdk/client-s3` | Upload/download/delete objects in S3 |
| `@aws-sdk/s3-request-presigner` | Generate short-lived signed URLs for file downloads |
| `@aws-sdk/client-bedrock-runtime` | Claude via Bedrock (fallback, blocked on this AWS account) |

### AI and content libraries

| Package | What it does |
|---|---|
| `@google/generative-ai` | Gemini 2.5 Flash, primary AI provider |
| `openai` | GPT-4o-mini, secondary fallback |
| `pdf-parse` | Extracts text from uploaded PDFs for AI context |

### Route layout

```
server/
  index.js                 Express app, mounts all routes
  config/
    database.js            Mongo connection
    s3.js                  S3 client + helpers
  middleware/
    auth.js                Verifies Cognito JWT, supports DEV_AUTH bypass
    loadUser.js            Looks up the Mongo User from the Cognito sub
    aiQuota.js             Per-day AI request limits by subscription plan
    rateLimiter.js         Generic rate limits
  models/                  Mongoose schemas (User, File, Conversation,
                           Booking, Payment, Ticket, ForumPost, etc.)
  routes/                  One file per feature area
  services/                AI clients, file text extraction, study tools
  scripts/
    seed.js                Populates demo data (tutors, forum, tickets...)
```

### Notable design choices

The `auth` middleware has two modes. In real production with a Cognito JWT, it verifies the token against the Cognito JWKS. In demo/dev mode (set `DEV_AUTH=1` in the environment), it accepts an `x-dev-user` header with a JSON blob instead. This lets us log in as any role without going through Cognito email verification, which is critical for demos.

Most routes use a two-middleware chain: `auth` sets `req.user` from the token, then `loadUser` finds the Mongo `User` document by `cognitoId` and attaches it as `req.dbUser`. Route handlers treat `req.dbUser._id` as the canonical user reference for relations (bookings, flashcards, etc.).

The AI services are layered with a fallback chain. Each service tries Gemini first, then Bedrock, then OpenAI, and finally a naive non-AI fallback if nothing is configured. That way demos don't break when a provider is rate-limited.

## Database

We use **MongoDB Atlas** (free-tier shared cluster, `M0`) in the `us-east-2` region. Connection string lives in the `MONGODB_URI` environment variable.

Why MongoDB rather than Postgres/MySQL: the data model has a lot of variable-shape documents (conversations with embedded messages, forum posts with replies, tickets with threaded messages) and the schema evolved a lot during the semester. Schemaless documents let us iterate quickly without migrations.

### Collections

| Collection | What it holds |
|---|---|
| `users` | Accounts, role (student/tutor/admin), GSU courses enrolled, tutor profile fields |
| `files` | Uploaded file metadata (original name, S3 key, folder/course, size) |
| `conversations` | AI tutor chat sessions with embedded message arrays |
| `flashcards` | AI or manually generated study cards, grouped by deck name |
| `study_contents` | Quizzes, flashcard sets, and study guides generated from files/topics |
| `study_sessions` | Calendar events (study blocks, exams, assignment deadlines) |
| `bookings` | Tutoring session requests and their status lifecycle |
| `payments` | Stripe-style records for both tutoring payments and subscription charges |
| `subscriptions` | Per-user Free/Pro/Premium plan with payment history |
| `usages` | Daily AI request counters for quota enforcement |
| `availabilities` | Tutor weekly schedule slots |
| `tickets` | Help desk tickets with threaded messages |
| `forum_posts` | Forum threads with embedded replies, categories, likes |
| `groups` | Study groups (name, admin, members, pending join requests) |
| `progresses` | Tutor-written progress notes on students |
| `ratings` | Per-session tutor ratings |
| `gmail_tokens` | OAuth tokens for Gmail Calendar integration |

### Indexes worth knowing about

- `users.email` is unique
- `users.cognitoId` is unique
- `conversations.userId` + `updatedAt` for fast history listing
- `bookings.tutor` + `startTime` is unique (prevents double-booking)
- `usages.userId` + `date` is unique (one row per user per day)

## AWS infrastructure

Everything is in `us-east-2` (Ohio).

### Amplify (frontend hosting)

The React bundle is deployed to AWS Amplify. The app ID is `d1s63qj9hsr1zj`, domain is `main.d1s63qj9hsr1zj.amplifyapp.com`.

We chose Amplify because it gives us HTTPS with a valid cert automatically, handles the SPA rewrite for client-side routes, and has a generous free tier.

Two custom rewrite rules are configured:

1. `/api/<*>` proxies to `https://d5u6ox7235rfh.cloudfront.net/api/<*>` with status 200. This is how the frontend reaches the API from an HTTPS origin.
2. A SPA catch-all that rewrites any non-file path to `/index.html` so React Router can handle it.

Deploy flow: the build zip is uploaded via the Amplify API because we haven't hooked the GitHub repo to Amplify yet.

```
cd client && npm run build
cd build && zip -qr /tmp/build.zip .
aws amplify create-deployment --app-id d1s63qj9hsr1zj --branch-name main
# Upload the zip to the pre-signed URL from the response
aws amplify start-deployment --app-id d1s63qj9hsr1zj --branch-name main --job-id <id>
```

### Elastic Beanstalk (backend hosting)

The Node/Express app runs on Elastic Beanstalk in a single-instance environment.

- Environment: `i-student-env`
- Platform: Node.js 22 on Amazon Linux 2023 (6.10.1)
- CNAME: `i-student-env.eba-qrqp4xjp.us-east-2.elasticbeanstalk.com`

Deploys happen via the EB CLI: `eb deploy` zips the repo minus what's in `.ebignore`, uploads to S3, and rolls out to the instance. `.ebignore` keeps `node_modules`, the client source, and uploads folder out of the bundle. The React build output is included so a single EB instance can serve both API and (as a backup) the compiled frontend.

Environment variables are set via `eb setenv` or the EB console:

- `MONGODB_URI` — Atlas connection string
- `AWS_REGION` — `us-east-2`
- `AWS_S3_BUCKET` — `i-student-files`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — S3 access (instance role would be better, on the list)
- `COGNITO_REGION` / `COGNITO_USER_POOL_ID` — Used to verify JWTs
- `GEMINI_API_KEY` — Google Gemini
- `OPENAI_API_KEY` — OpenAI (fallback, optional)
- `DEV_AUTH` — set to `1` during demos so `x-dev-user` headers work

### CloudFront (HTTPS wrapper)

Elastic Beanstalk's default domain only speaks HTTP, and Amplify won't proxy to an HTTP target from an HTTPS page (mixed content). CloudFront sits in front to terminate HTTPS using its default `*.cloudfront.net` cert.

- Distribution ID: `EIXPRYSOA1021`
- Domain: `d5u6ox7235rfh.cloudfront.net`
- Origin: `i-student-env.eba-qrqp4xjp.us-east-2.elasticbeanstalk.com` (HTTP)
- Cache policy: `Managed-CachingDisabled` (we don't want API responses cached)
- Origin request policy: `Managed-AllViewer` (forwards Authorization header, query strings, cookies)

The chain a request takes:

```
browser -> Amplify (https) -> CloudFront (https) -> EB (http) -> Express
```

### S3 (file storage)

Bucket: `i-student-files` in `us-east-2`.

Objects are keyed as `uploads/<cognitoId>/<timestamp>-<random>.<ext>`. The bucket is private; downloads go through the backend, which generates short-lived presigned URLs so the frontend can fetch them directly without proxying through EB.

Uploaded file types are restricted in the multer config: PDFs, Word docs, plain text, and common audio/video formats.

### Cognito (authentication)

User pool ID: `us-east-2_baWOWMykv` in `us-east-2`.

The React app uses `aws-amplify/auth` to handle sign up, email verification, sign in, and fetching the ID token. The ID token is attached as `Authorization: Bearer <token>` to every API request via an axios interceptor.

The backend verifies tokens by:

1. Parsing the JWT header to get the `kid`
2. Fetching the matching public key from the Cognito JWKS endpoint (cached by `jwks-rsa`)
3. Verifying the signature and checking the `iss` claim matches our pool

Roles (`student`, `tutor`, `admin`) are stored on the Mongo `User` record rather than as Cognito custom attributes. The first time a new Cognito user hits `/api/auth/me`, the backend creates a Mongo record with the role they chose at registration. Admin role can't be self-assigned; an existing admin has to grant it from the admin dashboard.

### GitHub Actions / CI

No CI configured yet. Deploys are manual (`eb deploy` for backend, Amplify upload script for frontend). Commits still go to the `shawtes/I-student` repo on GitHub for version control.

## AI stack

The app makes AI calls in three places: the AI Tutor chat, flashcard generation, and study tool generation (quizzes, guides).

| Provider | Role | Model | Cost |
|---|---|---|---|
| Google Gemini | Primary | `gemini-2.5-flash` | Free tier (15 req/min, 1M tokens/day) |
| AWS Bedrock | Fallback | Claude Sonnet 4.6 / Haiku 4.5 | Paid, but our account doesn't have access |
| OpenAI | Secondary fallback | `gpt-4o-mini` | Paid per token |
| Naive splitter | Last resort | N/A | Free, low quality |

Each AI service (`server/services/*Service.js`) tries these in order. If Gemini returns a valid response, we use it. If it fails (rate limit, API error), we fall through to the next one. For the demo, Gemini is the only one actually doing work.

Per-user daily quotas are enforced by the `aiQuota` middleware before the AI call:

- Free plan: 5 requests/day
- Pro plan: 100 requests/day
- Premium plan: unlimited

When a free user hits 5, the API returns 402 and the frontend shows an upgrade modal.

## Local development

```bash
# Install everything
npm install && cd client && npm install && cd ..

# Environment
cp .env.example .env
# Fill in MONGODB_URI, AWS keys, COGNITO_*, GEMINI_API_KEY

# Backend (terminal 1)
DEV_AUTH=1 npm run dev      # Port 5001

# Frontend (terminal 2)
cd client && npm start      # Port 3000
```

Visit `http://localhost:3000/dev-login` and pick a role to log in without Cognito.

To populate demo data against whatever DB your `.env` points at:

```bash
node server/scripts/seed.js
```

## Production URLs

| What | URL |
|---|---|
| Live app (HTTPS) | https://main.d1s63qj9hsr1zj.amplifyapp.com |
| Backup (HTTP) | http://i-student-env.eba-qrqp4xjp.us-east-2.elasticbeanstalk.com |
| API direct | https://d5u6ox7235rfh.cloudfront.net/api |
| GitHub repo | https://github.com/shawtes/I-student |

## Known gaps

1. Gmail Calendar OAuth flow is only partially wired. The token storage endpoints exist, but the actual OAuth consent screen isn't hooked up yet. Falls back to an internal calendar for now.
2. Real-time lecture transcription relies on OpenAI Whisper; the WebSocket streaming path isn't in place.
3. Amplify auto-build on git push isn't connected. Every frontend change requires the manual build+upload script.
4. The single-instance EB environment has no auto-scaling. Fine for demos, not for real traffic.
5. `DEV_AUTH=1` is currently enabled in production so we can demo role switching. This has to be turned off (`eb setenv DEV_AUTH=`) before the site gets any real users.
