import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "store.json");
const DIST_DIR = path.resolve(__dirname, "..", "dist");
const PORT = Number(process.env.PORT ?? 4000);
const AUTH_TOKEN = "demo-driver-token";
const DEMO_ROUTE_ID = "route-demo-1";
const DEMO_ROUTE_POINTS = [
  {
    id: "point-demo-a",
    name: "A punkt",
    lat: 41.311081,
    lng: 69.240562,
    radius: 250,
  },
  {
    id: "point-demo-b",
    name: "B punkt",
    lat: 41.32361,
    lng: 69.28012,
    radius: 250,
  },
];

const app = express();

app.use(cors());
app.use(express.json());

let writeQueue = Promise.resolve();

async function readStore() {
  const raw = await readFile(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

function writeStore(nextStore) {
  writeQueue = writeQueue.then(() =>
    writeFile(DATA_FILE, `${JSON.stringify(nextStore, null, 2)}\n`, "utf8"),
  );
  return writeQueue;
}

function normalizePhone(phone) {
  return String(phone ?? "").trim();
}

function getDemoRoute(store) {
  return {
    id: DEMO_ROUTE_ID,
    name: `${store.dashboard.route.from} - ${store.dashboard.route.to}`,
    price: store.payments.nextAmount,
    points: DEMO_ROUTE_POINTS.map((point, index) => ({
      ...point,
      name:
        index === 0
          ? store.dashboard.route.from
          : index === 1
            ? store.dashboard.route.to
            : point.name,
    })),
  };
}

function getPointById(store, pointId) {
  const route = getDemoRoute(store);
  return route.points.find((point) => point.id === pointId) ?? route.points[0];
}

function normalizeQueueEntries(entries) {
  return entries.map((entry, index) => ({
    ...entry,
    pos: index + 1,
    isYou: entry.id === "you",
  }));
}

function ensureQueueShape(store) {
  const userEntry = {
    id: "you",
    name: store.driver.name,
    car: store.driver.car,
    isYou: true,
  };

  const withoutUser = store.queue.entries.filter((entry) => entry.id !== "you");

  if (store.queue.joined) {
    store.queue.entries = [...withoutUser, userEntry];
  } else {
    store.queue.entries = withoutUser;
  }

  store.queue.entries = normalizeQueueEntries(store.queue.entries);
}

function getQueueEntriesForPoint(store, pointId) {
  ensureQueueShape(store);

  const activePointId = store.queue.pointId ?? getDemoRoute(store).points[0].id;
  const entries =
    store.queue.joined && activePointId !== pointId
      ? store.queue.entries.filter((entry) => entry.id !== "you")
      : store.queue.entries;

  return normalizeQueueEntries(entries);
}

function buildDriverProfile(store) {
  const route = getDemoRoute(store);
  return {
    id: String(store.driver.id),
    name: store.driver.name,
    phone: store.driver.phone,
    status: store.driver.status,
    carNumber: store.driver.car,
    cardNumber: store.driver.cardNumber ?? null,
    route,
    location: store.driver.location ?? null,
  };
}

function buildRoutes(store) {
  return [getDemoRoute(store)];
}

function buildQueueSnapshot(store, pointId) {
  const route = getDemoRoute(store);
  const point = getPointById(store, pointId);
  const entries = getQueueEntriesForPoint(store, point.id);

  return {
    point: {
      id: point.id,
      routeId: route.id,
      routeName: route.name,
      name: point.name,
      lat: point.lat,
      lng: point.lng,
      radius: point.radius,
    },
    total: entries.length,
    entries: entries.map((entry) => ({
      queueId:
        entry.id === "you"
          ? `queue-${store.driver.id}`
          : `queue-${point.id}-${entry.id}`,
      driverId: entry.id === "you" ? String(store.driver.id) : String(entry.id),
      driverName: entry.id === "you" ? store.driver.name : entry.name,
      carNumber: entry.id === "you" ? store.driver.car : entry.car,
      position: entry.pos,
      createdAt:
        entry.id === "you"
          ? (store.queue.joinedAt ?? new Date().toISOString())
          : null,
    })),
  };
}

function buildQueuePosition(store) {
  if (!store.queue.joined) {
    return {
      active: false,
    };
  }

  const point = getPointById(
    store,
    store.queue.pointId ?? getDemoRoute(store).points[0].id,
  );
  const entries = getQueueEntriesForPoint(store, point.id);
  const position = entries.find((entry) => entry.id === "you")?.pos ?? null;

  if (position == null) {
    return {
      active: false,
    };
  }

  return {
    active: true,
    queueId: `queue-${store.driver.id}`,
    position,
    point: {
      id: point.id,
      name: point.name,
    },
  };
}

function buildPaymentLink(store) {
  const baseLink = String(store.payments.payLink ?? "").replace(/^https?:\/\//, "");
  const payLink = `https://${baseLink}`;

  return {
    driverId: String(store.driver.id),
    amount: store.payments.nextAmount,
    payLink,
    qrPayload: payLink,
    systems: [...store.payments.methods],
  };
}

function buildPaymentSummary(store) {
  const success = store.payments.transactions.filter(
    (payment) => payment.status === "success",
  ).length;
  const pending = store.payments.transactions.filter(
    (payment) => payment.status === "pending",
  ).length;
  const failed = store.payments.transactions.filter(
    (payment) => payment.status === "failed",
  ).length;
  const totalPaid = store.payments.transactions
    .filter((payment) => payment.status === "success")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return {
    success,
    pending,
    failed,
    totalPaid,
  };
}

function buildState(store) {
  ensureQueueShape(store);

  const activeDrivers = store.dashboard.mapDrivers.filter((driver) =>
    driver.isYou ? store.driver.status === "online" : true,
  ).length;

  const position =
    store.queue.entries.find((entry) => entry.id === "you")?.pos ?? null;

  const totalPaid = store.payments.transactions
    .filter((payment) => payment.status === "success")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const successfulCount = store.payments.transactions.filter(
    (payment) => payment.status === "success",
  ).length;

  const dashboardDrivers = store.dashboard.mapDrivers.map((driver) =>
    driver.isYou
      ? {
          ...driver,
          name: store.driver.name.split(" ")[0],
          color: store.driver.status === "online" ? "#12d18e" : "#ff6b6b",
          status: store.driver.status,
        }
      : driver,
  );

  return {
    driver: store.driver,
    dashboard: {
      route: store.dashboard.route,
      activeDrivers,
      mapDrivers: dashboardDrivers,
    },
    queue: {
      joined: store.queue.joined,
      total: store.queue.entries.length,
      position,
      entries: store.queue.entries,
    },
    queueHistory: store.queueHistory,
    payments: {
      payLink: store.payments.payLink,
      methods: store.payments.methods,
      transactions: [...store.payments.transactions],
      summary: {
        totalPaid,
        successfulCount,
        totalTransactions: store.payments.transactions.length,
        nextAmount: store.payments.nextAmount,
      },
    },
    meta: {
      today: new Date().toISOString(),
    },
  };
}

function requireAuth(request, response, next) {
  const header = request.headers.authorization ?? "";
  const token = header.replace("Bearer ", "").trim();

  if (token !== AUTH_TOKEN) {
    response.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
    return;
  }

  next();
}

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    date: new Date().toISOString(),
  });
});

app.post("/api/auth/send-code", async (request, response) => {
  const phone = normalizePhone(request.body.phone);

  if (phone.length < 7) {
    response.status(400).json({ error: "Telefon raqam notogri kiritildi" });
    return;
  }

  const store = await readStore();
  store.auth.lastPhone = phone;
  store.auth.sessionId = `session-${Date.now()}`;
  await writeStore(store);

  response.json({
    sessionId: store.auth.sessionId,
    demoCode: store.auth.demoCode,
    debugCode: store.auth.demoCode,
    success: true,
    expiresIn: 120,
  });
});

app.post("/api/auth/verify", async (request, response) => {
  const { code, sessionId } = request.body;
  const phone = normalizePhone(request.body.phone);
  const store = await readStore();

  if (sessionId !== store.auth.sessionId) {
    response.status(400).json({ error: "Sessiya muddati tugagan. Qayta urinib koring" });
    return;
  }

  if (String(code) !== String(store.auth.demoCode)) {
    response.status(400).json({ error: "SMS kodi notogri" });
    return;
  }

  if (phone) {
    store.driver.phone = phone;
  }

  await writeStore(store);

  response.json({
    token: AUTH_TOKEN,
    appState: buildState(store),
  });
});

app.post("/api/auth/verify-code", async (request, response) => {
  const { code, sessionId } = request.body;
  const phone = normalizePhone(request.body.phone);
  const store = await readStore();

  if (sessionId && sessionId !== store.auth.sessionId) {
    response
      .status(400)
      .json({ error: "Sessiya muddati tugagan. Qayta urinib koring" });
    return;
  }

  if (String(code) !== String(store.auth.demoCode)) {
    response.status(400).json({ error: "SMS kodi notogri" });
    return;
  }

  if (phone) {
    store.driver.phone = phone;
  }

  await writeStore(store);

  response.json({
    accessToken: AUTH_TOKEN,
    driver: buildDriverProfile(store),
  });
});

app.get("/api/app-state", requireAuth, async (_request, response) => {
  const store = await readStore();
  response.json(buildState(store));
});

app.get("/api/drivers/me", requireAuth, async (_request, response) => {
  const store = await readStore();
  response.json(buildDriverProfile(store));
});

app.patch("/api/driver/status", requireAuth, async (request, response) => {
  const { status } = request.body;

  if (!["online", "offline"].includes(status)) {
    response.status(400).json({ error: "Status online yoki offline bolishi kerak" });
    return;
  }

  const store = await readStore();
  store.driver.status = status;
  await writeStore(store);
  response.json(buildState(store));
});

app.patch("/api/drivers/status", requireAuth, async (request, response) => {
  const { status } = request.body;

  if (!["online", "offline"].includes(status)) {
    response.status(400).json({ error: "Status online yoki offline bolishi kerak" });
    return;
  }

  const store = await readStore();
  store.driver.status = status;
  await writeStore(store);
  response.json(buildDriverProfile(store));
});

app.patch("/api/driver/profile", requireAuth, async (request, response) => {
  const store = await readStore();
  const { name, phone, car } = request.body;

  if (typeof name === "string" && name.trim()) {
    store.driver.name = name.trim();
  }

  if (typeof phone === "string" && phone.trim()) {
    store.driver.phone = phone.trim();
  }

  if (typeof car === "string" && car.trim()) {
    store.driver.car = car.trim().toUpperCase();
  }

  ensureQueueShape(store);
  await writeStore(store);
  response.json(buildState(store));
});

app.patch("/api/drivers/me", requireAuth, async (request, response) => {
  const store = await readStore();
  const { name, phone, carNumber, cardNumber } = request.body;

  if (typeof name === "string" && name.trim()) {
    store.driver.name = name.trim();
  }

  if (typeof phone === "string" && phone.trim()) {
    store.driver.phone = phone.trim();
  }

  if (typeof carNumber === "string" && carNumber.trim()) {
    store.driver.car = carNumber.trim().toUpperCase();
  }

  if (typeof cardNumber === "string" && cardNumber.trim()) {
    store.driver.cardNumber = cardNumber.trim();
  }

  ensureQueueShape(store);
  await writeStore(store);
  response.json(buildDriverProfile(store));
});

app.get("/api/routes", requireAuth, async (_request, response) => {
  const store = await readStore();
  response.json(buildRoutes(store));
});

app.post("/api/locations", requireAuth, async (request, response) => {
  const lat = Number(request.body.lat);
  const lng = Number(request.body.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    response.status(400).json({ error: "Lat va lng son bo'lishi kerak" });
    return;
  }

  const store = await readStore();
  store.driver.location = {
    lat,
    lng,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
  response.json(store.driver.location);
});

app.post("/api/queue/join", requireAuth, async (_request, response) => {
  const store = await readStore();

  if (!store.queue.joined) {
    store.queue.joined = true;
    store.queueHistory.unshift({
      time: new Date().toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      point: store.dashboard.route.from,
      pos: store.queue.entries.length + 1,
      duration: "Yangi navbat",
      date: new Date().toISOString(),
    });
  }

  ensureQueueShape(store);
  await writeStore(store);
  response.json(buildState(store));
});

app.post("/api/queues/join", requireAuth, async (request, response) => {
  const store = await readStore();
  const point = getPointById(
    store,
    String(request.body.pointId ?? store.queue.pointId ?? ""),
  );

  if (!point) {
    response.status(400).json({ error: "Punkt topilmadi" });
    return;
  }

  if (!store.queue.joined) {
    store.queue.joined = true;
    store.queue.pointId = point.id;
    store.queue.joinedAt = new Date().toISOString();
    store.queueHistory.unshift({
      time: new Date().toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      point: point.name,
      pos: store.queue.entries.length + 1,
      duration: "Yangi navbat",
      date: new Date().toISOString(),
    });
  }

  ensureQueueShape(store);
  await writeStore(store);

  response.json({
    queueId: `queue-${store.driver.id}`,
    pointId: point.id,
    position: store.queue.entries.find((entry) => entry.id === "you")?.pos ?? null,
    distanceMeters: 0,
  });
});

app.post("/api/queue/leave", requireAuth, async (_request, response) => {
  const store = await readStore();
  store.queue.joined = false;
  ensureQueueShape(store);
  await writeStore(store);
  response.json(buildState(store));
});

app.post("/api/queues/leave", requireAuth, async (_request, response) => {
  const store = await readStore();
  store.queue.joined = false;
  store.queue.pointId = null;
  ensureQueueShape(store);
  await writeStore(store);
  response.json({
    success: true,
  });
});

app.get("/api/queues/point/:pointId", requireAuth, async (request, response) => {
  const store = await readStore();
  const point = getPointById(store, String(request.params.pointId));
  response.json(buildQueueSnapshot(store, point.id));
});

app.get("/api/queues/my-position", requireAuth, async (_request, response) => {
  const store = await readStore();
  response.json(buildQueuePosition(store));
});

app.post("/api/payments/simulate", requireAuth, async (request, response) => {
  const store = await readStore();
  const via = String(request.body.via ?? store.payments.methods[0]);
  const createdAt = new Date().toISOString();

  store.payments.transactions.unshift({
    transactionId: `TXN-${Math.floor(Math.random() * 9000) + 1000}`,
    amount: store.payments.nextAmount,
    via,
    status: "success",
    time: new Date().toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    createdAt,
  });

  await writeStore(store);
  response.json(buildState(store));
});

app.get("/api/payments/driver-link", requireAuth, async (_request, response) => {
  const store = await readStore();
  response.json(buildPaymentLink(store));
});

app.get("/api/payments/summary", requireAuth, async (_request, response) => {
  const store = await readStore();
  response.json(buildPaymentSummary(store));
});

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Damastic backend listening on http://localhost:${PORT}`);
});
