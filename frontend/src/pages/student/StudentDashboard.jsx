import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStudentDashboard } from "../../utils/api";
import { formatCurrency } from "../../utils/formatters";
import { PageTitle, StatCard, LoadingSpinner, AlertMessage, GradeBadge } from "../../components/common";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

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
    student, current_invoice, fee_balance, recent_results,
    latest_mean_grade, latest_exam, attendance_this_term,
  } = data;

  const radarData = recent_results?.map((r) => ({
    subject: r.subject_name?.substring(0, 10),
    marks: parseFloat(r.marks) || 0,
  }));

  return (
    <>
      <style>{`
        /* ── Welcome Banner ── */
        .dash-banner {
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          border-radius: 20px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        .dash-banner::before {
          content: '';
          position: absolute;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          top: -80px; right: -60px;
          pointer-events: none;
        }
        .dash-banner__avatar {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 700;
          flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.3);
        }
        .dash-banner__name {
          font-size: 17px; font-weight: 700;
          color: #fff; margin: 0 0 3px;
        }
        .dash-banner__sub {
          font-size: 13px;
          color: rgba(255,255,255,0.75);
          margin: 0;
        }
        .dash-banner__grade {
          margin-left: auto;
          text-align: center;
          flex-shrink: 0;
        }
        .dash-banner__grade-val {
          font-size: 34px; font-weight: 800;
          color: #fff; line-height: 1;
        }
        .dash-banner__grade-label {
          font-size: 11px;
          color: rgba(255,255,255,0.7);
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* ── Results table ── */
        .results-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .results-table thead th {
          text-align: left;
          padding: 10px 14px;
          background: #f8fafc;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .results-table tbody td {
          padding: 11px 14px;
          border-bottom: 1px solid var(--border-light);
          vertical-align: middle;
          color: var(--text-secondary);
        }
        .results-table tbody tr:last-child td { border-bottom: none; }
        .results-table tbody tr:hover { background: #fafbfc; }

        .marks-bar {
          height: 5px;
          border-radius: 4px;
          background: var(--border);
          width: 70px;
          margin-bottom: 4px;
          overflow: hidden;
        }
        .marks-bar__fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--primary), var(--accent));
        }
        .marks-value {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 13px;
        }
        .remarks-text {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* ── Invoice card rows ── */
        .invoice-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-light);
        }
        .invoice-row:last-of-type { border-bottom: none; }
        .invoice-label {
          font-size: 13px;
          color: var(--text-muted);
        }
        .invoice-value {
          font-size: 15px;
          font-weight: 700;
        }
      `}</style>

      <PageTitle title="My Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />

      {/* ── Welcome banner ── */}
      <div className="dash-banner">
        <div className="dash-banner__avatar">
          {(student?.full_name || "S").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="dash-banner__name">{student?.full_name}</p>
          <p className="dash-banner__sub">
            {student?.admission_number} • {student?.current_classroom?.stream_display || "—"}
          </p>
        </div>
        {latest_mean_grade && (
          <div className="dash-banner__grade">
            <div className="dash-banner__grade-val">{latest_mean_grade}</div>
            <div className="dash-banner__grade-label">Mean Grade</div>
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="row">
        <div className="col-md-3">
          <StatCard
            title="Fee Balance"
            value={formatCurrency(fee_balance)}
            icon="bi-cash-coin"
            color={parseFloat(fee_balance) > 0 ? "danger" : "success"}
            subtitle={parseFloat(fee_balance) > 0 ? "Outstanding" : "Cleared"}
          />
        </div>
        <div className="col-md-3">
          <StatCard
            title="Mean Grade"
            value={latest_mean_grade || "—"}
            icon="bi-award"
            color="primary"
            subtitle={latest_exam?.name || "Latest exam"}
          />
        </div>
        <div className="col-md-3">
          <StatCard
            title="Attendance"
            value={`${attendance_this_term?.attendance_percentage ?? "—"}%`}
            icon="bi-calendar-check"
            color={attendance_this_term?.attendance_percentage >= 80 ? "success" : "warning"}
            subtitle="This term"
          />
        </div>
        <div className="col-md-3">
          <StatCard
            title="Days Present"
            value={`${attendance_this_term?.present_days ?? "—"} / ${attendance_this_term?.total_days ?? "—"}`}
            icon="bi-person-check"
            color="success"
          />
        </div>
      </div>

      <div className="row">
        {/* ── Recent Results ── */}
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">
                Recent Results
                {latest_exam && (
                  <span className="ms-2 count-chip">{latest_exam.name}</span>
                )}
              </h5>
              <Link to="/student/results" className="btn btn-outline-primary btn-sm">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              {recent_results?.length ? (
                <div className="table-responsive">
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
                          <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {r.subject_name}
                          </td>
                          <td>
                            <div className="marks-bar">
                              <div className="marks-bar__fill" style={{ width: `${r.marks}%` }} />
                            </div>
                            <span className="marks-value">{r.marks}</span>
                          </td>
                          <td><GradeBadge grade={r.grade} /></td>
                          <td>{r.points ?? "—"}</td>
                          <td><span className="remarks-text">{r.remarks || "—"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-message">
                  <i className="bi bi-journal-x fs-1 d-block mb-2" />
                  <p>No published results yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Radar + Invoice ── */}
        <div className="col-lg-5">
          {radarData?.length > 2 && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Performance Radar</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                    <Radar
                      dataKey="marks"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.2}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        fontSize: 12,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {current_invoice && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Current Term Invoice</h5>
              </div>
              <div className="card-body">
                <div className="invoice-row">
                  <span className="invoice-label">Total</span>
                  <span className="invoice-value">{formatCurrency(current_invoice.total_amount)}</span>
                </div>
                <div className="invoice-row">
                  <span className="invoice-label">Paid</span>
                  <span className="invoice-value" style={{ color: "var(--success)" }}>
                    {formatCurrency(current_invoice.amount_paid)}
                  </span>
                </div>
                <div className="invoice-row">
                  <span className="invoice-label">Balance</span>
                  <span className="invoice-value" style={{ color: "var(--danger)" }}>
                    {formatCurrency(current_invoice.balance)}
                  </span>
                </div>
                <Link to="/student/fees/pay" className="btn btn-primary btn-sm w-100 mt-3">
                  <i className="bi bi-phone" /> Pay via MPESA
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}