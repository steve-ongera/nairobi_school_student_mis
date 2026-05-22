// src/components/common/index.jsx
import { Link } from "react-router-dom";
import { statusBadge, gradeClass } from "../../utils/formatters";

// ── PageTitle ─────────────────────────────────────────────────────────────────
export function PageTitle({ title, breadcrumbs = [] }) {
  return (
    <div className="page-header">
      <ol className="breadcrumb">
        <li className="breadcrumb__item">
          <Link to="/">Home</Link>
        </li>
        {breadcrumbs.map((b, i) => (
          <li
            key={i}
            className={`breadcrumb__item${i === breadcrumbs.length - 1 ? " active" : ""}`}
          >
            <span className="breadcrumb__sep">/</span>
            {b.to ? <Link to={b.to}>{b.label}</Link> : b.label}
          </li>
        ))}
      </ol>
      <h1 className="page-header__title">{title}</h1>
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ message = "Loading…" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
      <div className="spinner" />
      <p className="text-muted mt-3" style={{ marginTop: 16, fontSize: "var(--text-sm)" }}>{message}</p>
    </div>
  );
}

// ── AlertMessage ──────────────────────────────────────────────────────────────
export function AlertMessage({ type = "info", message, onClose }) {
  if (!message) return null;

  const iconMap = {
    info:    "bi-info-circle-fill",
    success: "bi-check-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    danger:  "bi-x-circle-fill",
  };

  return (
    <div className={`alert alert--${type}`} role="alert">
      <i className={`bi ${iconMap[type] || "bi-info-circle-fill"}`} />
      <div className="alert__body">
        <p className="alert__text">{message}</p>
      </div>
      {onClose && (
        <button
          style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", padding: 4, opacity: 0.6 }}
          onClick={onClose}
          aria-label="Close"
        >
          <i className="bi bi-x-lg" style={{ fontSize: 13 }} />
        </button>
      )}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ message = "No records found.", icon = "bi-inbox" }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <i className={`bi ${icon}`} />
      </div>
      <p className="empty-state__desc">{message}</p>
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const colorMap = {
    active:    "badge--success",
    inactive:  "badge--default",
    suspended: "badge--danger",
    pending:   "badge--warning",
    graduated: "badge--info",
    expelled:  "badge--danger",
  };
  const cls = colorMap[status?.toLowerCase()] || "badge--default";
  return (
    <span className={`badge ${cls}`} style={{ textTransform: "capitalize" }}>
      {status || "—"}
    </span>
  );
}

// ── GradeBadge ────────────────────────────────────────────────────────────────
export function GradeBadge({ grade }) {
  return (
    <span className={`badge badge--primary ${gradeClass(grade)}`} style={{ fontSize: 13 }}>
      {grade || "—"}
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ title, value, icon, color = "blue", subtitle }) {
  return (
    <div className={`kpi-card kpi-card--${color}`}>
      <div className="kpi-card__header">
        <div className="kpi-card__icon">
          <i className={`bi ${icon}`} />
        </div>
      </div>
      <div className="kpi-card__value">{value}</div>
      <div className="kpi-card__label">{title}</div>
      {subtitle && <div className="kpi-card__meta">{subtitle}</div>}
    </div>
  );
}

// ── SearchBar ─────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="search-box" style={{ maxWidth: 260 }}>
      <i className="bi bi-search search-box__icon" />
      <input
        type="search"
        className="search-box__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ── DataTable ─────────────────────────────────────────────────────────────────
export function DataTable({ columns, data, loading, emptyMessage }) {
  if (loading) return <LoadingSpinner />;
  if (!data?.length) return <EmptyState message={emptyMessage} />;

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} style={col.style}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, ri) => (
          <tr key={row.id ?? ri}>
            {columns.map((col, ci) => (
              <td key={ci}>{col.render ? col.render(row) : row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── ConfirmDialog (pure CSS, no Bootstrap modal/backdrop) ─────────────────────
export function ConfirmDialog({ show, title, message, onConfirm, onCancel, confirmLabel = "Confirm", confirmColor = "danger" }) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="modal__header">
          <h5 className="modal__title" id="confirm-title">{title}</h5>
          <button className="modal__close" onClick={onCancel} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="modal__body" style={{ textAlign: "center" }}>
          <div className="confirm-icon confirm-icon--danger">
            <i className="bi bi-exclamation-triangle-fill" />
          </div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
            {message}
          </p>
        </div>

        <div className="modal__footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn btn-${confirmColor} btn-sm`}
            onClick={() => { onConfirm(); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}