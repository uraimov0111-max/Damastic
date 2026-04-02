# Production Setup

## Backend

Production backend lives in [apps/backend](d:/Backend dasturlash/Damastic/apps/backend/package.json).

### Local run

1. `docker compose up -d postgres`
2. `cd apps/backend`
3. `copy .env.example .env`
4. `npm install`
5. `npx prisma generate`
6. `npx prisma db push`
7. `npm run prisma:seed`
8. `npm run start:dev`

### Health check

- `GET http://localhost:4000/api/health`

### Important modules

- auth
- drivers
- routes
- locations
- queues
- payments
- realtime

## Mobile

Flutter CLI is not installed in this environment, so mobile app build could not be verified locally.
Recommended app folder: [apps/mobile](d:/Backend dasturlash/Damastic/apps/mobile).
