# Drift

A full-stack Discord clone built with Node.js, Express, PostgreSQL, and Socket.IO supporting real-time text chat, voice/video/screenshare, presence, and direct messages.

## Features

- **Auth** - email/password signup with OTP email verification, refresh token rotation, password reset via OTP, Google OAuth (with account linking by email), disposable email domain blocking
- **Servers & Channels** - create servers, text/voice channels, role-based membership (owner/admin/member)
- **Real-time messaging** - Socket.IO powered chat, typing indicators, presence tracking
- **Direct messages** - 1:1 and group conversations
- **Voice & video** - LiveKit-powered voice channels, video, and screenshare, with moderation controls and a connection latency system
- **File uploads** - avatars and message attachments via AWS S3 (presigned URLs)
- **Security** - Helmet, CORS lockdown, per-route rate limiting, structured request logging (Pino)

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + Express |
| Database | PostgreSQL + Prisma ORM (`v6.19.0`, pinned see [Notes](#notes) below) |
| Real-time | Socket.IO |
| Voice/Video | LiveKit |
| File storage | AWS S3 |
| Email | Resend (OTP + password reset) |
| Validation | Zod |
| Logging | Pino + Pino-HTTP |
| CI | GitHub Actions |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (local or hosted, e.g. AWS RDS)
- A [LiveKit](https://livekit.io/) project (Cloud free tier or self-hosted)
- An [AWS S3](https://aws.amazon.com/s3/) bucket + IAM credentials
- A [Resend](https://resend.com/) account for transactional email
- A [Google Cloud OAuth Client ID](https://console.cloud.google.com/apis/credentials) for Google sign-in

### Installation

```bash
git clone https://github.com/Sumeet-Y1/Drift.git
cd Drift
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign access tokens |
| `PORT` | Port the server listens on (default `4000`) |
| `LIVEKIT_URL` | LiveKit server/project URL |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key (S3 access) |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `AWS_REGION` | AWS region for the S3 bucket |
| `S3_BUCKET_NAME` | S3 bucket name for uploads |
| `RESEND_API_KEY` | Resend API key for OTP/reset emails |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `FRONTEND_URL` | Comma-separated allowed CORS origins |

> **Note:** In Resend's sandbox mode (no verified custom domain), emails can only be sent to the address used to sign up for Resend. Verify a domain in Resend before real users can receive OTP emails.

### Database Setup

```bash
npx prisma generate
npx prisma migrate dev
```

### Running Locally

```bash
npm run dev
```

Server starts at `http://localhost:4000` (or your configured `PORT`). Health check: `GET /health`.

## Project Structure

```
drift/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/          # DB, S3, logger config
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Error handler, rate limiter
│   ├── routes/            # Express routers
│   ├── services/          # Business logic (auth, email, voice, etc.)
│   ├── sockets/            # Socket.IO event handlers
│   ├── utils/               # Helpers (hashing, tokens, OTP)
│   ├── validators/          # Zod schemas
│   └── app.js               # Express app setup
├── server.js                 # HTTP + Socket.IO server entry point
└── .github/workflows/ci.yml   # CI pipeline
```

## API Overview

All routes are prefixed with `/api`.

| Route group | Base path |
|---|---|
| Auth | `/api/auth` |
| Servers | `/api/servers` |
| Channels | `/api/channels` |
| Conversations (DMs) | `/api/conversations` |
| Voice | `/api/voice` |
| Uploads | `/api/uploads` |
| Users | `/api/users` |
| Webhooks (LiveKit) | `/api/webhooks` |

### Auth endpoints

- `POST /api/auth/signup/request-otp` - request a signup OTP (blocks disposable email domains)
- `POST /api/auth/signup/verify-otp` -verify OTP, create account, issue tokens
- `POST /api/auth/login` - email/password login
- `POST /api/auth/google` - Google OAuth sign-in (links to existing account by email if matched)
- `POST /api/auth/refresh` - refresh an access token
- `POST /api/auth/logout` - revoke a refresh token
- `POST /api/auth/password-reset/request` - request a password reset OTP (enumeration-safe response)
- `POST /api/auth/password-reset/confirm` - confirm reset with OTP + new password (revokes all existing refresh tokens)

## Testing

Testing is currently done manually via PowerShell `Invoke-RestMethod` (Windows dev environment) rather than an automated test suite. A `test` script placeholder exists in `package.json` but no test framework is wired in yet.

For WebSocket/Socket.IO testing, small throwaway Node scripts using `socket.io-client` are used, since standard HTTP tools can't hold a persistent WebSocket connection.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `main`:

1. Spins up a disposable Postgres service container
2. Installs dependencies (`npm ci`)
3. Generates the Prisma client and runs `prisma migrate deploy` against the test DB
4. Boots the server and hits `/health` as a smoke test

Dummy environment variable values are used in CI for third-party services (Resend, Google, LiveKit, AWS) since these SDK clients are instantiated at module load time but aren't exercised by the smoke test.

**Deployment (EC2) is not yet wired into the pipeline** CI currently validates builds only. Planned: PM2 for process management, real secrets via GitHub Actions Secrets, and an SSH-based deploy step.

## Deployment (Planned / In Progress)

Target: AWS EC2 (t3.medium) + RDS (Postgres) + S3, already provisioned.

Remaining work:
- [ ] Install and configure PM2 on EC2 for process management (auto-restart, boot persistence)
- [ ] Configure production environment variables on the instance (never committed to git)
- [ ] Run `npx prisma migrate deploy` (not `migrate dev`) against production RDS
- [ ] Optionally place Nginx in front as a reverse proxy for port 80/443 + future SSL
- [ ] Extend `ci.yml` with an SSH deploy step, using GitHub Actions Secrets for real credentials

LiveKit currently runs on the free Cloud tier. Self-hosting on EC2 was evaluated and deferred for a project with low/sporadic testing traffic, an always-on EC2 instance plus bandwidth costs would likely exceed LiveKit Cloud's free-tier limits.

## Notes

- **Prisma is pinned to `v6.19.0`** deliberately. Do not upgrade to Prisma 7 it requires ESM + driver adapters, which this project intentionally avoids for simplicity. The "update available" notice after migrations can be ignored.
- **Known gap:** the global error handler currently returns `500` for Zod validation errors instead of `400`. This is pre-existing and affects all validators uniformly not yet fixed, low priority.
- **Windows development note:** file writes should avoid `Set-Content -Encoding utf8`, which adds a BOM that breaks Prisma's schema parser. Use UTF-8 without BOM instead.

## License

ISC