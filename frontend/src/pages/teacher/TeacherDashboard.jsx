import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTeacherDashboard } from "../../utils/api";
import { PageTitle, StatCard, LoadingSpinner, AlertMessage } from "../../components/common";

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

  return (
    <>
      <PageTitle title="Teacher Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />

      <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-person-badge" />
        <span>Welcome, <strong>{teacher?.user?.first_name}</strong> – TSC No: {teacher?.tsc_number || "—"}</span>
      </div>

      {/* Stats */}
      <div className="row">
        <div className="col-md-4">
          <StatCard title="Subject Allocations" value={allocations?.length || 0} icon="bi-journal-text" color="primary" />
        </div>
        <div className="col-md-4">
          <StatCard title="Students Taught" value={total_students_taught || 0} icon="bi-people" color="success" />
        </div>
        <div className="col-md-4">
          <StatCard
            title="Pending Mark Entries"
            value={pending_mark_entries?.length || 0}
            icon="bi-pencil-square"
            color={pending_mark_entries?.length > 0 ? "warning" : "success"}
          />
        </div>
      </div>

      <div className="row">
        {/* My Allocations */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">My Subject Allocations</h5>
              {allocations?.length ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>Subject</th><th>Class</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {allocations.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <span className="fw-600">{a.subject_name}</span>
                          </td>
                          <td>{a.classroom_display}</td>
                          <td>
                            <Link
                              to={`/teacher/marks/entry?subject=${a.subject}&classroom=${a.classroom}`}
                              className="btn btn-sm btn-primary"
                            >
                              <i className="bi bi-pencil me-1" />Enter Marks
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No allocations this term.</p>
              )}
            </div>
          </div>
        </div>

        {/* Pending entries */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                Pending Mark Entries
                {pending_mark_entries?.length > 0 && (
                  <span className="badge bg-warning ms-2">{pending_mark_entries.length}</span>
                )}
              </h5>
              {pending_mark_entries?.length ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>Exam</th><th>Subject</th><th>Class</th><th></th></tr>
                    </thead>
                    <tbody>
                      {pending_mark_entries.map((p, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: 13 }}>{p.exam}</td>
                          <td>{p.subject}</td>
                          <td>{p.classroom}</td>
                          <td>
                            <Link
                              to={`/teacher/marks/entry?exam=${p.exam_id}&subject=${p.subject_id}&classroom=${p.classroom_id}`}
                              className="btn btn-sm btn-warning"
                            >
                              Enter
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="bi bi-check-circle text-success" style={{ fontSize: 32 }} />
                  <p className="text-muted mt-2">All marks are up to date!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Quick Actions</h5>
          <div className="d-flex flex-wrap gap-2">
            {[
              { to: "/teacher/marks/entry", icon: "bi-pencil-square", label: "Enter Marks" },
              { to: "/teacher/marks/upload", icon: "bi-file-earmark-excel", label: "Upload Excel" },
              { to: "/teacher/attendance", icon: "bi-calendar-check", label: "Take Attendance" },
              { to: "/teacher/reports/stream", icon: "bi-bar-chart-line", label: "Stream Report" },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="btn btn-outline-primary">
                <i className={`bi ${a.icon} me-2`} />{a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}