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

  store.queue.entries = store.queue.entries.map((entry, index) => ({
    ...entry,
    pos: index + 1,
    isYou: entry.id === "you",
  }));
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

app.get("/api/app-state", requireAuth, async (_request, response) => {
  const store = await readStore();
  response.json(buildState(store));
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

app.post("/api/queue/leave", requireAuth, async (_request, response) => {
  const store = await readStore();
  store.queue.joined = false;
  ensureQueueShape(store);
  await writeStore(store);
  response.json(buildState(store));
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

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Damastic backend listening on http://localhost:${PORT}`);
});
