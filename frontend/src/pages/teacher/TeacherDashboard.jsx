import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTeacherDashboard } from "../../utils/api";
import { PageTitle, LoadingSpinner, AlertMessage } from "../../components/common";

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTeacherDashboard()
      .then((r) => setData(r.data))
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading teacher portal…" />;
  if (error) return <AlertMessage type="danger" message={error} />;
  if (!data) return null;

  const { teacher, allocations, total_students_taught, pending_mark_entries } = data;

  const statCards = [
    {
      label: "Subject Allocations",
      value: allocations?.length || 0,
      icon: "bi-journal-text",
      bg: "#f6f6fe",
      fg: "#4154f1",
    },
    {
      label: "Students Taught",
      value: total_students_taught || 0,
      icon: "bi-people",
      bg: "#e0f8e9",
      fg: "#2eca6a",
    },
    {
      label: "Pending Mark Entries",
      value: pending_mark_entries?.length || 0,
      icon: "bi-pencil-square",
      bg: pending_mark_entries?.length > 0 ? "#fff3cd" : "#e0f8e9",
      fg: pending_mark_entries?.length > 0 ? "#ffc107" : "#2eca6a",
    },
  ];

  const quickActions = [
    { to: "/teacher/marks/entry",    icon: "bi-pencil-square",       label: "Enter Marks" },
    { to: "/teacher/marks/upload",   icon: "bi-file-earmark-excel",  label: "Upload Excel" },
    { to: "/teacher/attendance",     icon: "bi-calendar-check",      label: "Take Attendance" },
    { to: "/teacher/reports/stream", icon: "bi-bar-chart-line",      label: "Stream Report" },
  ];

  return (
    <>
      <PageTitle title="Teacher Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />

      {/* ── Welcome banner ── */}
      <div className="card" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)", border: "none", marginBottom: 28 }}>
        <div className="card-body" style={{ padding: "20px 24px" }}>
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color: "white",
                flexShrink: 0,
              }}
            >
              <i className="bi bi-person-badge" />
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
                Welcome back, {teacher?.user?.first_name}
              </div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                TSC No: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{teacher?.tsc_number || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="row">
        {statCards.map((item) => (
          <div key={item.label} className="col-md-4">
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
                    <h6 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{item.value}</h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        {/* ── My Allocations ── */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="card-title mb-0">My Subject Allocations</h5>
                {allocations?.length > 0 && (
                  <span className="count-chip">{allocations.length}</span>
                )}
              </div>

              {allocations?.length ? (
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Subject</th>
                        <th>Class</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((a) => (
                        <tr key={a.id}>
                          <td className="fw-600">{a.subject_name}</td>
                          <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                            {a.classroom_display}
                          </td>
                          <td>
                            <Link
                              to={`/teacher/marks/entry?subject=${a.subject}&classroom=${a.classroom}`}
                              className="tbl-btn tbl-btn--view"
                              title="Enter Marks"
                              style={{ width: "auto", padding: "4px 12px", borderRadius: 8, gap: 6, display: "inline-flex" }}
                            >
                              <i className="bi bi-pencil" /> Enter Marks
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-message">
                  <i className="bi bi-journal-x" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
                  No allocations this term.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Pending Mark Entries ── */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="card-title mb-0">Pending Mark Entries</h5>
                {pending_mark_entries?.length > 0 && (
                  <span
                    className="count-chip"
                    style={{ background: "#fff3cd", color: "#b45309" }}
                  >
                    {pending_mark_entries.length}
                  </span>
                )}
              </div>

              {pending_mark_entries?.length ? (
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Exam</th>
                        <th>Subject</th>
                        <th>Class</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending_mark_entries.map((p, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: 13 }}>{p.exam}</td>
                          <td className="fw-600">{p.subject}</td>
                          <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{p.classroom}</td>
                          <td>
                            <Link
                              to={`/teacher/marks/entry?exam=${p.exam_id}&subject=${p.subject_id}&classroom=${p.classroom_id}`}
                              className="tbl-btn tbl-btn--edit"
                              title="Enter Marks"
                              style={{ width: "auto", padding: "4px 12px", borderRadius: 8, gap: 6, display: "inline-flex" }}
                            >
                              <i className="bi bi-pencil-square" /> Enter
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-check-circle" style={{ fontSize: 36, color: "var(--success)", display: "block", marginBottom: 8 }} />
                  <p className="text-muted mb-0">All marks are up to date!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Quick Actions</h5>
          <div className="d-flex flex-wrap gap-2">
            {quickActions.map((a) => (
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