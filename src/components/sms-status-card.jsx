import React from "react";
import { formatDate } from "../admin-utils.js";
import { Button, Card, EmptyState } from "./ui.jsx";

function formatBalance(value) {
  if (value == null || value === "") {
    return "-";
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return new Intl.NumberFormat("uz-UZ").format(parsed);
  }

  return String(value);
}

function getStatusBadge(status) {
  if (!status) {
    return {
      label: "Tekshirilmagan",
      className: "status-pill status-pill-pending",
    };
  }

  if (status.mode === "console") {
    return {
      label: "Console",
      className: "status-pill status-pill-console",
    };
  }

  if (status.authorized) {
    return {
      label: "Ulangan",
      className: "status-pill status-pill-ok",
    };
  }

  return {
    label: "Xato",
    className: "status-pill status-pill-error",
  };
}

function tokenSourceLabel(source) {
  if (source === "static") {
    return "Static bearer";
  }

  if (source === "login") {
    return "Eskiz login";
  }

  if (source === "console") {
    return "Console rejim";
  }

  return "-";
}

export function SmsStatusCard({ status, loading, onRefresh }) {
  const badge = getStatusBadge(status);

  return (
    <Card
      title="Eskiz SMS"
      subtitle="Token, akkaunt va limit holati."
      actions={(
        <Button variant="ghost" onClick={onRefresh} disabled={loading}>
          {loading ? "Tekshirilmoqda..." : "SMS holatini yangilash"}
        </Button>
      )}
    >
      {!status ? (
        <EmptyState
          title="SMS status olinmagan"
          text="Eskiz provider holatini ko'rish uchun tekshirishni ishga tushiring."
        />
      ) : (
        <div className="stack">
          <div className="alert-row">
            <span>Holat</span>
            <span className={badge.className}>{badge.label}</span>
          </div>
          <div className="alert-row">
            <span>Provider</span>
            <strong>{status.provider}</strong>
          </div>
          <div className="alert-row">
            <span>Sender</span>
            <strong>{status.sender ?? "-"}</strong>
          </div>
          <div className="alert-row">
            <span>Token manbai</span>
            <strong>{tokenSourceLabel(status.tokenSource)}</strong>
          </div>
          <div className="alert-row">
            <span>Akkaunt</span>
            <strong>{status.userName ?? "-"}</strong>
          </div>
          <div className="alert-row">
            <span>Email</span>
            <strong>{status.userEmail ?? "-"}</strong>
          </div>
          <div className="alert-row">
            <span>SMS balansi</span>
            <strong>{formatBalance(status.balance)}</strong>
          </div>
          <div className="alert-row">
            <span>Tekshirildi</span>
            <strong>{formatDate(status.checkedAt)}</strong>
          </div>
          {status.error ? (
            <div className="notice notice-error notice-inline">{status.error}</div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
