const TOKEN_KEY = "damastic-admin-token";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function normalizeError(payload) {
  if (Array.isArray(payload?.message)) {
    return payload.message.join(", ");
  }

  if (typeof payload?.message === "string") {
    return payload.message;
  }

  if (typeof payload?.error === "string") {
    return payload.error;
  }

  return "Server xatosi yuz berdi";
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    API_BASE_URL ? `${API_BASE_URL}${path}` : path,
    {
    ...options,
    headers,
    },
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(normalizeError(payload));
  }

  return payload;
}

export const authStorage = {
  getToken,
  setToken,
  clearToken,
};

export const adminApi = {
  auth: {
    login(email, password) {
      return request("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    me() {
      return request("/api/admin/auth/me");
    },
  },
  super: {
    overview() {
      return request("/api/admin/super/overview");
    },
    alliances() {
      return request("/api/admin/super/alliances");
    },
    createAlliance(payload) {
      return request("/api/admin/super/alliances", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },
  alliance: {
    dashboard() {
      return request("/api/admin/alliance/dashboard");
    },
    drivers() {
      return request("/api/admin/alliance/drivers");
    },
    createDriver(payload) {
      return request("/api/admin/alliance/drivers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    vehicles() {
      return request("/api/admin/alliance/vehicles");
    },
    createVehicle(payload) {
      return request("/api/admin/alliance/vehicles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    routes() {
      return request("/api/admin/alliance/routes");
    },
    createRoute(payload) {
      return request("/api/admin/alliance/routes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    liveQueues() {
      return request("/api/admin/alliance/queues/live");
    },
    payments() {
      return request("/api/admin/alliance/payments");
    },
    cashEntries() {
      return request("/api/admin/alliance/cash-entries");
    },
  },
};
