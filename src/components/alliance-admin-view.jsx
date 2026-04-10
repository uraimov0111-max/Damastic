import React from "react";
import { ALLIANCE_TABS, formatDate, money } from "../admin-utils.js";
import { RouteDraftMap } from "./route-map.jsx";
import { SmsStatusCard } from "./sms-status-card.jsx";
import { Button, Card, DataTable, EmptyState, Field, StatGrid } from "./ui.jsx";

export function AllianceAdminView({
  tab,
  setTab,
  dashboard,
  smsStatus,
  smsLoading,
  onRefreshSmsStatus,
  drivers,
  vehicles,
  routes,
  queues,
  payments,
  cashEntries,
  driverForm,
  onDriverFormChange,
  onCreateDriver,
  onDeleteDriver,
  vehicleForm,
  onVehicleFormChange,
  onCreateVehicle,
  routeForm,
  onRouteFormChange,
  onAddRoutePoint,
  onRoutePointChange,
  onRemoveRoutePoint,
  onCreateRoute,
  loading,
}) {
  return (
    <div className="stack-lg">
      <div className="tabbar">
        {ALLIANCE_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab ${tab === item.id ? "tab-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="stack-lg">
          <StatGrid
            items={[
              { label: "Haydovchilar", value: dashboard?.drivers ?? 0 },
              { label: "Online", value: dashboard?.onlineDrivers ?? 0 },
              { label: "Mashinalar", value: dashboard?.vehicles ?? 0 },
              { label: "Aktiv mashina", value: dashboard?.activeVehicles ?? 0 },
              { label: "Aktiv navbat", value: dashboard?.activeQueues ?? 0 },
              { label: "Elektron bugun", value: money(dashboard?.electronicToday ?? 0) },
              { label: "Naqd bugun", value: money(dashboard?.cashToday ?? 0) },
              { label: "Wallet", value: money(dashboard?.walletTotal ?? 0) },
            ]}
          />

          <SmsStatusCard
            status={smsStatus}
            loading={smsLoading}
            onRefresh={onRefreshSmsStatus}
          />

          <div className="split-grid">
            <Card title="Tezkor signal">
              <div className="stack">
                <div className="alert-row">
                  <span>Liniyalar</span>
                  <strong>{routes.length}</strong>
                </div>
                <div className="alert-row">
                  <span>Mashinalar</span>
                  <strong>{vehicles.length}</strong>
                </div>
                <div className="alert-row">
                  <span>Haydovchilar</span>
                  <strong>{drivers.length}</strong>
                </div>
                <div className="alert-row">
                  <span>Navbat punktlari</span>
                  <strong>{queues.length}</strong>
                </div>
              </div>
            </Card>

            <Card title="Bugungi so'nggi operatsiyalar">
              <div className="stack">
                {(payments.slice(0, 3).length ? payments.slice(0, 3) : cashEntries.slice(0, 3)).map(
                  (item) => (
                    <div className="feed-item" key={item.id}>
                      <strong>{item.driverName}</strong>
                      <span>
                        {"amount" in item
                          ? `${item.paymentSystem.toUpperCase()} · ${money(item.amount)}`
                          : `${item.passengerCount} yo'lovchi · ${money(item.totalAmount)}`}
                      </span>
                    </div>
                  ),
                )}
                {payments.length === 0 && cashEntries.length === 0 ? (
                  <EmptyState
                    title="Operatsiya yo'q"
                    text="To'lov yoki naqd tushum yozuvlari hali shakllanmagan."
                  />
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "drivers" ? (
        <div className="split-grid">
          <Card title="Haydovchi qo'shish" subtitle="Har bir driver route va vehicle bilan bog'lanadi.">
            <form className="form-grid" onSubmit={onCreateDriver}>
              <Field label="F.I.Sh.">
                <input
                  className="input"
                  value={driverForm.name}
                  onChange={(event) => onDriverFormChange("name", event.target.value)}
                  required
                />
              </Field>
              <Field label="Telefon">
                <input
                  className="input"
                  value={driverForm.phone}
                  onChange={(event) => onDriverFormChange("phone", event.target.value)}
                  placeholder="+998901234567"
                  required
                />
              </Field>
              <Field label="Karta raqami">
                <input
                  className="input"
                  value={driverForm.cardNumber}
                  onChange={(event) =>
                    onDriverFormChange("cardNumber", event.target.value)
                  }
                  placeholder="8600..."
                />
              </Field>
              <Field label="Liniya">
                <select
                  className="input"
                  value={driverForm.routeId}
                  onChange={(event) => onDriverFormChange("routeId", event.target.value)}
                  required
                >
                  <option value="">Tanlang</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mashina">
                <select
                  className="input"
                  value={driverForm.vehicleId}
                  onChange={(event) => onDriverFormChange("vehicleId", event.target.value)}
                  required
                >
                  <option value="">Tanlang</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} {vehicle.driver ? "(band)" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="form-actions">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saqlanmoqda..." : "Haydovchi yaratish"}
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Haydovchilar ro'yxati">
            <DataTable
              columns={[
                { key: "name", label: "F.I.Sh." },
                { key: "phone", label: "Telefon" },
                { key: "status", label: "Holat" },
                {
                  key: "vehicle",
                  label: "Mashina",
                  render: (row) => row.vehicle?.plateNumber ?? row.carNumber,
                },
                {
                  key: "route",
                  label: "Liniya",
                  render: (row) => row.route?.name ?? "-",
                },
                {
                  key: "walletBalance",
                  label: "Wallet",
                  render: (row) => money(row.walletBalance),
                },
                {
                  key: "actions",
                  label: "",
                  render: (row) => (
                    <Button variant="ghost" onClick={() => onDeleteDriver(row.id)}>
                      O'chirish
                    </Button>
                  ),
                },
              ]}
              rows={drivers}
              emptyTitle="Haydovchi yo'q"
              emptyText="Alyans uchun hali driver yaratilmagan."
            />
          </Card>
        </div>
      ) : null}

      {tab === "vehicles" ? (
        <div className="split-grid">
          <Card title="Mashina qo'shish" subtitle="Ro'yxatdan o'tmagan vehicle navbat va to'lov tizimiga kira olmaydi.">
            <form className="form-grid" onSubmit={onCreateVehicle}>
              <Field label="Davlat raqami">
                <input
                  className="input"
                  value={vehicleForm.plateNumber}
                  onChange={(event) =>
                    onVehicleFormChange("plateNumber", event.target.value)
                  }
                  placeholder="10A333CC"
                  required
                />
              </Field>
              <Field label="Model">
                <input
                  className="input"
                  value={vehicleForm.model}
                  onChange={(event) => onVehicleFormChange("model", event.target.value)}
                />
              </Field>
              <Field label="O'rindiq soni">
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={vehicleForm.seatCount}
                  onChange={(event) =>
                    onVehicleFormChange("seatCount", event.target.value)
                  }
                />
              </Field>
              <Field label="Liniya">
                <select
                  className="input"
                  value={vehicleForm.routeId}
                  onChange={(event) => onVehicleFormChange("routeId", event.target.value)}
                >
                  <option value="">Biriktirilmagan</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="form-actions">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saqlanmoqda..." : "Mashina yaratish"}
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Mashinalar ro'yxati">
            <DataTable
              columns={[
                { key: "plateNumber", label: "Raqam" },
                { key: "model", label: "Model" },
                { key: "seatCount", label: "O'rindiq" },
                { key: "status", label: "Holat" },
                {
                  key: "route",
                  label: "Liniya",
                  render: (row) => row.route?.name ?? "-",
                },
                {
                  key: "driver",
                  label: "Driver",
                  render: (row) => row.driver?.name ?? "-",
                },
              ]}
              rows={vehicles}
              emptyTitle="Mashina yo'q"
              emptyText="Alyans bo'yicha hali vehicle yaratilmadi."
            />
          </Card>
        </div>
      ) : null}

      {tab === "routes" ? (
        <div className="split-grid">
          <Card title="Liniya yaratish" subtitle="Map ustida punktlarni chizib route polyline yarating.">
            <form className="stack" onSubmit={onCreateRoute}>
              <div className="form-grid">
                <Field label="Liniya nomi">
                  <input
                    className="input"
                    value={routeForm.name}
                    onChange={(event) =>
                      onRouteFormChange("name", event.target.value)
                    }
                    placeholder="Chilonzor -> Olmazor"
                    required
                  />
                </Field>
                <Field label="Yo'l haqi">
                  <select
                    className="input"
                    value={routeForm.price}
                    onChange={(event) =>
                      onRouteFormChange("price", event.target.value)
                    }
                  >
                    <option value="5000">5000</option>
                    <option value="10000">10000</option>
                  </select>
                </Field>
              </div>

              <RouteDraftMap points={routeForm.points} onAddPoint={onAddRoutePoint} />

              <div className="route-point-list">
                {routeForm.points.map((point, index) => (
                  <div className="route-point-row" key={point.id}>
                    <input
                      className="input"
                      value={point.name}
                      onChange={(event) =>
                        onRoutePointChange(index, "name", event.target.value)
                      }
                    />
                    <input
                      className="input"
                      type="number"
                      min="10"
                      value={point.radius}
                      onChange={(event) =>
                        onRoutePointChange(index, "radius", event.target.value)
                      }
                    />
                    <div className="point-coords">
                      {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                    </div>
                    <Button variant="ghost" onClick={() => onRemoveRoutePoint(index)}>
                      O'chirish
                    </Button>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <Button type="submit" disabled={loading || routeForm.points.length < 2}>
                  {loading ? "Saqlanmoqda..." : "Liniyani saqlash"}
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Mavjud liniyalar">
            {routes.length === 0 ? (
              <EmptyState
                title="Liniya yo'q"
                text="Alliance admin avval route yaratishi kerak."
              />
            ) : (
              <div className="route-list">
                {routes.map((route) => (
                  <article className="route-card" key={route.id}>
                    <div className="route-card-head">
                      <strong>{route.name}</strong>
                      <span>{money(route.price)}</span>
                    </div>
                    <div className="route-card-meta">
                      <span>{route.drivers} driver</span>
                      <span>{route.vehicles} vehicle</span>
                      <span>{route.points.length} punkt</span>
                    </div>
                    <ol className="route-steps">
                      {route.points.map((point) => (
                        <li key={point.id}>
                          {point.name} · {point.radius}m
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "queues" ? (
        <Card title="Jonli navbat holati" subtitle="Har bir punkt bo'yicha aktiv navbat snapshot.">
          {queues.length === 0 ? (
            <EmptyState
              title="Aktiv navbat yo'q"
              text="Hozircha birorta punktda navbat mavjud emas."
            />
          ) : (
            <div className="queue-board">
              {queues.map((queue) => (
                <article className="queue-card" key={queue.pointId}>
                  <div className="queue-card-head">
                    <div>
                      <strong>{queue.pointName}</strong>
                      <span className="muted">{queue.routeName}</span>
                    </div>
                    <span className="pill">{queue.total} ta damas</span>
                  </div>
                  <div className="queue-list">
                    {queue.entries.length === 0 ? (
                      <span className="muted">Navbat bo'sh</span>
                    ) : (
                      queue.entries.map((entry) => (
                        <div className="queue-line" key={entry.queueId}>
                          <strong>#{entry.position}</strong>
                          <span>{entry.driverName}</span>
                          <small>{entry.vehiclePlate}</small>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {tab === "payments" ? (
        <Card title="Elektron to'lovlar" subtitle="Click va Payme tranzaksiyalari oxirgi 100 ta yozuv bilan.">
          <DataTable
            columns={[
              { key: "driverName", label: "Driver" },
              { key: "vehiclePlate", label: "Mashina" },
              { key: "paymentSystem", label: "Provider" },
              { key: "status", label: "Holat" },
              {
                key: "amount",
                label: "Summa",
                render: (row) => money(row.amount),
              },
              {
                key: "createdAt",
                label: "Vaqt",
                render: (row) => formatDate(row.createdAt),
              },
            ]}
            rows={payments}
            emptyTitle="Elektron to'lov yo'q"
            emptyText="Click yoki Payme orqali hali to'lov tushmagan."
          />
        </Card>
      ) : null}

      {tab === "cash" ? (
        <Card title="Naqd tushumlar" subtitle="Driver kiritgan passenger count asosidagi naqd yozuvlar.">
          <DataTable
            columns={[
              { key: "driverName", label: "Driver" },
              { key: "vehiclePlate", label: "Mashina" },
              { key: "passengerCount", label: "Yo'lovchi" },
              {
                key: "fareAmount",
                label: "Tarif",
                render: (row) => money(row.fareAmount),
              },
              {
                key: "totalAmount",
                label: "Jami",
                render: (row) => money(row.totalAmount),
              },
              {
                key: "createdAt",
                label: "Vaqt",
                render: (row) => formatDate(row.createdAt),
              },
            ]}
            rows={cashEntries}
            emptyTitle="Naqd tushum yo'q"
            emptyText="Driver mobil ilovasidan hali naqd yozuv kiritilmagan."
          />
        </Card>
      ) : null}
    </div>
  );
}
