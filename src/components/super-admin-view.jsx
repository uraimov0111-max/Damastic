import React from "react";
import { Card, Button, DataTable, Field, StatGrid } from "./ui.jsx";
import { money } from "../admin-utils.js";
import { SmsStatusCard } from "./sms-status-card.jsx";

export function SuperAdminView({
  overview,
  alliances,
  loading,
  smsStatus,
  smsLoading,
  onRefreshSmsStatus,
  allianceForm,
  onAllianceFormChange,
  onCreateAlliance,
}) {
  return (
    <div className="stack-lg">
      <StatGrid
        items={[
          { label: "Uyushmalar", value: overview?.alliances ?? 0 },
          { label: "Haydovchilar", value: overview?.drivers ?? 0 },
          { label: "Mashinalar", value: overview?.vehicles ?? 0 },
          { label: "Elektron bugun", value: money(overview?.electronicToday ?? 0) },
          { label: "Naqd bugun", value: money(overview?.cashToday ?? 0) },
          { label: "Wallet jami", value: money(overview?.walletTotal ?? 0) },
        ]}
      />

      <SmsStatusCard
        status={smsStatus}
        loading={smsLoading}
        onRefresh={onRefreshSmsStatus}
      />

      <div className="split-grid">
        <Card
          title="Yangi alliance yaratish"
          subtitle="Agar admin maydonlarini to'ldirsangiz, alliance-admin akkaunti ham birga ochiladi."
        >
          <form className="form-grid" onSubmit={onCreateAlliance}>
            <Field label="Alliance nomi">
              <input
                className="input"
                value={allianceForm.name}
                onChange={(event) =>
                  onAllianceFormChange("name", event.target.value)
                }
                required
              />
            </Field>

            <Field label="Slug" hint="Bo'sh qoldirilsa nomdan yasaladi.">
              <input
                className="input"
                value={allianceForm.slug}
                onChange={(event) =>
                  onAllianceFormChange("slug", event.target.value)
                }
              />
            </Field>

            <Field label="Admin F.I.Sh.">
              <input
                className="input"
                value={allianceForm.adminFullName}
                onChange={(event) =>
                  onAllianceFormChange("adminFullName", event.target.value)
                }
              />
            </Field>

            <Field label="Admin email">
              <input
                className="input"
                type="email"
                value={allianceForm.adminEmail}
                onChange={(event) =>
                  onAllianceFormChange("adminEmail", event.target.value)
                }
              />
            </Field>

            <Field label="Admin parol">
              <input
                className="input"
                type="password"
                value={allianceForm.adminPassword}
                onChange={(event) =>
                  onAllianceFormChange("adminPassword", event.target.value)
                }
              />
            </Field>

            <div className="form-actions">
              <Button type="submit" disabled={loading}>
                {loading ? "Saqlanmoqda..." : "Alliance yaratish"}
              </Button>
            </div>
          </form>
        </Card>

        <Card
          title="Alliance ro'yxati"
          subtitle="Platformadagi barcha uyushmalar va ulardagi resurslar."
        >
          <DataTable
            columns={[
              { key: "name", label: "Nomi" },
              { key: "slug", label: "Slug" },
              { key: "status", label: "Holat" },
              { key: "drivers", label: "Haydovchi" },
              { key: "vehicles", label: "Mashina" },
              { key: "routes", label: "Liniya" },
              { key: "admins", label: "Admin" },
            ]}
            rows={alliances}
            emptyTitle="Alliance topilmadi"
            emptyText="Hali birorta uyushma yaratilmagan."
          />
        </Card>
      </div>
    </div>
  );
}
