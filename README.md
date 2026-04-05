# Damastic

Damastic is a driver platform prototype and production foundation for route-based `Damas` transport management.

Repository currently contains two layers:

- a working web demo built with `React + Vite`
- a production-oriented backend foundation built with `NestJS + Prisma + PostgreSQL + Socket.io`

The target architecture is documented in [DAMASTIC_TARGET_ARCHITECTURE.md](d:/Backend dasturlash/Damastic/DAMASTIC_TARGET_ARCHITECTURE.md#L1).

## What is included

### 1. Web demo

The demo app is useful for UI validation and flow prototyping.

Location:
- [src/App.jsx](d:/Backend dasturlash/Damastic/src/App.jsx)
- [src/api.js](d:/Backend dasturlash/Damastic/src/api.js)
- [backend/server.js](d:/Backend dasturlash/Damastic/backend/server.js)

Capabilities:
- login demo
- main dashboard
- queue screen
- QR screen
- profile screen

### 2. Production backend foundation

The production-ready backend foundation lives under:
- [apps/backend](d:/Backend dasturlash/Damastic/apps/backend/package.json)

Important entry points:
- bootstrap: [apps/backend/src/main.ts](d:/Backend dasturlash/Damastic/apps/backend/src/main.ts#L7)
- root module: [apps/backend/src/app.module.ts](d:/Backend dasturlash/Damastic/apps/backend/src/app.module.ts#L30)
- database schema: [apps/backend/prisma/schema.prisma](d:/Backend dasturlash/Damastic/apps/backend/prisma/schema.prisma#L32)
- queue logic: [apps/backend/src/modules/queues/queues.service.ts](d:/Backend dasturlash/Damastic/apps/backend/src/modules/queues/queues.service.ts#L41)
- payment logic: [apps/backend/src/modules/payments/payments.service.ts](d:/Backend dasturlash/Damastic/apps/backend/src/modules/payments/payments.service.ts#L62)
- realtime gateway: [apps/backend/src/modules/realtime/realtime.gateway.ts](d:/Backend dasturlash/Damastic/apps/backend/src/modules/realtime/realtime.gateway.ts#L15)

Backend modules:
- auth
- drivers
- routes
- locations
- queues
- payments
- realtime
- health

### 3. Flutter mobile client

The mobile structure is prepared under:
- [apps/mobile](d:/Backend dasturlash/Damastic/apps/mobile/README.md)

Key files:
- [apps/mobile/pubspec.yaml](d:/Backend dasturlash/Damastic/apps/mobile/pubspec.yaml)
- [apps/mobile/lib/main.dart](d:/Backend dasturlash/Damastic/apps/mobile/lib/main.dart#L5)
- [apps/mobile/lib/features/auth/login_screen.dart](d:/Backend dasturlash/Damastic/apps/mobile/lib/features/auth/login_screen.dart#L4)
- [apps/mobile/lib/features/main/main_screen.dart](d:/Backend dasturlash/Damastic/apps/mobile/lib/features/main/main_screen.dart#L6)

Local development note:
- the root Express demo API now exposes Flutter-compatible REST endpoints on `http://localhost:4000/api`
- realtime socket events remain part of the NestJS production backend foundation under `apps/backend`

## Target stack

- Mobile: `Flutter`
- Backend: `Node.js + NestJS`
- Realtime: `Socket.io`
- Database: `PostgreSQL`
- ORM: `Prisma`
- Maps: `Google Maps SDK`
- Payments: `Click`, `Payme`
- Infra: `Docker`, `VPS / AWS / DigitalOcean`

## Repository structure

```text
Damastic/
|-- apps/
|   |-- backend/         # NestJS production foundation
|   `-- mobile/          # Flutter-ready mobile skeleton
|-- backend/             # old demo Express backend
|-- src/                 # old demo React frontend
|-- docker-compose.yml
|-- DAMASTIC_TARGET_ARCHITECTURE.md
|-- PRODUCTION_SETUP.md
`-- package.json
```

## Quick start

### Web demo

From repo root:

```bash
npm install
npm run build
npm run dev
```

Default ports:
- web: `5173`
- demo API: `4000`

### Flutter mobile local flow

From repo root:

```bash
npm run dev
npm run mobile:doctor
npm run mobile:bootstrap
```

Android emulator:

```bash
cd apps/mobile
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api --dart-define=SOCKET_BASE_URL=http://10.0.2.2:4000/realtime
```

iOS simulator:

```bash
cd apps/mobile
flutter run --dart-define=API_BASE_URL=http://localhost:4000/api --dart-define=SOCKET_BASE_URL=http://localhost:4000/realtime
```

The root demo backend is enough for login, profile, queue, routes and payments REST testing. Full realtime verification still requires the NestJS backend.

### Production backend

Use the guide in [PRODUCTION_SETUP.md](d:/Backend dasturlash/Damastic/PRODUCTION_SETUP.md#L1).

Root helper scripts:

```bash
npm run backend:install
npm run backend:build
npm run backend:db:push
npm run backend:db:seed
npm run backend:dev
```

## Production backend setup

### 1. Install dependencies

```bash
npm run backend:install
```

### 2. Prepare env

Copy:

```bash
apps/backend/.env.example -> apps/backend/.env
```

### 3. Start PostgreSQL

Recommended:

```bash
docker compose up -d postgres
```

### 4. Apply schema and seed

```bash
npm run backend:db:push
npm run backend:db:seed
```

### 5. Start backend

```bash
npm run backend:dev
```

Health endpoint:

```text
GET /api/health
```

## Main API domains

### Auth
- `POST /api/auth/send-code`
- `POST /api/auth/verify-code`

### Drivers
- `GET /api/drivers/me`
- `PATCH /api/drivers/me`
- `PATCH /api/drivers/status`

### Routes
- `GET /api/routes`
- `GET /api/routes/:id`
- `GET /api/routes/:id/points`

### Locations
- `POST /api/locations`

### Queues
- `POST /api/queues/join`
- `POST /api/queues/leave`
- `GET /api/queues/point/:pointId`
- `GET /api/queues/my-position`

### Payments
- `GET /api/payments/driver-link`
- `GET /api/payments/history`
- `GET /api/payments/summary`
- `POST /api/payments/click/callback`
- `POST /api/payments/payme/callback`

## Realtime

Socket namespace:

```text
/realtime
```

Events:
- `drivers:subscribe`
- `queue:subscribe`
- `drivers:update`
- `queue:update`
- `driver:status`
- `payment:update`

## Current status

Completed:
- web demo UI and flows
- production backend foundation
- Prisma schema
- queue geofence service logic
- payment callback foundation
- realtime gateway
- Flutter mobile client codebase
- local demo API adapter for Flutter REST flow
- docker-compose and setup docs

Verified in this environment:
- root web build
- backend TypeScript build
- Prisma schema validation
- Flutter doctor
- mobile wrapper bootstrap
- Flutter analyze
- Flutter test
- git commit and GitHub push

Not fully verified in this environment:
- Android APK build
- iOS build
- Dockerized PostgreSQL runtime
- full production deployment

## Known environment constraints during setup

While preparing this repository:
- `Flutter` CLI is installed and working in this environment
- Android SDK is currently on `C:` with effectively no free space, so NDK installation for Android APK build failed
- Docker Desktop daemon was not fully available
- therefore Android APK packaging and container runtime could not be fully tested here

The codebase is structured so those steps can be completed on a properly configured machine.

## Documentation

- architecture: [DAMASTIC_TARGET_ARCHITECTURE.md](d:/Backend dasturlash/Damastic/DAMASTIC_TARGET_ARCHITECTURE.md#L1)
- setup: [PRODUCTION_SETUP.md](d:/Backend dasturlash/Damastic/PRODUCTION_SETUP.md#L1)

## Next recommended steps

1. Bring up PostgreSQL and run Prisma push/seed.
2. Connect real SMS provider.
3. Implement real Click and Payme signature validation.
4. Free space on the Android SDK drive or move the SDK off `C:` and rerun the mobile Android build.
5. Deploy backend and database to a production host.
