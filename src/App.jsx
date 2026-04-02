import { useEffect, useMemo, useRef, useState } from "react";
import { api, authStorage } from "./api.js";

const C = {
  bg: "#07111d",
  shell: "#0d1727",
  panel: "#142236",
  panel2: "#1a2d44",
  border: "#24405c",
  text: "#edf4ff",
  muted: "#7f95af",
  accent: "#12d18e",
  accentSoft: "rgba(18, 209, 142, 0.14)",
  blue: "#4f8fff",
  blueSoft: "rgba(79, 143, 255, 0.14)",
  warn: "#ffb347",
  danger: "#ff6b6b",
  surface: "#081320",
};

const tabs = [
  { id: "main", label: "Asosiy", icon: "map" },
  { id: "queue", label: "Navbat", icon: "queue" },
  { id: "qr", label: "To'lov", icon: "card" },
  { id: "profile", label: "Profil", icon: "user" },
];

function money(amount) {
  return `${new Intl.NumberFormat("uz-UZ").format(amount)} som`;
}

function localPhone(phone) {
  return String(phone ?? "").replace(/^\+998\s*/, "");
}

function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        background: C.surface,
        color: C.text,
        padding: "14px 16px",
        outline: "none",
        fontSize: 14,
      }}
    />
  );
}

function Button({ children, disabled, style, ...rest }) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        width: "100%",
        border: "none",
        borderRadius: 16,
        padding: "14px 16px",
        background: disabled ? C.panel2 : C.accent,
        color: disabled ? C.muted : "#062213",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 800,
        fontSize: 14,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Panel({ children, accent = false, style }) {
  return (
    <div
      style={{
        background: accent
          ? "linear-gradient(180deg, rgba(18,209,142,0.16) 0%, rgba(20,34,54,0.95) 100%)"
          : "linear-gradient(180deg, rgba(26,45,68,0.6) 0%, rgba(20,34,54,0.95) 100%)",
        border: `1px solid ${accent ? "rgba(18,209,142,0.35)" : C.border}`,
        borderRadius: 20,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Shell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(18,209,142,0.18), transparent 35%), linear-gradient(180deg, #02060c 0%, #07111d 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "min(390px, 100%)",
          minHeight: 760,
          borderRadius: 36,
          background:
            "linear-gradient(180deg, rgba(10,19,31,0.98) 0%, rgba(7,17,29,1) 100%)",
          border: `1px solid ${C.border}`,
          boxShadow:
            "0 40px 100px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(36, 64, 92, 0.4) inset",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Header({ driver }) {
  const online = driver.status === "online";

  return (
    <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ color: C.text, fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>
            DAMASTIC
          </div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
            {driver.name} | {driver.line}
          </div>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 11,
            background: online ? C.accentSoft : "rgba(255,107,107,0.12)",
            color: online ? C.accent : C.danger,
            border: `1px solid ${online ? "rgba(18,209,142,0.35)" : "rgba(255,107,107,0.35)"}`,
            height: "fit-content",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: online ? C.accent : C.danger,
            }}
          />
          {online ? "ONLINE" : "OFFLINE"}
        </div>
      </div>
    </div>
  );
}

function BoltGlyph({ color = "#ffcb54", size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M13.4 2.8 6.8 12h4l-.2 9.2 6.6-9.2h-4.1l.3-9.2Z" fill={color} stroke="rgba(5,17,27,0.55)" strokeWidth="0.6" strokeLinejoin="round" />
    </svg>
  );
}

function HomeGlyph({ color = "#ffefe8", size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M5 10.5 12 5l7 5.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5Z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function QueueGlyph({ color = "currentColor", size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M8 6h8M8 12h8M8 18h8" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 5.5h1M4.5 11.5h1M4.5 17.5h1" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function QrGlyph({ color = "currentColor", size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4Z" fill="none" stroke={color} strokeWidth="1.8" />
      <path d="M15 15h2v2h-2ZM18 15h2v5h-5v-2h3ZM15 18h2v2h-2Z" fill={color} />
    </svg>
  );
}

function TabIcon({ icon, active }) {
  const color = active ? C.accent : "#7085a6";

  if (icon === "map") {
    return (
      <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
        <path d="M3.5 6.5 8.5 4l7 2.2L20.5 4v13.5L15.5 20l-7-2.2-5 2.2Z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8.5 4v13.8M15.5 6.2V20" fill="none" stroke={color} strokeWidth="1.8" />
        <path d="m9.8 12.2 1.5 1.7 3.2-4.1" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "queue") {
    return (
      <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
        <path d="M8 6h8M8 12h8M8 18h8" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4.5 5.5h1M4.5 11.5h1M4.5 17.5h1" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "card") {
    return (
      <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
        <rect x="3.5" y="6" width="17" height="12" rx="2.5" fill="none" stroke={color} strokeWidth="1.8" />
        <path d="M3.5 10h17" fill="none" stroke={color} strokeWidth="1.8" />
        <path d="M7 14.5h4" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
      <path d="M12 12.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="none" stroke={color} strokeWidth="1.8" />
      <path d="M6.5 19c.8-2.5 3-4 5.5-4s4.7 1.5 5.5 4" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 5.6c.2-1.6 1.5-2.8 3.5-2.8s3.3 1.2 3.5 2.8" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Nav({ screen, setScreen }) {
  return (
    <div
      style={{
        borderTop: `1px solid ${C.border}`,
        background: C.shell,
        padding: "4px 8px 10px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          alignItems: "end",
        }}
      >
        {tabs.map((tab) => {
          const active = tab.id === screen;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScreen(tab.id)}
              style={{
                border: "none",
                background: "transparent",
                color: active ? C.accent : "#7085a6",
                padding: "10px 6px 8px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 3,
                  borderRadius: 999,
                  background: active ? C.accent : "transparent",
                  boxShadow: active ? "0 0 12px rgba(18, 209, 142, 0.35)" : "none",
                }}
              />
              <TabIcon icon={tab.icon} active={active} />
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
        <div
          style={{
            width: 86,
            height: 4,
            borderRadius: 999,
            background: "rgba(127,149,175,0.28)",
          }}
        />
      </div>
    </div>
  );
}

function MiniMap({ drivers, route }) {
  return (
    <svg viewBox="0 0 320 190" style={{ width: "100%", height: 210 }}>
      <rect width="320" height="190" rx="18" fill="#091420" />
      {[45, 90, 135, 180, 225, 270].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="190" stroke="rgba(36,64,92,0.5)" strokeWidth="0.7" />
      ))}
      {[35, 70, 105, 140].map((y) => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(36,64,92,0.5)" strokeWidth="0.7" />
      ))}
      <path
        d="M10 120 C70 82 135 80 210 90 C250 95 280 92 310 70"
        fill="none"
        stroke="rgba(79,143,255,0.35)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M10 120 C70 82 135 80 210 90 C250 95 280 92 310 70"
        fill="none"
        stroke={C.accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="8 6"
      />
      <circle cx="24" cy="120" r="7" fill={C.accent} />
      <circle cx="300" cy="70" r="7" fill={C.blue} />
      <text x="16" y="142" fill={C.accent} fontSize="10">{route.from}</text>
      <text x="255" y="56" fill={C.blue} fontSize="10">{route.to}</text>
      {drivers.map((driver) => (
        <g key={driver.id} transform={`translate(${driver.map.x}, ${driver.map.y})`}>
          <circle r={driver.isYou ? 13 : 10} fill={driver.isYou ? "rgba(18,209,142,0.2)" : "rgba(79,143,255,0.18)"} />
          <circle r="5" fill={driver.isYou ? C.accent : driver.color} />
          <text x="0" y="-14" textAnchor="middle" fill={driver.isYou ? C.accent : C.text} fontSize="8">
            {driver.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

function StatusBar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "#88a0c9",
        fontSize: 12,
        letterSpacing: 0.4,
      }}
    >
      <span>9:41</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
          {[8, 11, 14].map((height) => (
            <span
              key={height}
              style={{
                width: 5,
                height,
                borderRadius: 999,
                background: "#88a0c9",
                opacity: 0.9,
              }}
            />
          ))}
        </div>
        <span>WiFi</span>
        <span>87%</span>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: 28,
        margin: "0 auto",
        background: "linear-gradient(180deg, #14d99a 0%, #10bd86 100%)",
        boxShadow: "0 0 28px rgba(18, 209, 142, 0.32)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true">
        <rect x="10" y="22" width="36" height="19" rx="6" fill="#f0f4ff" stroke="#0b1220" strokeWidth="2.8" />
        <rect x="38" y="24" width="12" height="17" rx="3" fill="#dbe7ff" stroke="#0b1220" strokeWidth="2.8" />
        <rect x="16" y="27" width="12" height="8" rx="2" fill="#7fb1ff" />
        <rect x="31" y="27" width="10" height="8" rx="2" fill="#7fb1ff" />
        <rect x="9" y="34" width="42" height="7" rx="3.5" fill="#e6edf9" stroke="#0b1220" strokeWidth="2.8" />
        <circle cx="19" cy="44" r="5.5" fill="#1d2b41" stroke="#0b1220" strokeWidth="2.8" />
        <circle cx="43" cy="44" r="5.5" fill="#1d2b41" stroke="#0b1220" strokeWidth="2.8" />
        <circle cx="19" cy="44" r="2" fill="#9cb2cf" />
        <circle cx="43" cy="44" r="2" fill="#9cb2cf" />
        <path d="M10 32 L6 36 L6 46 L10 46" fill="#f7cc56" stroke="#0b1220" strokeWidth="2.8" strokeLinejoin="round" />
        <circle cx="48" cy="18" r="2.8" fill="#ff7b7b" />
      </svg>
    </div>
  );
}

function LoginScreen({ state, setState, loading, onSend, onVerify }) {
  const inCodeStep = state.step === "code";
  const phoneValue = localPhone(state.phone);

  return (
    <div
      style={{
        flex: 1,
        padding: "10px 22px 30px",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at 50% 38%, rgba(18,209,142,0.08), transparent 28%), linear-gradient(180deg, #08111e 0%, #0a1220 100%)",
      }}
    >
      <div
        style={{
          width: 92,
          height: 6,
          borderRadius: 999,
          background: "rgba(127, 149, 175, 0.18)",
          margin: "0 auto 12px",
        }}
      />
      <StatusBar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingBottom: 30,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <BrandMark />
          <div
            style={{
              marginTop: 28,
              color: C.text,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -1.2,
            }}
          >
            DAMASTIC<span style={{ color: C.accent }}>.</span>UZ
          </div>
          <div
            style={{
              marginTop: 12,
              color: "#88a0c9",
              fontSize: 14,
              letterSpacing: 0.6,
            }}
          >
            Haydovchi ilovasi
          </div>
        </div>

        <div>
          <div
            style={{
              color: "#88a0c9",
              fontSize: 13,
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            {inCodeStep ? "SMS KOD" : "TELEFON RAQAM"}
          </div>

          {!inCodeStep ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                height: 70,
                padding: "0 20px",
                borderRadius: 16,
                background: "#172338",
                border: "1px solid rgba(79, 110, 155, 0.28)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexShrink: 0 }}>
                <span style={{ color: "#94a6c2", fontSize: 16, fontWeight: 700 }}>UZ</span>
                <span style={{ color: C.text, fontSize: 18, fontWeight: 700 }}>+998</span>
              </div>
              <div style={{ width: 1, height: 30, background: "rgba(136,160,201,0.24)" }} />
              <input
                value={phoneValue}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    phone: `+998 ${event.target.value.replace(/[^\d\s]/g, "").trimStart()}`,
                    error: "",
                  }))
                }
                placeholder="90 123 45 67"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: C.text,
                  fontSize: 18,
                  outline: "none",
                }}
              />
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  height: 70,
                  padding: "0 20px",
                  borderRadius: 16,
                  background: "#172338",
                  border: "1px solid rgba(79, 110, 155, 0.28)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                <span style={{ color: "#94a6c2", fontSize: 15, fontWeight: 700 }}>SMS</span>
                <div style={{ width: 1, height: 30, background: "rgba(136,160,201,0.24)" }} />
                <input
                  value={state.code}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      code: event.target.value.replace(/\D/g, "").slice(0, 4),
                      error: "",
                    }))
                  }
                  placeholder="1234"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    color: C.text,
                    fontSize: 24,
                    letterSpacing: 8,
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ marginTop: 10, color: C.accent, fontSize: 12 }}>
                Demo kod: {state.demoCode}
              </div>
            </>
          )}

          {state.error ? (
            <div style={{ color: C.danger, marginTop: 14, fontSize: 12 }}>{state.error}</div>
          ) : null}

          <Button
            onClick={inCodeStep ? onVerify : onSend}
            disabled={loading}
            style={{
              marginTop: 22,
              minHeight: 62,
              borderRadius: 16,
              letterSpacing: 2.2,
              background: "linear-gradient(180deg, #16d495 0%, #10c587 100%)",
              boxShadow: loading ? "none" : "0 12px 24px rgba(18, 209, 142, 0.22)",
              color: "#071019",
            }}
          >
            {loading ? "KUTILMOQDA..." : inCodeStep ? "KIRISH ->" : "SMS KOD YUBORISH ->"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SwipeToggle({ value, onChange, disabled }) {
  const startX = useRef(null);
  const dragging = useRef(false);
  const isOnline = value === "online";

  function onPointerDown(event) {
    if (disabled) {
      return;
    }

    startX.current = event.clientX;
    dragging.current = false;
  }

  function onPointerMove(event) {
    if (startX.current === null || disabled) {
      return;
    }

    if (Math.abs(event.clientX - startX.current) > 8) {
      dragging.current = true;
    }
  }

  function onPointerUp(event) {
    if (startX.current === null || disabled) {
      startX.current = null;
      return;
    }

    const delta = event.clientX - startX.current;

    if (Math.abs(delta) > 28) {
      if (delta > 0 && !isOnline) {
        onChange("online");
      }

      if (delta < 0 && isOnline) {
        onChange("offline");
      }
    } else if (!dragging.current) {
      onChange(isOnline ? "offline" : "online");
    }

    startX.current = null;
    dragging.current = false;
  }

  return (
    <div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: "relative",
          minHeight: 74,
          borderRadius: 26,
          border: `1.5px solid ${isOnline ? "rgba(18,209,142,0.75)" : "rgba(255,107,107,0.6)"}`,
          background: isOnline
            ? "linear-gradient(180deg, rgba(4,44,39,0.92) 0%, rgba(5,35,33,0.96) 100%)"
            : "linear-gradient(180deg, rgba(46,18,22,0.92) 0%, rgba(31,12,17,0.96) 100%)",
          boxShadow: isOnline
            ? "0 0 0 1px rgba(18,209,142,0.14) inset"
            : "0 0 0 1px rgba(255,107,107,0.12) inset",
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          touchAction: "none",
          overflow: "hidden",
          opacity: disabled ? 0.78 : 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BoltGlyph />
          <span style={{ color: isOnline ? C.accent : "#8e9db7", fontSize: 14, fontWeight: 700, letterSpacing: 0.8 }}>
            ISHDA
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingRight: 62 }}>
          <HomeGlyph color={isOnline ? "#ffefe8" : "#ffb7b7"} />
        </div>

        <div
          style={{
            position: "absolute",
            top: 7,
            left: isOnline ? "calc(100% - 64px)" : "8px",
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: "linear-gradient(180deg, #13d595 0%, #10c286 100%)",
            border: "2px solid rgba(2, 27, 20, 0.9)",
            boxShadow: "0 8px 18px rgba(18, 209, 142, 0.32)",
            display: "grid",
            placeItems: "center",
            color: "#032017",
            transition: "left 220ms ease",
          }}
        >
          {isOnline ? <BoltGlyph color="#062316" size={28} /> : <HomeGlyph color="#062316" size={24} />}
        </div>
      </div>
      <div
        style={{
          marginTop: 8,
          textAlign: "center",
          color: "#8198bf",
          fontSize: 12,
          letterSpacing: 0.5,
        }}
      >
        chapga yoki o'ngga suring
      </div>
    </div>
  );
}

function MainScreen({ appState, actionLoading, setScreen, onChangeStatus }) {
  const online = appState.driver.status === "online";

  return (
    <div style={{ flex: 1, padding: 18, overflowY: "auto" }}>
      <SwipeToggle
        value={appState.driver.status}
        onChange={onChangeStatus}
        disabled={actionLoading === "status"}
      />

      <div
        style={{
          marginTop: 14,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          background: "linear-gradient(180deg, rgba(11,20,34,0.96) 0%, rgba(8,15,28,1) 100%)",
          padding: 10,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 12,
            zIndex: 2,
            borderRadius: 14,
            background: "rgba(26, 38, 62, 0.9)",
            border: "1px solid rgba(64, 93, 132, 0.25)",
            padding: "9px 12px",
          }}
        >
          <div style={{ color: "#8396b6", fontSize: 10, letterSpacing: 1 }}>
            {appState.dashboard.route.from.toUpperCase()}DA
          </div>
          <div style={{ color: C.text, fontSize: 26, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>
            {appState.dashboard.activeDrivers} ta damas
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 14,
            bottom: 12,
            zIndex: 2,
            borderRadius: 999,
            background: "rgba(15, 32, 49, 0.92)",
            border: "1px solid rgba(36,64,92,0.4)",
            padding: "5px 10px",
            color: C.accent,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.6,
          }}
        >
          GPS | FAOL
        </div>

        <MiniMap drivers={appState.dashboard.mapDrivers} route={appState.dashboard.route} />
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <button
          type="button"
          onClick={() => setScreen("queue")}
          style={{
            border: "none",
            borderRadius: 16,
            minHeight: 76,
            background: "linear-gradient(180deg, #15d392 0%, #11c282 100%)",
            color: "#041f16",
            cursor: "pointer",
            boxShadow: "0 10px 22px rgba(18, 209, 142, 0.22)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontWeight: 800,
            letterSpacing: 1.3,
          }}
        >
          <QueueGlyph color="#041f16" size={22} />
          <span>NAVBAT OLISH</span>
        </button>
        <button
          type="button"
          onClick={() => setScreen("qr")}
          style={{
            border: "none",
            borderRadius: 16,
            minHeight: 76,
            background: "linear-gradient(180deg, #4e86ef 0%, #2e66e9 100%)",
            color: "#f5f9ff",
            cursor: "pointer",
            boxShadow: "0 10px 22px rgba(79, 143, 255, 0.22)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontWeight: 800,
            letterSpacing: 1.3,
          }}
        >
          <QrGlyph color="#f5f9ff" size={22} />
          <span>QR KO'RSATISH</span>
        </button>
      </div>
    </div>
  );
}

function QueueScreen({ appState, actionLoading, onToggle }) {
  return (
    <div style={{ flex: 1, padding: 18, overflowY: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <Panel>
          <div style={{ color: C.muted, fontSize: 11 }}>Jami navbat</div>
          <div style={{ color: C.text, fontSize: 28, fontWeight: 800, marginTop: 8 }}>{appState.queue.total}</div>
        </Panel>
        <Panel accent={appState.queue.joined}>
          <div style={{ color: C.muted, fontSize: 11 }}>Sizning joy</div>
          <div style={{ color: appState.queue.joined ? C.accent : C.text, fontSize: 28, fontWeight: 800, marginTop: 8 }}>
            {appState.queue.position ? `#${appState.queue.position}` : "-"}
          </div>
        </Panel>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        {appState.queue.entries.map((entry) => (
          <Panel key={entry.id} accent={entry.isYou}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>#{entry.pos} {entry.name}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{entry.car}</div>
              </div>
              <div style={{ padding: "6px 10px", borderRadius: 999, background: entry.isYou ? C.blueSoft : "rgba(255,255,255,0.04)", color: entry.isYou ? C.blue : C.muted, fontSize: 11, fontWeight: 700 }}>
                {entry.isYou ? "SIZ" : "NAVBAT"}
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Button
        onClick={onToggle}
        disabled={actionLoading === "queue"}
        style={{ marginTop: 16, background: appState.queue.joined ? "rgba(255,107,107,0.18)" : C.accent, color: appState.queue.joined ? C.danger : "#062213" }}
      >
        {actionLoading === "queue" ? "Yangilanmoqda..." : appState.queue.joined ? "Navbatdan chiqish" : "Navbatga qoshilish"}
      </Button>
    </div>
  );
}

function QRScreen({ appState, actionLoading, onPay }) {
  const [via, setVia] = useState(appState.payments.methods[0] ?? "Payme");
  const latest = appState.payments.transactions[0];
  const qr = useMemo(
    () =>
      Array.from({ length: 21 * 21 }, (_, index) => {
        const row = Math.floor(index / 21);
        const col = index % 21;
        const finder = (row < 7 && col < 7) || (row < 7 && col > 13) || (row > 13 && col < 7);
        const value = (row * 7 + col * 11 + index) % 5 !== 0;
        return { finder, value, row, col };
      }),
    [],
  );

  return (
    <div style={{ flex: 1, padding: 18, overflowY: "auto" }}>
      <Panel accent>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: C.muted, fontSize: 11 }}>Tolov summasi</div>
          <div style={{ color: C.text, fontSize: 36, fontWeight: 800, marginTop: 8 }}>{money(appState.payments.summary.nextAmount)}</div>
          <div style={{ color: C.accent, fontSize: 13, marginTop: 8 }}>{appState.payments.payLink}</div>
        </div>
        <div style={{ width: 210, height: 210, margin: "20px auto 0", background: "#ffffff", borderRadius: 20, padding: 20 }}>
          <svg viewBox="0 0 21 21" width="100%" height="100%">
            {qr.map((cell, index) => (
              <rect key={index} x={cell.col} y={cell.row} width="1" height="1" fill={cell.finder || cell.value ? "#111111" : "#ffffff"} />
            ))}
          </svg>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {appState.payments.methods.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setVia(method)}
              style={{
                flex: 1,
                border: `1px solid ${via === method ? "rgba(18,209,142,0.4)" : C.border}`,
                background: via === method ? C.accentSoft : C.panel,
                borderRadius: 14,
                padding: "10px 12px",
                color: via === method ? C.accent : C.text,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {method}
            </button>
          ))}
        </div>
        <Button onClick={() => onPay(via)} disabled={actionLoading === "payment"} style={{ marginTop: 16 }}>
          {actionLoading === "payment" ? "Tolov yozilmoqda..." : `${via} bilan simulyatsiya`}
        </Button>
      </Panel>

      {latest ? (
        <Panel style={{ marginTop: 16 }}>
          <div style={{ color: C.muted, fontSize: 11 }}>Oxirgi tranzaksiya</div>
          <div style={{ color: C.text, fontSize: 18, fontWeight: 700, marginTop: 8 }}>{money(latest.amount)}</div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>
            {latest.via} | {latest.time} | {latest.transactionId}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function ProfileScreen({ appState, actionLoading, onSave, onLogout }) {
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState(() => ({
    name: appState.driver.name,
    phone: appState.driver.phone,
    car: appState.driver.car,
  }));

  useEffect(() => {
    setForm({ name: appState.driver.name, phone: appState.driver.phone, car: appState.driver.car });
  }, [appState.driver]);

  return (
    <div style={{ flex: 1, padding: 18, overflowY: "auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "info", label: "Malumot" },
          { id: "queue", label: "Navbat tarixi" },
          { id: "payments", label: "Tolovlar" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            style={{
              flex: 1,
              borderRadius: 14,
              border: `1px solid ${tab === item.id ? "rgba(18,209,142,0.4)" : C.border}`,
              padding: "10px 8px",
              background: tab === item.id ? C.accentSoft : C.panel,
              color: tab === item.id ? C.accent : C.text,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "info" ? (
        <>
          <Panel><div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>Ism</div><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></Panel>
          <Panel style={{ marginTop: 12 }}><div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>Telefon</div><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></Panel>
          <Panel style={{ marginTop: 12 }}><div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>Mashina raqami</div><Input value={form.car} onChange={(e) => setForm((p) => ({ ...p, car: e.target.value }))} /></Panel>
          <Button onClick={() => onSave(form)} disabled={actionLoading === "profile"} style={{ marginTop: 16 }}>
            {actionLoading === "profile" ? "Saqlanmoqda..." : "Profilni saqlash"}
          </Button>
          <Button onClick={onLogout} style={{ marginTop: 12, background: "rgba(255,107,107,0.18)", color: C.danger }}>
            Chiqish
          </Button>
        </>
      ) : null}

      {tab === "queue" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {appState.queueHistory.map((item, index) => (
            <Panel key={`${item.time}-${index}`}>
              <div style={{ color: C.text, fontWeight: 700 }}>{item.point}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>
                {item.time} | Navbat #{item.pos} | Kutish {item.duration}
              </div>
            </Panel>
          ))}
        </div>
      ) : null}

      {tab === "payments" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {appState.payments.transactions.map((payment) => (
            <Panel key={payment.transactionId}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ color: C.text, fontWeight: 700 }}>{money(payment.amount)}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>
                    {payment.via} | {payment.time}
                  </div>
                </div>
                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: payment.status === "success" ? C.accentSoft : payment.status === "pending" ? "rgba(255,179,71,0.14)" : "rgba(255,107,107,0.12)",
                    color: payment.status === "success" ? C.accent : payment.status === "pending" ? C.warn : C.danger,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {payment.status.toUpperCase()}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("login");
  const [appState, setAppState] = useState(null);
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [notice, setNotice] = useState("");
  const [login, setLogin] = useState({
    step: "phone",
    phone: "+998 90 123 45 67",
    code: "",
    sessionId: "",
    demoCode: "1234",
    error: "",
  });

  useEffect(() => {
    async function bootstrap() {
      const token = authStorage.getToken();
      if (!token) {
        setLoadingBootstrap(false);
        return;
      }

      try {
        const state = await api.app.getState();
        setAppState(state);
        setScreen("main");
      } catch {
        authStorage.clearToken();
      } finally {
        setLoadingBootstrap(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function mutate(key, task, successText) {
    setActionLoading(key);
    try {
      const nextState = await task();
      setAppState(nextState);
      if (successText) {
        setNotice(successText);
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setActionLoading("");
    }
  }

  async function sendCode() {
    setAuthLoading(true);
    try {
      const payload = await api.auth.sendCode(login.phone);
      setLogin((prev) => ({
        ...prev,
        step: "code",
        sessionId: payload.sessionId,
        demoCode: payload.demoCode,
        error: "",
      }));
    } catch (error) {
      setLogin((prev) => ({ ...prev, error: error.message }));
    } finally {
      setAuthLoading(false);
    }
  }

  async function verify() {
    setAuthLoading(true);
    try {
      const payload = await api.auth.verify({
        phone: login.phone,
        code: login.code,
        sessionId: login.sessionId,
      });
      authStorage.setToken(payload.token);
      setAppState(payload.appState);
      setScreen("main");
      setNotice("Tizimga kirildi");
    } catch (error) {
      setLogin((prev) => ({ ...prev, error: error.message }));
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    authStorage.clearToken();
    setAppState(null);
    setScreen("login");
    setLogin({
      step: "phone",
      phone: "+998 90 123 45 67",
      code: "",
      sessionId: "",
      demoCode: "1234",
      error: "",
    });
    setNotice("Sessiya yopildi");
  }

  return (
    <Shell>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap");
        :root {
          color-scheme: dark;
          font-family: "Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        * { box-sizing: border-box; }
        body { margin: 0; min-width: 320px; }
        button, input { font: inherit; }
      `}</style>

      {loadingBootstrap ? (
        <div style={{ flex: 1, display: "grid", placeItems: "center", color: C.text }}>Yuklanmoqda...</div>
      ) : (
        <>
          {screen !== "login" && appState ? <Header driver={appState.driver} /> : null}
          {notice ? (
            <div
              style={{
                margin: "12px 18px 0",
                padding: "10px 12px",
                borderRadius: 14,
                background: notice.toLowerCase().includes("notogri") ? "rgba(255,107,107,0.12)" : C.accentSoft,
                color: notice.toLowerCase().includes("notogri") ? C.danger : C.accent,
                fontSize: 12,
              }}
            >
              {notice}
            </div>
          ) : null}

          {screen === "login" ? (
            <LoginScreen state={login} setState={setLogin} loading={authLoading} onSend={sendCode} onVerify={verify} />
          ) : null}

          {screen === "main" && appState ? (
            <MainScreen
              appState={appState}
              actionLoading={actionLoading}
              setScreen={setScreen}
              onChangeStatus={(status) => mutate("status", () => api.driver.updateStatus(status), "Holat yangilandi")}
            />
          ) : null}

          {screen === "queue" && appState ? (
            <QueueScreen
              appState={appState}
              actionLoading={actionLoading}
              onToggle={() =>
                mutate(
                  "queue",
                  () => (appState.queue.joined ? api.queue.leave() : api.queue.join()),
                  appState.queue.joined ? "Navbatdan chiqildi" : "Navbatga qoshilindi",
                )
              }
            />
          ) : null}

          {screen === "qr" && appState ? (
            <QRScreen
              appState={appState}
              actionLoading={actionLoading}
              onPay={(via) => mutate("payment", () => api.payments.simulate(via), "Tolov yozildi")}
            />
          ) : null}

          {screen === "profile" && appState ? (
            <ProfileScreen
              appState={appState}
              actionLoading={actionLoading}
              onSave={(form) => mutate("profile", () => api.driver.updateProfile(form), "Profil saqlandi")}
              onLogout={logout}
            />
          ) : null}

          {screen !== "login" && appState ? <Nav screen={screen} setScreen={setScreen} /> : null}
        </>
      )}
    </Shell>
  );
}
