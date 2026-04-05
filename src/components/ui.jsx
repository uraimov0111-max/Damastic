import React from "react";

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  disabled = false,
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      className={`button button-${variant}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ title, subtitle, children, actions }) {
  return (
    <section className="card">
      {(title || subtitle || actions) && (
        <div className="card-head">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="card-actions">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatGrid({ items }) {
  return (
    <div className="stat-grid">
      {items.map((item) => (
        <article className="stat-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.help ? <small>{item.help}</small> : null}
        </article>
      ))}
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

export function DataTable({ columns, rows, emptyTitle, emptyText }) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} text={emptyText} />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? `${index}-${columns[0]?.key ?? "row"}`}>
              {columns.map((column) => (
                <td key={column.key}>
                  {typeof column.render === "function"
                    ? column.render(row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
