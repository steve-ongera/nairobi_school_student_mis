// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { getAdminDashboard } from "../../utils/api";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage } from "../../components/common";

// ── Chart colours ─────────────────────────────────────────────────────────────
const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#7c3aed", "#06b6d4", "#ec4899", "#14b8a6"];

const customTooltip = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.98)",
    boxShadow: "var(--shadow-lg)",
    fontSize: 12,
    padding: "10px 14px",
  },
  labelStyle: { fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 },
  itemStyle: { padding: "2px 0" },
};

// ── Quick actions config ───────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { to: "/admin/students/new",              icon: "bi-person-plus",    label: "Admit Student" },
  { to: "/admin/exams/new",                 icon: "bi-journal-plus",   label: "Create Exam" },
  { to: "/admin/finance/invoices/generate", icon: "bi-receipt",        label: "Invoices" },
  { to: "/admin/students/promote",          icon: "bi-arrow-up-circle",label: "Promote" },
  { to: "/admin/teachers/new",              icon: "bi-person-badge",   label: "Add Teacher" },
  { to: "/admin/attendance",                icon: "bi-calendar-check", label: "Attendance" },
  { to: "/admin/finance/mpesa",             icon: "bi-phone",          label: "MPESA" },
  { to: "/admin/settings/grading",          icon: "bi-gear",           label: "Settings" },
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load dashboard data. Please refresh the page."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error) return <AlertMessage type="danger" message={error} />;
  if (!data) return null;

  const collRate = parseFloat(data.collection_rate || 0);

  // ── Derived stat cards from real API data ──────────────────────────────────
  const statCards = [
    {
      label: "Active Students",
      value: (data.active_students || 0).toLocaleString(),
      icon: "bi-people-fill",
      bg: "#dbeafe",
      fg: "#2563eb",
      subtitle: "Enrolled this year",
    },
    {
      label: "Teachers",
      value: data.total_teachers || 0,
      icon: "bi-person-badge-fill",
      bg: "#d1fae5",
      fg: "#10b981",
      subtitle: "Active staff",
    },
    {
      label: "Classrooms",
      value: data.total_classrooms || 0,
      icon: "bi-building",
      bg: "#fed7aa",
      fg: "#f59e0b",
      subtitle: "In use",
    },
    {
      label: "Collection Rate",
      value: `${collRate.toFixed(1)}%`,
      icon: "bi-cash-coin",
      bg: collRate >= 80 ? "#d1fae5" : collRate >= 60 ? "#fef3c7" : "#fee2e2",
      fg: collRate >= 80 ? "#10b981" : collRate >= 60 ? "#f59e0b" : "#ef4444",
      subtitle: "Fee collection",
    },
  ];

  // ── Payment method badge colour ────────────────────────────────────────────
  const methodStyle = (method) => {
    const m = method?.toLowerCase();
    if (m === "mpesa")  return { background: "#ecfdf5", color: "#10b981" };
    if (m === "bank")   return { background: "#eff6ff", color: "#2563eb" };
    return { background: "#fef3c7", color: "#f59e0b" }; // cash / other
  };

  return (
    <>
      <PageTitle title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />

      {/* ── Welcome banner ── */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
          border: "none",
          marginBottom: 28,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative blob */}
        <div
          style={{
            position: "absolute", top: "-50%", right: "-10%",
            width: 280, height: 280,
            background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
            borderRadius: "50%", pointerEvents: "none",
          }}
        />
        <div className="card-body" style={{ padding: "24px 32px", position: "relative", zIndex: 1 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h4 style={{ color: "white", fontWeight: 700, margin: 0 }}>Welcome back, Admin</h4>
              <p style={{ color: "rgba(255,255,255,0.85)", margin: "4px 0 0", fontSize: 13 }}>
                Here's what's happening with your school today.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
                  padding: "6px 16px", borderRadius: 40, fontSize: 13, color: "white",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <i className="bi bi-calendar-week" />
                {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
              {(data.current_academic_year || data.current_term) && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
                    padding: "5px 14px", borderRadius: 10, fontSize: 12, color: "rgba(255,255,255,0.9)",
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="row">
        {statCards.map((item) => (
          <div key={item.label} className="col-md-3">
            <div className="card info-card">
              <div className="card-body">
                <h5 className="card-title">{item.label}</h5>
                <div className="d-flex align-items-center">
                  <div
                    className="card-icon rounded-circle d-flex align-items-center justify-content-center"
                    style={{ background: item.bg, color: item.fg }}
                  >
                    <i className={`bi ${item.icon}`} />
                  </div>
                  <div className="ps-3">
                    <h6 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{item.value}</h6>
                    <small style={{ color: "var(--text-muted)", fontSize: 11 }}>{item.subtitle}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="card">
        <div className="card-body" style={{ padding: "0 24px" }}>
          <ul className="nav-tabs-custom">
            {[
              { key: "overview",  icon: "bi-speedometer2",         label: "Overview" },
              { key: "finance",   icon: "bi-cash-stack",            label: "Finance" },
              { key: "academics", icon: "bi-journal-bookmark-fill", label: "Academics" },
            ].map((tab) => (
              <li key={tab.key}>
                <button
                  className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <i className={`bi ${tab.icon}`} style={{ marginRight: 6 }} />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === "overview" && (
        <>
          <div className="row">
            {/* Fee Summary */}
            <div className="col-lg-5">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="card-title mb-0">Fee Summary</h5>
                    <Link to="/admin/finance" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 500 }}>
                      View All →
                    </Link>
                  </div>

                  {/* Expected / Collected / Outstanding */}
                  <div className="row g-2 mb-3">
                    {[
                      { label: "Expected",    value: data.total_fees_expected,    bg: "#eff6ff", fg: "var(--primary)" },
                      { label: "Collected",   value: data.total_fees_collected,   bg: "#ecfdf5", fg: "var(--success)" },
                      { label: "Outstanding", value: data.total_fees_outstanding, bg: "#fef2f2", fg: "var(--danger)" },
                    ].map((f) => (
                      <div key={f.label} className="col-4">
                        <div style={{ background: f.bg, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{f.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: f.fg }}>
                            {formatCurrency(f.value)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between" style={{ fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "var(--text-muted)" }}>Collection Progress</span>
                      <strong>{collRate.toFixed(1)}%</strong>
                    </div>
                    <div style={{ height: 8, background: "var(--border)", borderRadius: 10, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%", borderRadius: 10,
                          width: `${Math.min(collRate, 100)}%`,
                          background: "linear-gradient(90deg, var(--primary), var(--accent))",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Students per form bar chart */}
                  {data.students_per_form?.length > 0 && (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={data.students_per_form} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="form" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                        <Tooltip {...customTooltip} />
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
            </div>

            {/* Recent Payments */}
            <div className="col-lg-7">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="card-title mb-0">
                      Recent Payments
                      {data.recent_payments?.length > 0 && (
                        <span className="count-chip" style={{ marginLeft: 10, fontSize: 12 }}>
                          {data.recent_payments.length}
                        </span>
                      )}
                    </h5>
                    <Link to="/admin/finance/payments" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 500 }}>
                      View All →
                    </Link>
                  </div>

                  {data.recent_payments?.length ? (
                    <div className="table-responsive">
                      <table className="table table-hover table-bordered align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Student</th>
                            <th>Adm No</th>
                            <th>Reference</th>
                            <th>Method</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recent_payments.map((p) => (
                            <tr key={p.id}>
                              {/* Student name — once per row */}
                              <td className="fw-600" style={{ whiteSpace: "nowrap" }}>
                                {p.invoice?.student_name || p.student_name || "—"}
                              </td>
                              <td>
                                <code className="adm-link" style={{ fontSize: 12 }}>
                                  {p.invoice?.admission_no || "—"}
                                </code>
                              </td>
                              <td>
                                <code style={{ fontSize: 11, background: "var(--border-light)", padding: "3px 7px", borderRadius: 6 }}>
                                  {p.transaction_reference}
                                </code>
                              </td>
                              <td>
                                <span
                                  className="pill"
                                  style={{ ...methodStyle(p.payment_method), fontWeight: 600, fontSize: 11 }}
                                >
                                  {p.payment_method}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700, color: "var(--success)" }}>
                                {formatCurrency(p.amount)}
                              </td>
                              <td>
                                <span
                                  className={`badge bg-${p.confirmed ? "success" : "warning"}`}
                                  style={{ fontSize: 11 }}
                                >
                                  {p.confirmed ? "Confirmed" : "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-message">
                      <i className="bi bi-cash" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
                      No recent payments.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Finance ── */}
      {activeTab === "finance" && (
        <div className="card">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="card-title mb-0">Annual Revenue Overview</h5>
              <div style={{ display: "flex", gap: 16, fontSize: 12, alignItems: "center" }}>
                <span><i className="bi bi-circle-fill" style={{ color: "#2563eb", marginRight: 4 }} />Revenue</span>
                <span><i className="bi bi-circle-fill" style={{ color: "#ef4444", marginRight: 4 }} />Expenses</span>
              </div>
            </div>

            {/* Fee breakdown summary cards */}
            {data.total_fees_expected > 0 && (
              <div className="row g-3 mb-4">
                {[
                  { label: "Total Expected",    value: data.total_fees_expected,    bg: "#eff6ff", fg: "var(--primary)",  icon: "bi-wallet2" },
                  { label: "Total Collected",   value: data.total_fees_collected,   bg: "#ecfdf5", fg: "var(--success)",  icon: "bi-check-circle" },
                  { label: "Total Outstanding", value: data.total_fees_outstanding, bg: "#fef2f2", fg: "var(--danger)",   icon: "bi-exclamation-circle" },
                ].map((item) => (
                  <div key={item.label} className="col-md-4">
                    <div className="card info-card" style={{ marginBottom: 0 }}>
                      <div className="card-body">
                        <h5 className="card-title">{item.label}</h5>
                        <div className="d-flex align-items-center">
                          <div
                            className="card-icon rounded-circle d-flex align-items-center justify-content-center"
                            style={{ background: item.bg, color: item.fg }}
                          >
                            <i className={`bi ${item.icon}`} />
                          </div>
                          <div className="ps-3">
                            <h6 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: item.fg }}>
                              {formatCurrency(item.value)}
                            </h6>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center text-muted py-4" style={{ fontSize: 13 }}>
              <i className="bi bi-graph-up" style={{ fontSize: 32, display: "block", marginBottom: 8, color: "var(--primary)" }} />
              Monthly revenue trend chart will appear once transaction history is available.
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Academics ── */}
      {activeTab === "academics" && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-3">Students by Form</h5>
            {data.students_per_form?.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.students_per_form} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="form" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <Tooltip {...customTooltip} />
                  <Bar dataKey="count" name="Students" radius={[8, 8, 0, 0]}>
                    {data.students_per_form.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-message">
                <i className="bi bi-bar-chart" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
                No student distribution data available.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Quick Actions</h5>
          <div className="d-flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.to} to={a.to} className="btn btn-outline-primary">
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