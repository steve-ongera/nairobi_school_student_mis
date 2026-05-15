// components/common/StatCard.jsx
import React from "react";

/**
 * NiceAdmin-style info card for dashboards.
 *
 * Props:
 *  title       – e.g. "Total Students"
 *  value       – e.g. "1,234"
 *  icon        – Bootstrap Icon class e.g. "bi-people"
 *  color       – "primary" | "success" | "warning" | "danger" | "info"
 *  subtitle    – small text below value e.g. "↑ 12 this month"
 *  cardClass   – extra card class e.g. "sales-card"
 */
export default function StatCard({ title, value, icon, color = "primary", subtitle, cardClass = "" }) {
  const colorMap = {
    primary: { icon: "#4154f1", bg: "#f6f6fe" },
    success: { icon: "#2eca6a", bg: "#e0f8e9" },
    warning: { icon: "#ff771d", bg: "#ffecdf" },
    danger:  { icon: "#e74c3c", bg: "#fde8e8" },
    info:    { icon: "#0dcaf0", bg: "#cff4fc" },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <div className={`card info-card stat-card ${cardClass}`}>
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <div className="d-flex align-items-center">
          <div
            className="card-icon rounded-circle d-flex align-items-center justify-content-center"
            style={{ color: c.icon, background: c.bg }}
          >
            <i className={`bi ${icon}`} />
          </div>
          <div className="ps-3">
            <h6>{value}</h6>
            {subtitle && (
              <span className="text-muted small">{subtitle}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}