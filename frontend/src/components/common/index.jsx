import { Link } from "react-router-dom";
import { statusBadge, gradeClass } from "../../utils/formatters";

// ── PageTitle ─────────────────────────────────────────────────────────────────
export function PageTitle({ title, breadcrumbs = [] }) {
  return (
    <div className="pagetitle">
      <h1>{title}</h1>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          {breadcrumbs.map((b, i) => (
            <li
              key={i}
              className={`breadcrumb-item ${i === breadcrumbs.length - 1 ? "active" : ""}`}
            >
              {b.to ? <Link to={b.to}>{b.label}</Link> : b.label}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ title, value, icon, color = "primary", subtitle }) {
  const colorMap = {
    primary: { bg: "#f6f6fe", iconColor: "#4154f1" },
    success: { bg: "#e0f8e9", iconColor: "#2eca6a" },
    warning: { bg: "#ffecdf", iconColor: "#ff771d" },
    danger: { bg: "#fde8e8", iconColor: "#dc3545" },
  };
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="card info-card">
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <div className="d-flex align-items-center">
          <div
            className="card-icon rounded-circle d-flex align-items-center justify-content-center"
            style={{ backgroundColor: c.bg, color: c.iconColor }}
          >
            <i className={`bi ${icon}`} />
          </div>
          <div className="ps-3">
            <h6>{value}</h6>
            {subtitle && <span className="text-muted small">{subtitle}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ message = "Loading…" }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className="spinner-border text-primary" role="status" />
      <p className="mt-3 text-muted">{message}</p>
    </div>
  );
}

// ── AlertMessage ──────────────────────────────────────────────────────────────
export function AlertMessage({ type = "info", message, onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
      {message}
      {onClose && (
        <button type="button" className="btn-close" onClick={onClose} />
      )}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ message = "No records found.", icon = "bi-inbox" }) {
  return (
    <div className="text-center py-5">
      <i className={`bi ${icon}`} style={{ fontSize: 48, color: "#aab7cf" }} />
      <p className="mt-3 text-muted">{message}</p>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const color = statusBadge(status);
  return (
    <span className={`badge bg-${color} text-capitalize`}>{status}</span>
  );
}

export function GradeBadge({ grade }) {
  return (
    <span className={`badge px-2 py-1 ${gradeClass(grade)}`} style={{ fontSize: 13 }}>
      {grade || "—"}
    </span>
  );
}

// ── DataTable ─────────────────────────────────────────────────────────────────
export function DataTable({ columns, data, loading, emptyMessage }) {
  if (loading) return <LoadingSpinner />;
  if (!data?.length) return <EmptyState message={emptyMessage} />;
  return (
    <div className="table-responsive">
      <table className="table table-hover table-bordered align-middle">
        <thead className="table-light">
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={col.style}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri}>
              {columns.map((col, ci) => (
                <td key={ci}>{col.render ? col.render(row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <input
      type="text"
      className="form-control"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ maxWidth: 260 }}
    />
  );
}

// ── ConfirmDialog (Bootstrap modal) ───────────────────────────────────────────
export function ConfirmDialog({ id, title, message, onConfirm, danger = true }) {
  return (
    <div className="modal fade" id={id} tabIndex={-1}>
      <div className="modal-dialog modal-sm">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
            <button
              className={`btn btn-${danger ? "danger" : "primary"} btn-sm`}
              data-bs-dismiss="modal"
              onClick={onConfirm}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}