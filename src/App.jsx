import { useEffect, useState } from "react";
import { adminApi, authStorage } from "./api.js";
import { slugify } from "./admin-utils.js";
import { LoginCard } from "./components/login-card.jsx";
import { AllianceAdminView } from "./components/alliance-admin-view.jsx";
import { SuperAdminView } from "./components/super-admin-view.jsx";
import { Button } from "./components/ui.jsx";

export default function App() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [tab, setTab] = useState("overview");
  const [superState, setSuperState] = useState({
    overview: null,
    alliances: [],
  });
  const [allianceState, setAllianceState] = useState({
    dashboard: null,
    drivers: [],
    vehicles: [],
    routes: [],
    queues: [],
    payments: [],
    cashEntries: [],
  });
  const [allianceForm, setAllianceForm] = useState({
    name: "",
    slug: "",
    adminFullName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [driverForm, setDriverForm] = useState({
    name: "",
    phone: "",
    cardNumber: "",
    routeId: "",
    vehicleId: "",
  });
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: "",
    model: "Chevrolet Damas",
    seatCount: "11",
    routeId: "",
  });
  const [routeForm, setRouteForm] = useState({
    name: "",
    price: "5000",
    points: [],
  });

  useEffect(() => {
    async function bootstrap() {
      const accessToken = authStorage.getToken();
      if (!accessToken) {
        setBooting(false);
        return;
      }

      try {
        const admin = await adminApi.auth.me();
        setSession({ accessToken, admin });
      } catch {
        authStorage.clearToken();
      } finally {
        setBooting(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    void refreshRoleData(session.admin.role);

    if (session.admin.role !== "alliance_admin") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void refreshRoleData("alliance_admin", { silent: true });
    }, 15000);

    return () => window.clearInterval(timer);
  }, [session]);

  async function refreshRoleData(role = session?.admin.role, options = {}) {
    if (!role) {
      return;
    }

    if (!options.silent) {
      setLoading(true);
    }

    try {
      if (role === "super_admin") {
        const [overview, alliances] = await Promise.all([
          adminApi.super.overview(),
          adminApi.super.alliances(),
        ]);

        setSuperState({ overview, alliances });
      } else {
        const [dashboard, drivers, vehicles, routes, queues, payments, cashEntries] =
          await Promise.all([
            adminApi.alliance.dashboard(),
            adminApi.alliance.drivers(),
            adminApi.alliance.vehicles(),
            adminApi.alliance.routes(),
            adminApi.alliance.liveQueues(),
            adminApi.alliance.payments(),
            adminApi.alliance.cashEntries(),
          ]);

        setAllianceState({
          dashboard,
          drivers,
          vehicles,
          routes,
          queues,
          payments,
          cashEntries,
        });
      }
    } catch (error) {
      if (!options.silent) {
        setNotice({ type: "error", text: error.message });
      }
    } finally {
      if (!options.silent) {
        setLoading(false);
      }
    }
  }

  async function handleLogin(form) {
    setLoading(true);
    setNotice(null);

    try {
      const payload = await adminApi.auth.login(form.email, form.password);
      authStorage.setToken(payload.accessToken);
      setSession({
        accessToken: payload.accessToken,
        admin: payload.admin,
      });
      setTab("overview");
      setNotice({ type: "success", text: "Panelga kirish muvaffaqiyatli." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    authStorage.clearToken();
    setSession(null);
    setNotice(null);
    setTab("overview");
  }

  async function handleCreateAlliance(event) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      await adminApi.super.createAlliance({
        name: allianceForm.name,
        slug: allianceForm.slug.trim() || slugify(allianceForm.name),
        adminFullName: allianceForm.adminFullName || undefined,
        adminEmail: allianceForm.adminEmail || undefined,
        adminPassword: allianceForm.adminPassword || undefined,
      });

      setAllianceForm({
        name: "",
        slug: "",
        adminFullName: "",
        adminEmail: "",
        adminPassword: "",
      });
      await refreshRoleData("super_admin", { silent: true });
      setNotice({ type: "success", text: "Alliance yaratildi." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDriver(event) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      await adminApi.alliance.createDriver({
        name: driverForm.name,
        phone: driverForm.phone,
        cardNumber: driverForm.cardNumber || undefined,
        routeId: driverForm.routeId,
        vehicleId: driverForm.vehicleId,
      });

      setDriverForm({
        name: "",
        phone: "",
        cardNumber: "",
        routeId: "",
        vehicleId: "",
      });
      await refreshRoleData("alliance_admin", { silent: true });
      setNotice({ type: "success", text: "Haydovchi yaratildi." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateVehicle(event) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      await adminApi.alliance.createVehicle({
        plateNumber: vehicleForm.plateNumber,
        model: vehicleForm.model || undefined,
        seatCount: Number(vehicleForm.seatCount || 11),
        routeId: vehicleForm.routeId || undefined,
      });

      setVehicleForm({
        plateNumber: "",
        model: "Chevrolet Damas",
        seatCount: "11",
        routeId: "",
      });
      await refreshRoleData("alliance_admin", { silent: true });
      setNotice({ type: "success", text: "Mashina yaratildi." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoute(event) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      await adminApi.alliance.createRoute({
        name: routeForm.name,
        price: Number(routeForm.price),
        points: routeForm.points.map((point) => ({
          name: point.name,
          lat: point.lat,
          lng: point.lng,
          radius: Number(point.radius),
        })),
      });

      setRouteForm({
        name: "",
        price: "5000",
        points: [],
      });
      await refreshRoleData("alliance_admin", { silent: true });
      setNotice({ type: "success", text: "Liniya yaratildi." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  function addRoutePoint(latlng) {
    setRouteForm((current) => ({
      ...current,
      points: [
        ...current.points,
        {
          id: `${Date.now()}-${current.points.length}`,
          name: `Bekat ${current.points.length + 1}`,
          lat: Number(latlng.lat.toFixed(7)),
          lng: Number(latlng.lng.toFixed(7)),
          radius: 80,
        },
      ],
    }));
  }

  if (booting) {
    return (
      <div className="loading-screen">
        <div className="loader-card">Panel yuklanmoqda...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <LoginCard
        loading={loading}
        error={notice?.type === "error" ? notice.text : ""}
        onSubmit={handleLogin}
      />
    );
  }

  const isSuperAdmin = session.admin.role === "super_admin";
  const adminName = session.admin.fullName;
  const allianceName = session.admin.alliance?.name ?? "Platforma";

  return (
    <div className="app-shell">
      <div className="app-layout">
        <aside className="sidebar">
          <div className="brand-block">
            <div className="brand-mark">D</div>
            <div>
              <span className="eyebrow">Damastic</span>
              <strong>{isSuperAdmin ? "Super Admin" : "Alliance Admin"}</strong>
            </div>
          </div>

          <div className="sidebar-card">
            <span className="eyebrow">Sessiya</span>
            <strong>{adminName}</strong>
            <p>{allianceName}</p>
            <span className="pill">
              {isSuperAdmin ? "platform owner" : "association control"}
            </span>
          </div>

          {!isSuperAdmin ? (
            <nav className="sidebar-nav">
              {[
                { id: "overview", label: "Dashboard" },
                { id: "drivers", label: "Haydovchilar" },
                { id: "vehicles", label: "Mashinalar" },
                { id: "routes", label: "Liniyalar" },
                { id: "queues", label: "Navbat" },
                { id: "payments", label: "Elektron to'lov" },
                { id: "cash", label: "Naqd tushum" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item ${tab === item.id ? "nav-item-active" : ""}`}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          ) : (
            <div className="sidebar-note">
              <strong>Platform boshqaruvi</strong>
              <p>Uyushmalar, statistikalar va admin provisioning shu panelda yuradi.</p>
            </div>
          )}
        </aside>

        <main className="main-panel">
          <header className="toolbar">
            <div>
              <span className="eyebrow">Damastic Operations</span>
              <h2>
                {isSuperAdmin
                  ? "Tizim darajasidagi nazorat"
                  : "Alyans darajasidagi operatsion panel"}
              </h2>
            </div>

            <div className="toolbar-actions">
              <Button onClick={() => refreshRoleData()} disabled={loading}>
                {loading ? "Yangilanmoqda..." : "Yangilash"}
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                Chiqish
              </Button>
            </div>
          </header>

          {notice ? (
            <div className={`notice notice-${notice.type}`}>{notice.text}</div>
          ) : null}

          {isSuperAdmin ? (
            <SuperAdminView
              overview={superState.overview}
              alliances={superState.alliances}
              loading={loading}
              allianceForm={allianceForm}
              onAllianceFormChange={(field, value) =>
                setAllianceForm((current) => ({ ...current, [field]: value }))
              }
              onCreateAlliance={handleCreateAlliance}
            />
          ) : (
            <AllianceAdminView
              tab={tab}
              setTab={setTab}
              dashboard={allianceState.dashboard}
              drivers={allianceState.drivers}
              vehicles={allianceState.vehicles}
              routes={allianceState.routes}
              queues={allianceState.queues}
              payments={allianceState.payments}
              cashEntries={allianceState.cashEntries}
              driverForm={driverForm}
              onDriverFormChange={(field, value) =>
                setDriverForm((current) => ({ ...current, [field]: value }))
              }
              onCreateDriver={handleCreateDriver}
              vehicleForm={vehicleForm}
              onVehicleFormChange={(field, value) =>
                setVehicleForm((current) => ({ ...current, [field]: value }))
              }
              onCreateVehicle={handleCreateVehicle}
              routeForm={routeForm}
              onRouteFormChange={(field, value) =>
                setRouteForm((current) => ({ ...current, [field]: value }))
              }
              onAddRoutePoint={addRoutePoint}
              onRoutePointChange={(index, field, value) =>
                setRouteForm((current) => ({
                  ...current,
                  points: current.points.map((point, pointIndex) =>
                    pointIndex === index
                      ? {
                          ...point,
                          [field]:
                            field === "radius" ? Number(value || 0) : value,
                        }
                      : point,
                  ),
                }))
              }
              onRemoveRoutePoint={(index) =>
                setRouteForm((current) => ({
                  ...current,
                  points: current.points.filter((_, pointIndex) => pointIndex !== index),
                }))
              }
              onCreateRoute={handleCreateRoute}
              loading={loading}
            />
          )}
        </main>
      </div>
    </div>
  );
}
