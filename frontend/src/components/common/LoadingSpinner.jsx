// frontend/src/components/common/LoadingSpinner.jsx
import React from 'react';

export const LoadingSpinner = ({ fullPage = false, message = "Loading…" }) => {
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
};