// components/common/DataTable.jsx
import React, { useState } from "react";

/**
 * Reusable data table with client-side search and pagination.
 *
 * Props:
 *  columns   – [{ key, label, render? }]
 *  data      – array of row objects
 *  loading   – bool
 *  actions   – (row) => ReactNode  (optional action buttons per row)
 *  pageSize  – rows per page (default 15)
 */
export function DataTable({
  columns = [],
  data = [],
  loading = false,
  actions,
  pageSize = 15,
  searchable = true,
  emptyMessage = "No records found.",
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const filtered = data.filter((row) => {
    if (!search) return true;
    return columns.some((col) => {
      const val = row[col.key];
      return val && String(val).toLowerCase().includes(search.toLowerCase());
    });
  });

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {searchable && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-muted small">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
          <div style={{ maxWidth: 280 }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search…"
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-hover mis-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ cursor: col.sortable !== false ? "pointer" : "default", userSelect: "none" }}
                >
                  {col.label}
                  {col.sortable !== false && sortKey === col.key && (
                    <i className={`bi bi-caret-${sortDir === "asc" ? "up" : "down"}-fill ms-1`} style={{ fontSize: 10 }} />
                  )}
                </th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-4 text-muted">
                  <i className="bi bi-inbox fs-2 d-block mb-2" />
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                    </td>
                  ))}
                  {actions && <td>{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-2">
          <small className="text-muted">
            Page {page} of {totalPages}
          </small>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item${page === 1 ? " disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(1)}>&laquo;</button>
              </li>
              <li className={`page-item${page === 1 ? " disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage((p) => p - 1)}>‹</button>
              </li>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                return (
                  <li key={p} className={`page-item${p === page ? " active" : ""}`}>
                    <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                  </li>
                );
              })}
              <li className={`page-item${page === totalPages ? " disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage((p) => p + 1)}>›</button>
              </li>
              <li className={`page-item${page === totalPages ? " disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(totalPages)}>&raquo;</button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// LoadingSpinner
// -------------------------------------------------------------------
export function LoadingSpinner({ fullPage = false, message = "Loading…" }) {
  const style = fullPage
    ? {
        position: "fixed", inset: 0, background: "rgba(246,249,255,0.8)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", zIndex: 9999,
      }
    : { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 };

  return (
    <div style={style} className="page-loading">
      <div className="spinner-border text-primary" role="status" style={{ width: 40, height: 40 }}>
        <span className="visually-hidden">Loading…</span>
      </div>
      <p className="mt-3 text-muted small">{message}</p>
    </div>
  );
}

// -------------------------------------------------------------------
// AlertMessage
// -------------------------------------------------------------------
export function AlertMessage({ type = "info", message, onClose, className = "" }) {
  if (!message) return null;
  const icons = { success: "bi-check-circle", danger: "bi-x-circle", warning: "bi-exclamation-triangle", info: "bi-info-circle" };
  return (
    <div className={`alert alert-${type} alert-dismissible fade show d-flex align-items-center ${className}`} role="alert">
      <i className={`bi ${icons[type] || icons.info} me-2`} />
      <div>{message}</div>
      {onClose && (
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Badge
// -------------------------------------------------------------------
export function Badge({ label, color = "secondary", pill = true, className = "" }) {
  return (
    <span className={`badge bg-${color}${pill ? " rounded-pill" : ""} ${className}`}>
      {label}
    </span>
  );
}

// -------------------------------------------------------------------
// GradeBadge
// -------------------------------------------------------------------
export function GradeBadge({ grade }) {
  const { gradeColor } = require("../../utils/formatters");
  return (
    <span
      className={`grade-badge text-white bg-${gradeColor(grade)}`}
    >
      {grade || "—"}
    </span>
  );
}

// -------------------------------------------------------------------
// EmptyState
// -------------------------------------------------------------------
export function EmptyState({ icon = "bi-inbox", title = "Nothing here yet", message, action }) {
  return (
    <div className="text-center py-5">
      <i className={`bi ${icon} text-muted`} style={{ fontSize: 48 }} />
      <h5 className="mt-3 text-muted">{title}</h5>
      {message && <p className="text-muted small">{message}</p>}
      {action}
    </div>
  );
}

// -------------------------------------------------------------------
// ConfirmDialog
// -------------------------------------------------------------------
export function ConfirmDialog({ show, title, message, onConfirm, onCancel, confirmLabel = "Delete", confirmColor = "danger" }) {
  if (!show) return null;
  return (
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button className="btn-close" onClick={onCancel} />
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button className={`btn btn-${confirmColor}`} onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Modal wrapper
// -------------------------------------------------------------------
export function Modal({ show, title, onClose, children, size = "" }) {
  if (!show) return null;
  return (
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
      <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable${size ? ` modal-${size}` : ""}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}