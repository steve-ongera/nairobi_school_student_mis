import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStudentDashboard } from "../../utils/api";
import { formatCurrency } from "../../utils/formatters";
import {
  PageTitle,
  StatCard,
  LoadingSpinner,
  AlertMessage,
  GradeBadge,
} from "../../components/common";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getStudentDashboard()
      .then((r) => setData(r.data))
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading your portal…" />;
  if (error) return <AlertMessage type="danger" message={error} />;
  if (!data) return null;

  const {
    student,
    current_invoice,
    fee_balance,
    recent_results,
    latest_mean_grade,
    latest_exam,
    attendance_this_term,
  } = data;

  const radarData = recent_results?.map((r) => ({
    subject: r.subject_name?.substring(0, 10),
    marks: parseFloat(r.marks) || 0,
  }));

  const paidPct = current_invoice
    ? Math.round(
        (current_invoice.amount_paid / current_invoice.total_amount) * 100
      )
    : 0;

  return (
    <>
      <style>{`
        /* ── Google Fonts (matches main.css) ── */
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=JetBrains+Mono:wght@400;500;600&display=swap');

        /* ── Welcome Banner ── */
        .dash-banner {
          background: linear-gradient(135deg, var(--brand-700) 0%, var(--brand-500) 55%, var(--teal-500) 100%);
          border-radius: var(--radius-lg);
          padding: var(--space-6) var(--space-7);
          display: flex;
          align-items: center;
          gap: var(--space-5);
          margin-bottom: var(--space-6);
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-brand);
          transition: box-shadow var(--transition-base), transform var(--transition-base);
        }

        .dash-banner:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-xl);
        }

        /* decorative circles */
        .dash-banner::before,
        .dash-banner::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          background: rgba(255,255,255,0.06);
        }
        .dash-banner::before {
          width: 240px; height: 240px;
          top: -100px; right: -60px;
        }
        .dash-banner::after {
          width: 120px; height: 120px;
          bottom: -50px; right: 120px;
        }

        .dash-banner__avatar {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.18);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.28);
          font-family: var(--font-sans);
          letter-spacing: var(--tracking-tight);
        }

        .dash-banner__info { flex: 1; min-width: 0; }

        .dash-banner__name {
          font-size: var(--text-xl);
          font-weight: 800;
          color: #fff;
          margin: 0 0 var(--space-1);
          letter-spacing: var(--tracking-snug);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dash-banner__sub {
          font-size: var(--text-sm);
          color: rgba(255,255,255,0.72);
          margin: 0;
          font-family: var(--font-mono);
          letter-spacing: 0.02em;
        }

        .dash-banner__grade {
          margin-left: auto;
          text-align: center;
          flex-shrink: 0;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-5);
          backdrop-filter: blur(4px);
        }

        .dash-banner__grade-val {
          font-size: var(--text-5xl);
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: var(--tracking-tight);
        }

        .dash-banner__grade-label {
          font-size: var(--text-xs);
          color: rgba(255,255,255,0.65);
          margin-top: var(--space-1);
          text-transform: uppercase;
          letter-spacing: var(--tracking-widest);
          font-weight: 600;
        }

        /* ── KPI row (overrides StatCard if needed) ── */
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-5);
          margin-bottom: var(--space-6);
          animation: fadeInUp var(--duration-300) var(--ease-out);
        }

        @media (max-width: 1024px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 576px)  { .kpi-row { grid-template-columns: 1fr; } }

        /* Individual KPI card staggered fade */
        .kpi-row > *:nth-child(1) { animation: fadeInUp var(--duration-300) var(--ease-out) 0.05s both; }
        .kpi-row > *:nth-child(2) { animation: fadeInUp var(--duration-300) var(--ease-out) 0.12s both; }
        .kpi-row > *:nth-child(3) { animation: fadeInUp var(--duration-300) var(--ease-out) 0.19s both; }
        .kpi-row > *:nth-child(4) { animation: fadeInUp var(--duration-300) var(--ease-out) 0.26s both; }

        /* ── Content columns ── */
        .dash-cols {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: var(--space-5);
          align-items: start;
        }

        @media (max-width: 1100px) { .dash-cols { grid-template-columns: 1fr; } }

        /* ── Results table (aligned to data-table in main.css) ── */
        .results-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--text-sm);
          font-family: var(--font-sans);
        }

        .results-table thead th {
          padding: 11px var(--space-4);
          text-align: left;
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
          background: var(--slate-50);
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }

        .results-table tbody td {
          padding: 12px var(--space-4);
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
          color: var(--color-text-secondary);
        }

        .results-table tbody tr:last-child td { border-bottom: none; }

        .results-table tbody tr {
          transition: background var(--duration-75);
        }

        .results-table tbody tr:hover { background: var(--slate-50); }

        .cell-subject {
          font-weight: 600;
          color: var(--color-text);
          font-size: var(--text-sm);
          white-space: nowrap;
        }

        /* marks bar */
        .marks-bar {
          height: 4px;
          border-radius: var(--radius-full);
          background: var(--slate-200);
          width: 72px;
          margin-bottom: 5px;
          overflow: hidden;
        }

        .marks-bar__fill {
          height: 100%;
          border-radius: var(--radius-full);
          background: linear-gradient(90deg, var(--brand-500), var(--teal-500));
          transition: width var(--duration-500) var(--ease-out);
        }

        .marks-val {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
        }

        .remarks-text {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        /* ── Right column cards ── */
        .dash-right { display: flex; flex-direction: column; gap: var(--space-5); }

        /* ── Invoice rows (fee-row from main.css) ── */
        .invoice-rows { padding: 0; }

        .fee-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-3) var(--space-5);
          border-bottom: 1px solid var(--color-border);
          font-size: var(--text-sm);
        }

        .fee-row:last-of-type { border-bottom: none; }

        .fee-row__label {
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .fee-row__value {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
        }

        .fee-row__value--paid    { color: var(--success-600); }
        .fee-row__value--balance { color: var(--danger-600); }

        /* progress bar from main.css */
        .progress-bar {
          width: 100%;
          height: 6px;
          background: var(--slate-100);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: var(--space-1);
        }

        .progress-bar__fill {
          height: 100%;
          border-radius: var(--radius-full);
          background: linear-gradient(90deg, var(--success-500), var(--brand-500));
          transition: width var(--duration-500) var(--ease-out);
        }

        /* ── Quick links ── */
        .quick-links { display: flex; flex-direction: column; gap: var(--space-2); }

        /* ── Empty state ── */
        .empty-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-12) var(--space-8);
          color: var(--color-text-muted);
          text-align: center;
        }

        .empty-message i {
          font-size: 32px;
          margin-bottom: var(--space-3);
          opacity: 0.4;
        }

        .empty-message p {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .dash-banner {
            flex-direction: column;
            text-align: center;
            padding: var(--space-5);
          }
          .dash-banner__grade { margin-left: 0; }
          .dash-banner__grade-val { font-size: var(--text-4xl); }
          .results-table { font-size: var(--text-xs); }
          .results-table thead th,
          .results-table tbody td { padding: 9px var(--space-3); }
          .marks-bar { width: 50px; }
        }
      `}</style>

      <div className="student-dashboard-wrapper">
        <PageTitle
          title="My Dashboard"
          breadcrumbs={[{ label: "Dashboard" }]}
        />

        {/* ── Welcome Banner ── */}
        <div className="dash-banner">
          <div className="dash-banner__avatar">
            {(student?.full_name || "S").charAt(0).toUpperCase()}
          </div>
          <div className="dash-banner__info">
            <p className="dash-banner__name">{student?.full_name}</p>
            <p className="dash-banner__sub">
              {student?.admission_number} &bull;{" "}
              {student?.current_classroom?.stream_display || "—"}
            </p>
          </div>
          {latest_mean_grade && (
            <div className="dash-banner__grade">
              <div className="dash-banner__grade-val">{latest_mean_grade}</div>
              <div className="dash-banner__grade-label">Mean Grade</div>
            </div>
          )}
        </div>

        {/* ── KPI Cards ── */}
        <div className="kpi-row">
          <StatCard
            title="Fee Balance"
            value={formatCurrency(fee_balance)}
            icon="bi-cash-coin"
            color={parseFloat(fee_balance) > 0 ? "danger" : "success"}
            subtitle={parseFloat(fee_balance) > 0 ? "Outstanding" : "Cleared"}
          />
          <StatCard
            title="Mean Grade"
            value={latest_mean_grade || "—"}
            icon="bi-award"
            color="primary"
            subtitle={latest_exam?.name || "Latest exam"}
          />
          <StatCard
            title="Attendance"
            value={`${attendance_this_term?.attendance_percentage ?? "—"}%`}
            icon="bi-calendar-check"
            color={
              attendance_this_term?.attendance_percentage >= 80
                ? "success"
                : "warning"
            }
            subtitle="This term"
          />
          <StatCard
            title="Days Present"
            value={`${attendance_this_term?.present_days ?? "—"} / ${
              attendance_this_term?.total_days ?? "—"
            }`}
            icon="bi-person-check"
            color="success"
          />
        </div>

        {/* ── Main Content Columns ── */}
        <div className="dash-cols">
          {/* Left — Recent Results */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <h5 className="card-title">
                Recent Results
                {latest_exam && (
                  <span className="count-chip ms-2">{latest_exam.name}</span>
                )}
              </h5>
              <Link
                to="/student/results"
                className="btn btn-outline-primary btn-sm"
              >
                View All <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {recent_results?.length ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Points</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent_results.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <span className="cell-subject">{r.subject_name}</span>
                          </td>
                          <td>
                            <div className="marks-bar">
                              <div
                                className="marks-bar__fill"
                                style={{ width: `${Math.min(r.marks, 100)}%` }}
                              />
                            </div>
                            <span className="marks-val">{r.marks}</span>
                          </td>
                          <td>
                            <GradeBadge grade={r.grade} />
                          </td>
                          <td>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--brand-600)",
                              }}
                            >
                              {r.points ?? "—"}
                            </span>
                          </td>
                          <td>
                            <span className="remarks-text">
                              {r.remarks || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-message">
                  <i className="bi bi-journal-x" />
                  <p>No published results yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="dash-right">
            {/* Performance Radar */}
            {radarData?.length > 2 && (
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-header">
                  <h5 className="card-title">Performance Radar</h5>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={210}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--color-border)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{
                          fontSize: 11,
                          fill: "var(--color-text-muted)",
                          fontFamily: "var(--font-sans)",
                        }}
                      />
                      <Radar
                        dataKey="marks"
                        stroke="var(--brand-500)"
                        fill="var(--brand-500)"
                        fillOpacity={0.18}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--color-border)",
                          fontSize: 12,
                          fontFamily: "var(--font-sans)",
                          background: "var(--color-surface)",
                          color: "var(--color-text)",
                          boxShadow: "var(--shadow-lg)",
                        }}
                        formatter={(v) => [`${v} marks`, "Score"]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Current Invoice */}
            {current_invoice && (
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-header">
                  <h5 className="card-title">Current Term Invoice</h5>
                </div>

                <div className="invoice-rows">
                  <div className="fee-row">
                    <span className="fee-row__label">Total Fees</span>
                    <span className="fee-row__value">
                      {formatCurrency(current_invoice.total_amount)}
                    </span>
                  </div>
                  <div className="fee-row">
                    <span className="fee-row__label">Amount Paid</span>
                    <span className="fee-row__value fee-row__value--paid">
                      {formatCurrency(current_invoice.amount_paid)}
                    </span>
                  </div>
                  <div className="fee-row">
                    <span className="fee-row__label">Balance Due</span>
                    <span className="fee-row__value fee-row__value--balance">
                      {formatCurrency(current_invoice.balance)}
                    </span>
                  </div>
                </div>

                {parseFloat(current_invoice.balance) > 0 && (
                  <div className="card-body" style={{ paddingTop: 0 }}>
                    <div className="progress-bar">
                      <div
                        className="progress-bar__fill"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                    <small
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {paidPct}% paid
                    </small>
                    <Link
                      to="/student/fees/pay"
                      className="btn btn-primary btn-block mt-4"
                      style={{ width: "100%", marginTop: "var(--space-4)" }}
                    >
                      <i className="bi bi-phone me-2" />
                      Pay via M-PESA
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Quick Links */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-header">
                <h5 className="card-title">Quick Links</h5>
              </div>
              <div className="card-body">
                <div className="quick-links">
                  <Link
                    to="/student/timetable"
                    className="btn btn-outline-primary btn-sm"
                    style={{ justifyContent: "flex-start" }}
                  >
                    <i className="bi bi-calendar-week me-2" />
                    View Timetable
                  </Link>
                  <Link
                    to="/student/exams"
                    className="btn btn-outline-primary btn-sm"
                    style={{ justifyContent: "flex-start" }}
                  >
                    <i className="bi bi-journal-bookmark-fill me-2" />
                    Upcoming Exams
                  </Link>
                  <Link
                    to="/student/library"
                    className="btn btn-outline-primary btn-sm"
                    style={{ justifyContent: "flex-start" }}
                  >
                    <i className="bi bi-book me-2" />
                    Library Resources
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}