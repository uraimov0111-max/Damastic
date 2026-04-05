import React, { useState } from "react";
import { Button, Field } from "./ui.jsx";

export function LoginCard({ loading, error, onSubmit }) {
  const [form, setForm] = useState({
    email: "superadmin@damastic.uz",
    password: "SuperAdmin123!",
  });

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">D</div>
          <div>
            <span className="eyebrow">Damastic Control</span>
            <h1>Superadmin va alyans paneli</h1>
            <p>Driver ilova Flutter mobil holatda qoladi, web esa boshqaruv uchun.</p>
          </div>
        </div>

        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
        >
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
          </Field>

          <Field label="Parol">
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              required
            />
          </Field>

          {error ? <div className="notice notice-error">{error}</div> : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Kirilmoqda..." : "Panelga kirish"}
          </Button>
        </form>
      </div>
    </div>
  );
}
