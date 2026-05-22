// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { getAdminDashboard } from "../../utils/api";
import { formatCurrency } from "../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage } from "../../components/common";

// ── Chart colours (match --brand / semantic palette) ──────────────────────────
const CHART_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
  "#0ea5e9", "#14b8a6", "#ec4899", "#4338ca",
];

const chartTooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    boxShadow: "0 8px 24px -4px rgb(15 23 42 / 0.12)",
    fontSize: 12,
    padding: "10px 14px",
  },
  labelStyle: { fontWeight: 700, color: "var(--color-text)", marginBottom: 4 },
};

// ── Quick actions ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { to: "/admin/students/new",              icon: "bi-person-plus",     label: "Admit Student" },
  { to: "/admin/exams/new",                 icon: "bi-journal-plus",    label: "Create Exam"   },
  { to: "/admin/finance/invoices/generate", icon: "bi-receipt",         label: "Invoices"      },
  { to: "/admin/students/promote",          icon: "bi-arrow-up-circle", label: "Promote"       },
  { to: "/admin/teachers/new",              icon: "bi-person-badge",    label: "Add Teacher"   },
  { to: "/admin/attendance",                icon: "bi-calendar-check",  label: "Attendance"    },
  { to: "/admin/finance/mpesa",             icon: "bi-phone",           label: "MPESA"         },
  { to: "/admin/settings/grading",          icon: "bi-gear",            label: "Settings"      },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load dashboard data. Please refresh the page."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error)   return <AlertMessage type="danger" message={error} />;
  if (!data)   return null;

  const collRate = parseFloat(data.collection_rate || 0);

  // ── KPI cards ──────────────────────────────────────────────────────────────
  const kpiCards = [
    {
      label:    "Active Students",
      value:    (data.active_students || 0).toLocaleString(),
      icon:     "bi-people-fill",
      color:    "blue",
      subtitle: "Enrolled this year",
    },
    {
      label:    "Teachers",
      value:    data.total_teachers || 0,
      icon:     "bi-person-badge-fill",
      color:    "green",
      subtitle: "Active staff",
    },
    {
      label:    "Classrooms",
      value:    data.total_classrooms || 0,
      icon:     "bi-building",
      color:    "amber",
      subtitle: "In use",
    },
    {
      label:    "Collection Rate",
      value:    `${collRate.toFixed(1)}%`,
      icon:     "bi-cash-coin",
      color:    collRate >= 80 ? "green" : collRate >= 60 ? "amber" : "red",
      subtitle: "Fee collection",
    },
  ];

  // ── Payment method pill style ──────────────────────────────────────────────
  const methodClass = (method) => {
    const m = method?.toLowerCase();
    if (m === "mpesa") return "pill--active";
    if (m === "bank")  return "pill--day";
    return "pill--boarding";
  };

  return (
    <>
      <PageTitle title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />

      {/* ── Welcome banner ─────────────────────────────────────────────────── */}
      <div
        className="card mb-6"
        style={{
          background: "linear-gradient(135deg, var(--brand-800) 0%, var(--brand-500) 60%, var(--teal-500) 100%)",
          border: "none",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* decorative circle */}
        <span
          aria-hidden
          style={{
            position: "absolute", top: "-60%", right: "-8%",
            width: 300, height: 300,
            background: "radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)",
            borderRadius: "50%", pointerEvents: "none",
          }}
        />
        <div className="card-body" style={{ padding: "24px 32px", position: "relative", zIndex: 1 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h4 style={{ color: "white", fontWeight: 800, margin: 0, fontSize: "var(--text-2xl)" }}>
                Welcome back, Admin
              </h4>
              <p style={{ color: "rgba(255,255,255,0.80)", margin: "4px 0 0", fontSize: "var(--text-sm)" }}>
                Here's what's happening with your school today.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <span
                style={{
                  background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
                  padding: "6px 16px", borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-sm)", color: "white",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <i className="bi bi-calendar-week" />
                {new Date().toLocaleDateString("en-KE", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </span>
              {(data.current_academic_year || data.current_term) && (
                <span
                  style={{
                    background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
                    padding: "5px 14px", borderRadius: "var(--radius)",
                    fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.9)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <i className="bi bi-mortarboard" />
                  {data.current_academic_year?.year}
                  {data.current_term && (
                    <span style={{ opacity: 0.75 }}>
                      • {data.current_term?.name || `Term ${data.current_term?.term_number}`}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI grid ───────────────────────────────────────────────────────── */}
      <div className="kpi-grid">
        {kpiCards.map((card) => (
          <div key={card.label} className={`kpi-card kpi-card--${card.color}`}>
            <div className="kpi-card__header">
              <div className="kpi-card__icon">
                <i className={`bi ${card.icon}`} />
              </div>
            </div>
            <div className="kpi-card__value">{card.value}</div>
            <div className="kpi-card__label">{card.label}</div>
            <div className="kpi-card__meta">{card.subtitle}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="card mb-5">
        <div className="card-body" style={{ padding: "0 var(--space-6)" }}>
          <div className="tabs">
            {[
              { key: "overview",  icon: "bi-speedometer2",          label: "Overview"  },
              { key: "finance",   icon: "bi-cash-stack",             label: "Finance"   },
              { key: "academics", icon: "bi-journal-bookmark-fill",  label: "Academics" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`tab-item${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <i className={`bi ${tab.icon}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab: Overview ──────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid-2">

          {/* Fee Summary */}
          <div className="card">
            <div className="card-header">
              <div>
                <h5 className="card-title">Fee Summary</h5>
                <p className="card-subtitle">Current term collection status</p>
              </div>
              <Link to="/admin/finance" className="btn btn-ghost btn-sm">
                View All <i className="bi bi-arrow-right" />
              </Link>
            </div>
            <div className="card-body">
              {/* Three mini stat boxes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                {[
                  { label: "Expected",    value: data.total_fees_expected,    cls: "bg-info"    },
                  { label: "Collected",   value: data.total_fees_collected,   cls: "bg-success" },
                  { label: "Outstanding", value: data.total_fees_outstanding, cls: "bg-danger"  },
                ].map((f) => (
                  <div key={f.label} className={`${f.cls}`} style={{ borderRadius: "var(--radius)", padding: "var(--space-3)", textAlign: "center" }}>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 800 }}>{formatCurrency(f.value)}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: "var(--text-sm)" }}>
                  <span className="text-muted">Collection Progress</span>
                  <strong>{collRate.toFixed(1)}%</strong>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar__fill progress-bar__fill--${collRate >= 80 ? "success" : collRate >= 60 ? "warning" : "danger"}`}
                    style={{ width: `${Math.min(collRate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Students per form */}
              {data.students_per_form?.length > 0 && (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={data.students_per_form} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="form" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                      {data.students_per_form.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="card">
            <div className="card-header">
              <div>
                <h5 className="card-title">
                  Recent Payments
                  {data.recent_payments?.length > 0 && (
                    <span className="count-chip ms-2">{data.recent_payments.length}</span>
                  )}
                </h5>
                <p className="card-subtitle">Latest fee transactions</p>
              </div>
              <Link to="/admin/finance/payments" className="btn btn-ghost btn-sm">
                View All <i className="bi bi-arrow-right" />
              </Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {data.recent_payments?.length ? (
                <>
                  <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Reference</th>
                          <th>Method</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_payments.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="cell-person">
                                <div className="cell-avatar cell-avatar--indigo">
                                  {(p.invoice?.student_name || p.student_name || "?").charAt(0)}
                                </div>
                                <div>
                                  <div className="cell-name">{p.invoice?.student_name || p.student_name || "—"}</div>
                                  <div className="cell-meta cell-mono">{p.invoice?.admission_no || "—"}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="cell-mono">{p.transaction_reference}</span>
                            </td>
                            <td>
                              <span className={`pill ${methodClass(p.payment_method)}`}>
                                {p.payment_method}
                              </span>
                            </td>
                            <td>
                              <span className="text-success fw-700 text-mono">
                                {formatCurrency(p.amount)}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge--${p.confirmed ? "success" : "warning"}`}>
                                {p.confirmed ? "Confirmed" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state__icon">
                    <i className="bi bi-cash" />
                  </div>
                  <p className="empty-state__desc">No recent payments found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Finance ───────────────────────────────────────────────────── */}
      {activeTab === "finance" && (
        <div className="card">
          <div className="card-header">
            <div>
              <h5 className="card-title">Annual Revenue Overview</h5>
              <p className="card-subtitle">Fee collection breakdown for current year</p>
            </div>
          </div>
          <div className="card-body">
            {data.total_fees_expected > 0 && (
              <div className="kpi-grid" style={{ marginBottom: "var(--space-6)" }}>
                {[
                  { label: "Total Expected",    value: data.total_fees_expected,    color: "blue",  icon: "bi-wallet2"            },
                  { label: "Total Collected",   value: data.total_fees_collected,   color: "green", icon: "bi-check-circle"       },
                  { label: "Total Outstanding", value: data.total_fees_outstanding, color: "red",   icon: "bi-exclamation-circle" },
                ].map((item) => (
                  <div key={item.label} className={`kpi-card kpi-card--${item.color}`}>
                    <div className="kpi-card__header">
                      <div className="kpi-card__icon"><i className={`bi ${item.icon}`} /></div>
                    </div>
                    <div className="kpi-card__value">{formatCurrency(item.value)}</div>
                    <div className="kpi-card__label">{item.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="empty-state">
              <div className="empty-state__icon">
                <i className="bi bi-graph-up" />
              </div>
              <p className="empty-state__title" style={{ fontSize: "var(--text-md)" }}>Revenue Trend</p>
              <p className="empty-state__desc">
                Monthly revenue chart will appear once transaction history is available.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Academics ─────────────────────────────────────────────────── */}
      {activeTab === "academics" && (
        <div className="card">
          <div className="card-header">
            <h5 className="card-title">Students by Form</h5>
          </div>
          <div className="card-body">
            {data.students_per_form?.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.students_per_form} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="form" tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="count" name="Students" radius={[8, 8, 0, 0]}>
                    {data.students_per_form.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon"><i className="bi bi-bar-chart" /></div>
                <p className="empty-state__desc">No student distribution data available.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quick Actions ───────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title">Quick Actions</h5>
        </div>
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.to} to={a.to} className="btn btn-outline">
                <i className={`bi ${a.icon}`} />
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}