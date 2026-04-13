# iStudent setup notes

Quick rundown of how the app is put together, what we used, and how it ends up on the internet. Written mostly for us to remember later.

## What the app is

Two pieces: a React SPA in the browser and a Node/Express API on the backend. They talk over HTTPS. The API stores stuff in MongoDB Atlas, uploads files to S3, and runs Cognito for logins. Live site is on AWS Amplify with the API sitting on Elastic Beanstalk behind CloudFront.

Rough flow of a request:

```
browser -> Amplify (static site) -> CloudFront (https) -> Elastic Beanstalk (Express)
                                                              |
                                                              +-> MongoDB Atlas
                                                              +-> S3
                                                              +-> Gemini / OpenAI
                                                              +-> Cognito JWKS
```

## Frontend

Plain Create React App under `client/`. We started on CRA before anyone on the team knew Next.js and never moved off. Its fine for an SPA.

Main libraries:

- `react` 18
- `react-router-dom` for the routes (student/tutor/admin dashboards are all separate trees)
- `axios` for API calls, with an interceptor that attaches the Cognito token
- `aws-amplify` for the Cognito sign up / sign in / verify flow
- `react-big-calendar` + `moment` for the Schedule page

No Tailwind. No component library. Styling is a mix of one global `index.css` with CSS variables for colors and a bunch of inline style objects on components. Works fine, probably not the path we'd pick again.

Folder layout looks like this:

```
client/src/
  components/
    auth/       Login, Register, DevLogin
    student/    Dashboard shell + every student page (Files, Tutoring, Flashcards, Schedule, Billing, etc)
    tutor/      Tutor dashboard (Requests, Availability, Earnings, Profile)
    admin/      Admin dashboard + HelpDeskAdmin
  context/
    AuthContext.js   Cognito session + dev login fallback
  services/
    api.js           Axios instance with auth interceptor
  data/
    gsuCourses.js    GSU course catalog, used by everything
```

## Backend

Node 22 + Express. Code is split by feature — every major thing (files, bookings, forum, tickets, etc) has a route file, a Mongoose model, and sometimes a services file if theres AI or heavier logic.

Libraries that matter:

- `express` 4.18 — the server
- `mongoose` 8 — MongoDB ODM
- `jsonwebtoken` + `jwks-rsa` — for verifying Cognito tokens against their JWKS endpoint
- `multer` — file uploads, memory storage so we can pipe straight to S3
- `express-rate-limit` — basic per-IP limits, plus a stricter one for the AI endpoints
- `cors`, `dotenv`, `bcryptjs` (bcrypt is leftover from before we switched to Cognito)

AWS SDKs:

- `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` for uploads and presigned download URLs
- `@aws-sdk/client-bedrock-runtime` — tried to use Bedrock for Claude but our account doesnt have access so its a dead fallback

AI + content:

- `@google/generative-ai` for Gemini 2.5 Flash (what actually runs in prod)
- `openai` as a backup if we ever put a key in
- `pdf-parse` for pulling text out of uploaded PDFs so the AI can read them

Server folders:

```
server/
  index.js            Mounts all routes, serves the built React app in prod
  config/
    database.js       Mongo connection
    s3.js             S3 client + upload/delete/presign helpers
  middleware/
    auth.js           Cognito JWT check, plus dev bypass when DEV_AUTH=1
    loadUser.js       Looks up the Mongo User for the current Cognito sub
    aiQuota.js        Per-day AI request counter keyed to the subscription plan
    rateLimiter.js    Generic rate limiters
  models/             Mongoose schemas
  routes/             One file per feature
  services/           AI clients, file text extraction, study tools
  scripts/
    seed.js           Dumps demo data into the DB
```

One thing worth knowing: most routes stack `auth` then `loadUser`. `auth` parses the token and sets `req.user` with the Cognito sub, email, etc. `loadUser` looks up the Mongo `User` by cognitoId and hangs it off `req.dbUser`. Relations (booking.student, flashcard.owner, etc) always reference `req.dbUser._id`, not the cognitoId string.

The AI services have a fallback chain — try Gemini, then Bedrock, then OpenAI, then a dumb sentence splitter if everythings broken. In practice only Gemini runs because Bedrock access was never granted and we dont have an OpenAI key on the env.

## Database

MongoDB Atlas on the free shared tier (M0), us-east-2. Connection string is in the `MONGODB_URI` env var.

Went with Mongo because the data shapes kept changing through the semester and migrations wouldve been a pain. A lot of our models have embedded arrays too — conversations have messages inline, forum posts have replies inline, tickets have their message thread inline — which Mongo handles naturally. SQL wouldve been more work for the same result.

Collections currently in use:

- `users` — accounts, role, GSU courses enrolled, tutor fields (subjects, rate, rating)
- `files` — uploaded file metadata. Actual bytes live in S3
- `conversations` — AI tutor chat sessions with embedded message arrays
- `flashcards` — AI or manually made, grouped by deck name (just a string)
- `study_contents` — quizzes, flashcard sets, and study guides generated by the Study Tools page
- `study_sessions` — calendar events (study blocks, exams, assignment due dates)
- `bookings` — tutoring session requests
- `payments` — payment records for both tutoring and subscriptions
- `subscriptions` — Free/Pro/Premium plan and payment history
- `usages` — daily AI request counter per user (for the quota)
- `availabilities` — tutor weekly slots
- `tickets` — help desk tickets with embedded messages
- `forum_posts` — threads with embedded replies, likes, categories
- `groups` — study groups, members, pending join requests
- `progresses` — tutor progress notes on students
- `ratings` — session ratings
- `gmail_tokens` — placeholder for the Gmail Calendar OAuth tokens (flow not fully wired)

Indexes that actually matter: `users.email` unique, `users.cognitoId` unique, `bookings` has a unique compound index on `(tutor, startTime)` so the same tutor cant get double-booked, and `usages` has a unique index on `(userId, date)` so the quota counter is one row per user per day.

## AWS stuff

Everythings in `us-east-2` (Ohio). We picked Ohio early on and just kept putting things there.

### Amplify (frontend)

App id `d1s63qj9hsr1zj`, live at `main.d1s63qj9hsr1zj.amplifyapp.com`. Gives us HTTPS with a valid cert for free which is the main reason we used it. SPA rewrites are configured so deep links like `/student/grades` dont 404.

Two custom rewrite rules:

1. `/api/<*>` proxies to `https://d5u6ox7235rfh.cloudfront.net/api/<*>` (status 200). This is how the HTTPS site reaches the HTTP backend without getting blocked by mixed-content.
2. A catchall that sends everything non-file to `/index.html` so React Router can handle routing.

Auto-deploy from GitHub isnt hooked up yet, so every frontend push needs a manual step:

```
cd client && npm run build
cd build && zip -qr /tmp/build.zip .
aws amplify create-deployment --app-id d1s63qj9hsr1zj --branch-name main
# take the zipUploadUrl from that response, curl PUT the zip to it
aws amplify start-deployment --app-id d1s63qj9hsr1zj --branch-name main --job-id <id>
```

### Elastic Beanstalk (backend)

Environment is `i-student-env`, platform is Node.js 22 on Amazon Linux 2023 (6.10.1). The CNAME is `i-student-env.eba-qrqp4xjp.us-east-2.elasticbeanstalk.com`. Single instance, no load balancer. Thats fine for a demo, would need to scale out for real traffic.

Deploys happen with `eb deploy`. `.ebignore` excludes `node_modules`, `client/src`, `client/public`, the uploads folder, etc, but keeps `client/build/` so EB can serve the frontend as a backup if Amplify is ever down.

Env vars that need to be set (via `eb setenv` or the console):

- `MONGODB_URI`
- `AWS_REGION`, `AWS_S3_BUCKET` (`i-student-files`)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (should really be an instance role but were using keys for now)
- `COGNITO_REGION`, `COGNITO_USER_POOL_ID`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY` (optional)
- `DEV_AUTH=1` during demos, has to be removed before real launch

### CloudFront (HTTPS shim)

EBs default domain only speaks HTTP. Amplify wont proxy from HTTPS to HTTP (mixed content blocked). So CloudFront sits in the middle, terminating HTTPS with the default `*.cloudfront.net` cert and talking to EB over HTTP internally.

- Distribution: `EIXPRYSOA1021`
- Domain: `d5u6ox7235rfh.cloudfront.net`
- Cache policy: `Managed-CachingDisabled` — we dont want API responses cached ever
- Origin request policy: `Managed-AllViewer` — forwards Authorization headers, query strings, cookies

If you ever change the CloudFront config, make sure the origin request policy still forwards Authorization or every authenticated request will 401.

### S3

Bucket is `i-student-files`, us-east-2, private. Objects are keyed `uploads/<cognitoId>/<timestamp>-<random>.<ext>`. The backend generates 15-minute presigned URLs for downloads so the browser can fetch files directly without proxying through the API.

Multer validates the MIME type and caps uploads at 100 MB. PDFs, Word, plain text, and common audio/video formats are accepted.

### Cognito

User pool `us-east-2_baWOWMykv`. Amplify handles sign up, confirm (email code), sign in, and fetching the ID token. The backend verifies the JWT by:

1. Reading the `kid` from the token header
2. Fetching the matching public key from Cognitos JWKS endpoint (jwks-rsa caches it)
3. Verifying the signature and checking the `iss` claim matches our pool URL

Roles live on the Mongo User record, not as Cognito custom attributes. First time a new user hits `/api/auth/me`, we create their Mongo record with whatever role they picked at registration (student or tutor — admin is locked, an existing admin has to grant it from the admin dashboard).

### CI/CD

None. Everythings manual. `eb deploy` for backend, the Amplify script above for frontend. At some point we should hook Amplify to the GitHub repo, just havent done it.

## AI

Gemini 2.5 Flash is the one doing the work. Free tier is generous enough (15 requests per minute, 1M input tokens per day) for a class project. Set `GEMINI_API_KEY` in the EB env.

Fallback order in each service file:

1. Gemini
2. Bedrock Claude (doesnt work, account doesnt have access)
3. OpenAI (only if OPENAI_API_KEY is set)
4. Dumb sentence splitter (last resort)

AI endpoints go through the `aiQuota` middleware which counts per-user per-day requests in the `usages` collection. Limits by subscription plan:

- Free: 5 per day
- Pro: 100 per day
- Premium: unlimited (skips tracking)

When a Free user hits their limit, the API returns 402 and the frontend pops the upgrade modal.

## Running it locally

```
npm install
cd client && npm install && cd ..
cp .env.example .env
# fill in MONGODB_URI, AWS keys, COGNITO_*, GEMINI_API_KEY

# Backend on port 5001
DEV_AUTH=1 npm run dev

# Frontend on port 3000
cd client && npm start
```

Then open `http://localhost:3000/dev-login` and pick a role. That skips Cognito so you dont have to register and verify every time you clear your browser.

Demo data:

```
node server/scripts/seed.js
```

Will upsert 6 tutors, 5 students, 1 admin, plus bookings, forum posts, tickets, flashcards, and calendar events. Run it against whatever Mongo your `.env` points to.

## URLs

- Live (https): https://main.d1s63qj9hsr1zj.amplifyapp.com
- Backup direct to EB (http): http://i-student-env.eba-qrqp4xjp.us-east-2.elasticbeanstalk.com
- API over HTTPS: https://d5u6ox7235rfh.cloudfront.net/api
- GitHub: https://github.com/shawtes/I-student

## Stuff thats half-done

- Gmail Calendar OAuth — token storage is there, actual consent flow isnt wired up, so we just use the internal calendar
- Real-time transcription — uses Whisper via OpenAI but no WebSocket streaming, so its batch only
- Amplify auto-deploy from GitHub isnt connected
- EB is single-instance, no autoscaling. Fine for a class demo, not for real users
- `DEV_AUTH=1` is turned on in prod right now for the demo. Has to be turned off (`eb setenv DEV_AUTH=`) before the site is real
- The Bedrock integration is written but our AWS account doesnt have Bedrock access, so that path never executes
