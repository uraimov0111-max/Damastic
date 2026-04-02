const TOKEN_KEY = "damastic-token";

function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error ?? "Server xatosi yuz berdi");
  }

  return payload;
}

export const authStorage = {
  getToken,
  setToken,
  clearToken,
};

export const api = {
  auth: {
    sendCode(phone) {
      return request("/api/auth/send-code", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
    },
    verify({ phone, code, sessionId }) {
      return request("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({ phone, code, sessionId }),
      });
    },
  },
  app: {
    getState() {
      return request("/api/app-state");
    },
  },
  driver: {
    updateStatus(status) {
      return request("/api/driver/status", {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    updateProfile(profile) {
      return request("/api/driver/profile", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
    },
  },
  queue: {
    join() {
      return request("/api/queue/join", {
        method: "POST",
      });
    },
    leave() {
      return request("/api/queue/leave", {
        method: "POST",
      });
    },
  },
  payments: {
    simulate(via) {
      return request("/api/payments/simulate", {
        method: "POST",
        body: JSON.stringify({ via }),
      });
    },
  },
};
