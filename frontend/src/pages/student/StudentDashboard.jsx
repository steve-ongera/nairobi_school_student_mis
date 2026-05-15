import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStudentDashboard } from "../../utils/api";
import { formatCurrency, formatDate } from "../../utils/formatters";
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
      <PageTitle title="My Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />

      {/* Welcome banner */}
      <div className="card mb-3"
        style={{ background: "linear-gradient(135deg,#4154f1,#012970)", color: "#fff", border: "none" }}>
        <div className="card-body d-flex align-items-center gap-3 py-3">
          <div
            style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 700,
            }}
          >
            {(student?.full_name || "S").charAt(0)}
          </div>
          <div>
            <h5 className="mb-0">{student?.full_name}</h5>
            <small style={{ opacity: 0.8 }}>
              {student?.admission_number} • {student?.current_classroom?.stream_display || "—"}
            </small>
          </div>
          {latest_mean_grade && (
            <div className="ms-auto text-center">
              <div style={{ fontSize: 32, fontWeight: 800 }}>{latest_mean_grade}</div>
              <small style={{ opacity: 0.8 }}>Mean Grade</small>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
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
        {/* Recent Results */}
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                Recent Results
                {latest_exam && <span> – {latest_exam.name}</span>}
              </h5>
              {recent_results?.length ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>Subject</th><th>Marks</th><th>Grade</th><th>Points</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {recent_results.map((r) => (
                        <tr key={r.id}>
                          <td className="fw-600">{r.subject_name}</td>
                          <td>
                            <div className="progress" style={{ height: 6, marginBottom: 4, width: 80 }}>
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: `${r.marks}%` }}
                              />
                            </div>
                            {r.marks}
                          </td>
                          <td><GradeBadge grade={r.grade} /></td>
                          <td>{r.points ?? "—"}</td>
                          <td style={{ fontSize: 12, color: "#899bbd" }}>{r.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center py-3">No published results yet.</p>
              )}
              <Link to="/student/results" className="btn btn-outline-primary btn-sm mt-2">
                View All Results →
              </Link>
            </div>
          </div>
        </div>

        {/* Radar chart + Fees */}
        <div className="col-lg-5">
          {radarData?.length > 2 && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Performance Radar</h5>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#ebeef4" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <Radar dataKey="marks" stroke="#4154f1" fill="#4154f1" fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Current Invoice */}
          {current_invoice && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Current Term Invoice</h5>
                {[
                  { label: "Total", value: formatCurrency(current_invoice.total_amount) },
                  { label: "Paid", value: formatCurrency(current_invoice.amount_paid), color: "success" },
                  { label: "Balance", value: formatCurrency(current_invoice.balance), color: "danger" },
                ].map((row) => (
                  <div key={row.label} className="d-flex justify-content-between mb-2">
                    <span className="text-muted">{row.label}</span>
                    <span className={`fw-700 ${row.color ? `text-${row.color}` : ""}`}>{row.value}</span>
                  </div>
                ))}
                <Link to="/student/fees/pay" className="btn btn-primary btn-sm w-100 mt-2">
                  <i className="bi bi-phone me-2" />Pay via MPESA
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}