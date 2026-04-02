# Damastic Target Architecture

## Maqsad

Ushbu hujjat `Damastic` loyihasining demo ko'rinishidan production arxitekturaga o'tish uchun target modelni belgilaydi. Hujjat quyidagi stack va biznes talablariga mos yozilgan:

- Mobile app: `Flutter`
- Backend: `Node.js + NestJS`
- Realtime: `Socket.io`
- Database: `PostgreSQL`
- Map: `Google Maps SDK`
- Payment: `Click` va `Payme`
- Hosting: `AWS`, `DigitalOcean` yoki `VPS`

Bu hujjat hozirgi repodagi `React + Express + JSON file` demo bilan aralashmasligi kerak. Bu alohida target arxitektura fayli hisoblanadi.

---

## 1. Tizim arxitekturasi

```text
Driver Mobile App (Flutter)
        |
        | HTTPS REST API
        v
Backend API (NestJS)
        |
  +-----+-------------------------+
  |                               |
  v                               v
PostgreSQL                  Socket.io Gateway
  |                               |
  +-----------+-------------------+
              |
              v
      Payment Integrations
        Click / Payme
```

### Asosiy qismlar

1. `Driver Mobile App`
- haydovchi login qiladi
- ishga chiqadi yoki uyga qaytadi
- navbat oladi
- xaritada boshqa damaslarni ko'radi
- QR ko'rsatadi

2. `Backend API`
- auth
- navbat boshqaruvi
- GPS tekshiruvi
- geofence radius nazorati
- to'lovlarni qayd qilish
- realtime event publish

3. `PostgreSQL`
- barcha persistent ma'lumotlar shu yerda saqlanadi

4. `Socket.io Gateway`
- damaslar lokatsiyasi
- punktdagi navbat holati
- online/offline status

---

## 2. Tavsiya etilgan repository tuzilmasi

```text
damastic/
├─ apps/
│  ├─ mobile/                # Flutter app
│  └─ backend/               # NestJS app
├─ packages/
│  ├─ shared-types/          # DTO, enums, socket event types
│  └─ config/                # common env helpers
├─ infra/
│  ├─ docker/
│  ├─ nginx/
│  └─ sql/
├─ docs/
│  ├─ api/
│  ├─ db/
│  └─ realtime/
├─ .env.example
└─ README.md
```

### Backend ichki struktura

```text
apps/backend/src/
├─ main.ts
├─ app.module.ts
├─ common/
│  ├─ guards/
│  ├─ interceptors/
│  ├─ filters/
│  ├─ decorators/
│  └─ utils/
├─ config/
├─ database/
│  ├─ prisma/ yoki typeorm/
│  ├─ migrations/
│  └─ seeds/
├─ modules/
│  ├─ auth/
│  ├─ drivers/
│  ├─ routes/
│  ├─ route-points/
│  ├─ queues/
│  ├─ locations/
│  ├─ payments/
│  ├─ realtime/
│  └─ health/
└─ integrations/
   ├─ click/
   ├─ payme/
   └─ maps/
```

---

## 3. Functional modullar

## 3.1 Auth Module

Mas'uliyat:
- telefon raqam bo'yicha login
- SMS kod yuborish
- kodni verifikatsiya qilish
- JWT access token qaytarish

Endpointlar:
- `POST /auth/send-code`
- `POST /auth/verify-code`
- `POST /auth/refresh`
- `POST /auth/logout`

Texnik talab:
- SMS provider integratsiyasi
- rate limit
- device binding

---

## 3.2 Drivers Module

Mas'uliyat:
- haydovchi profili
- status update
- karta raqami
- mashina raqami

Endpointlar:
- `GET /drivers/me`
- `PATCH /drivers/me`
- `PATCH /drivers/status`

Statuslar:
- `offline`
- `online`

---

## 3.3 Routes Module

Mas'uliyat:
- marshrutlar ro'yxati
- marshrut narxi
- marshrut punktlari

Endpointlar:
- `GET /routes`
- `GET /routes/:id`
- `GET /routes/:id/points`

---

## 3.4 Locations Module

Mas'uliyat:
- haydovchi GPS lokatsiyasini qabul qilish
- oxirgi lokatsiyani saqlash
- realtime marker update yuborish

Endpoint:
- `POST /locations`

Payload:

```json
{
  "lat": 41.3111,
  "lng": 69.2797
}
```

Ishlash qoidasi:
- mobile app har `5 sekund`da lokatsiya yuboradi
- server `driver_locations` ni update qiladi
- `drivers_update` socket event jo'natadi

---

## 3.5 Queues Module

Mas'uliyat:
- punkt navbatini yuritish
- haydovchini navbatga qo'shish
- navbatdan chiqarish
- position qayta hisoblash

Endpointlar:
- `POST /queues/join`
- `POST /queues/leave`
- `GET /queues/point/:pointId`
- `GET /queues/my-position`

### Navbat algoritmi

Haydovchi `Navbat olish` tugmasini bosganda:

1. Driver oxirgi GPS lokatsiyasi olinadi
2. Punkt koordinatasi olinadi
3. Masofa hisoblanadi
4. Agar `distance <= radius` bo'lsa navbatga qo'shiladi
5. `position = max(position) + 1`
6. DB ga yoziladi
7. Socket orqali navbat update yuboriladi

Masofa formulasi:
- `Haversine` formula yoki Google distance helper

Pseudo flow:

```ts
const location = await locationsService.getLastLocation(driverId);
const point = await routePointsService.findById(pointId);
const distance = calculateDistance(location, point);

if (distance > point.radius) {
  throw new BadRequestException("Driver punkt radiusidan tashqarida");
}

const lastPosition = await queuesRepo.findLastPosition(pointId);
const position = (lastPosition ?? 0) + 1;

await queuesRepo.create({
  driverId,
  pointId,
  position,
});
```

---

## 3.6 Payments Module

Mas'uliyat:
- payment link yaratish
- QR payload hosil qilish
- Click/Payme callback qabul qilish
- transaction status saqlash

Endpointlar:
- `GET /payments/driver-link`
- `POST /payments/click/callback`
- `POST /payments/payme/callback`
- `GET /payments/history`

### QR ishlash oqimi

1. haydovchiga unique link biriktiriladi
2. masalan `pay.damastic.uz/driver/:driverId`
3. QR shu link asosida generatsiya qilinadi
4. yo'lovchi QR ni scan qiladi
5. payment page ochiladi
6. `Click` yoki `Payme` tanlanadi
7. to'lov bo'lsa callback backendga keladi
8. backend `payments` jadvalini update qiladi

### To'lov strategiyasi

Variant 1:
- to'g'ridan-to'g'ri haydovchi kartasiga

Variant 2:
- platform account ga tushadi
- keyin settlement qilinadi

Production uchun tavsiya:
- avval `platform settlement` modeli
- audit va reconciliation osonroq

---

## 3.7 Realtime Module

Texnologiya:
- `Socket.io`

Mas'uliyat:
- online driverlar ro'yxati
- live GPS markerlar
- punkt navbat update
- payment status update

Socket eventlar:

Client subscribe:
- `drivers:subscribe`
- `queue:subscribe`

Server emit:
- `drivers:update`
- `queue:update`
- `driver:status`
- `payment:update`

Misol payload:

```json
{
  "driverId": 12,
  "name": "Ulugbek",
  "lat": 41.3111,
  "lng": 69.2797,
  "status": "online",
  "routeId": 3
}
```

---

## 4. Database modeli

## 4.1 `drivers`

```sql
CREATE TABLE drivers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL UNIQUE,
  car_number VARCHAR(30) NOT NULL UNIQUE,
  card_number VARCHAR(40),
  status VARCHAR(20) NOT NULL DEFAULT 'offline',
  route_id BIGINT REFERENCES routes(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

`status`:
- `offline`
- `online`

## 4.2 `routes`

```sql
CREATE TABLE routes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Misol:
- `33 liniya`
- `272 liniya`

## 4.3 `route_points`

```sql
CREATE TABLE route_points (
  id BIGSERIAL PRIMARY KEY,
  route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  radius INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Misol:
- `A punkt`
- `B punkt`
- `C punkt`

`radius`:
- metrda saqlanadi
- default `50`

## 4.4 `queues`

```sql
CREATE TABLE queues (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  point_id BIGINT NOT NULL REFERENCES route_points(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP NULL
);
```

`status`:
- `active`
- `left`
- `served`

Qo'shimcha constraint:

```sql
CREATE UNIQUE INDEX uniq_active_queue_per_driver
ON queues(driver_id)
WHERE status = 'active';
```

## 4.5 `driver_locations`

```sql
CREATE TABLE driver_locations (
  driver_id BIGINT PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 4.6 `payments`

```sql
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_system VARCHAR(20) NOT NULL,
  external_transaction_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

`status`:
- `pending`
- `success`
- `failed`

`payment_system`:
- `click`
- `payme`

---

## 5. API kontraktlari

## Auth

### `POST /auth/send-code`

```json
{
  "phone": "+998901234567"
}
```

### `POST /auth/verify-code`

```json
{
  "phone": "+998901234567",
  "code": "1234"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "driver": {
    "id": 1,
    "name": "Ulugbek"
  }
}
```

## Driver status

### `PATCH /drivers/status`

```json
{
  "status": "online"
}
```

## Location update

### `POST /locations`

```json
{
  "lat": 41.3111,
  "lng": 69.2797
}
```

## Queue join

### `POST /queues/join`

```json
{
  "pointId": 10
}
```

Response:

```json
{
  "queueId": 99,
  "position": 4,
  "pointId": 10
}
```

## Queue leave

### `POST /queues/leave`

```json
{
  "pointId": 10
}
```

## Payment link

### `GET /payments/driver-link`

Response:

```json
{
  "driverId": 12,
  "amount": 5000,
  "payLink": "https://pay.damastic.uz/driver/12",
  "qrPayload": "https://pay.damastic.uz/driver/12"
}
```

---

## 6. Flutter mobile UX

## 6.1 Login
- telefon raqam
- SMS kod

## 6.2 Main screen
- `ISHDA <-> UYDA`
- Google Maps view
- `A punkt`, `B punkt`
- markerlar
- `NAVBAT OLISH`
- `QR KO'RSATISH`

## 6.3 Queue screen
- punkt navbati
- joriy position
- navbatga kirish/chiqish

## 6.4 QR screen
- QR code
- `5000 so'm`
- `SCAN QILING`

## 6.5 Profile screen
- haydovchi ma'lumotlari
- mashina raqami
- karta raqami
- payment history

---

## 7. Business qoidalar

1. Haydovchi `offline` bo'lsa:
- navbat ola olmaydi
- lokatsiya realtime publish qilinmaydi

2. Haydovchi bir vaqtda faqat bitta aktiv navbatda bo'lishi mumkin

3. Haydovchi faqat o'z marshrutidagi punktga navbat ola oladi

4. GPS bo'yicha punkt radiusidan tashqarida bo'lsa:
- navbatga qo'shilmaydi

5. To'lov `success` bo'lmaguncha income hisoblanmaydi

---

## 8. Realtime oqim

### Driver online bo'lganda
- mobile `PATCH /drivers/status`
- socket room ga ulanadi
- location update boshlaydi

### Location update bo'lganda
- `POST /locations`
- DB update
- `drivers:update` emit

### Queue join bo'lganda
- `POST /queues/join`
- DB insert
- `queue:update` emit

### Payment success bo'lganda
- payment callback keladi
- `payments.status = success`
- `payment:update` emit

---

## 9. Integratsiyalar

## 9.1 SMS provider
- Eskiz
- Play Mobile
- boshqa local SMS gateway

## 9.2 Maps
- `Google Maps SDK`
- Flutter map markers
- geofence radius circle

## 9.3 Payment
- `Click Merchant API`
- `Payme Merchant API`

Majburiy:
- callback sign tekshiruvi
- transaction deduplication
- audit log

---

## 10. Deployment

Minimal production:

- `1 VPS`
- `Docker`
- `Nginx`
- `NestJS backend`
- `PostgreSQL`
- `Redis` ixtiyoriy

Tavsiya:

- `AWS EC2` yoki `DigitalOcean Droplet`
- `Managed PostgreSQL`
- `S3` log/backups
- `PM2` yoki Docker Compose

---

## 11. Environment variables

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/damastic
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d

SMS_PROVIDER=eskiz
SMS_API_URL=
SMS_API_KEY=

CLICK_SERVICE_ID=
CLICK_MERCHANT_ID=
CLICK_SECRET_KEY=

PAYME_MERCHANT_ID=
PAYME_SECRET_KEY=

GOOGLE_MAPS_API_KEY=

CLIENT_APP_URL=
PAYMENT_BASE_URL=https://pay.damastic.uz
```

---

## 12. Demo va target arxitektura o'rtasidagi farq

Hozirgi repo ichidagi demo:
- `React + Vite`
- `Express`
- `JSON file storage`
- realtime yo'q
- PostgreSQL yo'q
- NestJS yo'q
- GPS radius check yo'q
- payment callback yo'q

Target arxitektura:
- `Flutter`
- `NestJS`
- `PostgreSQL`
- `Socket.io`
- `Google Maps SDK`
- `Click/Payme integration`
- geofence queue logic

---

## 13. Qisqa implementatsiya roadmap

1. `apps/backend` ichida NestJS yaratish
2. PostgreSQL schema va migration yozish
3. JWT auth + SMS verify
4. Drivers, Routes, RoutePoints modullari
5. Locations endpoint + socket gateway
6. Queue geofence logic
7. Payment link + Click/Payme callback
8. Flutter app skeleton
9. Google Maps va realtime markerlar
10. production deploy

---

## 14. Yakuniy qaror

Damastic production versiyasi uchun to'g'ri arxitektura:

- frontend web demo emas, `Flutter mobile app`
- oddiy `Express` emas, `NestJS modular backend`
- `JSON file` emas, `PostgreSQL`
- polling emas, `Socket.io realtime`
- fake payment emas, `Click/Payme callback`
- statik SVG map emas, `Google Maps SDK`

Bu hujjat shu target modelni repository ichida alohida fayl sifatida saqlash uchun yaratildi.
