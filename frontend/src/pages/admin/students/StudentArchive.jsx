// src/pages/admin/students/StudentArchive.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { getArchivedStudents } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import { PageTitle, SearchBar, AlertMessage } from "../../../components/common";

const STATUS_STYLES = {
  graduated:   { bg: "#ecfdf5", color: "#065f46", icon: "bi-mortarboard-fill" },
  inactive:    { bg: "#f1f5f9", color: "#475569", icon: "bi-person-slash" },
  transferred: { bg: "#fef3c7", color: "#b45309", icon: "bi-arrow-right-circle" },
};

export default function StudentArchive() {
  const [search, setSearch] = useState("");

  const { data: response, loading, error } = useFetch(
    () => getArchivedStudents(search ? { search } : {}),
    [search]
  );

  const students =
    response?.results ?? response?.data ?? (Array.isArray(response) ? response : []);

  // Client-side search filter as fallback
  const filtered = search
    ? students.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          s.admission_number?.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  // Group by status
  const grouped = filtered.reduce((acc, s) => {
    const key = s.status || "inactive";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const statusOrder = ["graduated", "transferred", "inactive"];

  return (
    <>
      <PageTitle
        title="Student Archive"
        breadcrumbs={[{ label: "Students" }, { label: "Archive" }]}
      />

      {error && <AlertMessage type="danger" message={error} />}

      <div className="card">
        <div className="card-body">
          {/* ── Toolbar ── */}
          <div className="tbl-toolbar">
            <div>
              <h5 className="card-title mb-0">
                Archived Students
                {students.length > 0 && (
                  <span className="count-chip" style={{ marginLeft: 10, fontSize: 13 }}>
                    {students.length}
                  </span>
                )}
              </h5>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>
                Graduated, transferred, and inactive students
              </p>
            </div>
            <div className="tbl-toolbar__right">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name or adm no…"
              />
              <Link to="/admin/students" className="btn btn-outline-primary btn-sm">
                <i className="bi bi-people" /> Active Students
              </Link>
            </div>
          </div>

          {/* ── Status summary chips ── */}
          {!loading && students.length > 0 && (
            <div className="d-flex gap-2 flex-wrap mb-4">
              {statusOrder.map((status) => {
                const count = grouped[status]?.length || 0;
                if (!count) return null;
                const style = STATUS_STYLES[status] || STATUS_STYLES.inactive;
                return (
                  <div
                    key={status}
                    style={{
                      background: style.bg, color: style.color,
                      padding: "6px 14px", borderRadius: 8,
                      fontSize: 13, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <i className={`bi ${style.icon}`} />
                    {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm me-2" />
              Loading archived students…
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && filtered.length === 0 && (
            <div className="empty-message">
              <i
                className="bi bi-archive"
                style={{ fontSize: 36, display: "block", marginBottom: 8 }}
              />
              {search ? "No archived students match your search." : "No archived students found."}
            </div>
          )}

          {/* ── Table grouped by status ── */}
          {!loading && filtered.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Adm No</th>
                    <th>Student</th>
                    <th>Last Class</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Admitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {statusOrder.map((status) => {
                    const group = grouped[status];
                    if (!group?.length) return null;
                    const style = STATUS_STYLES[status] || STATUS_STYLES.inactive;

                    return [
                      /* Group header row */
                      <tr key={`hdr-${status}`} style={{ background: "#f8fafc" }}>
                        <td
                          colSpan={7}
                          style={{
                            padding: "10px 16px",
                            fontWeight: 700,
                            fontSize: 12,
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                            color: style.color,
                          }}
                        >
                          <i className={`bi ${style.icon}`} style={{ marginRight: 8 }} />
                          {status.charAt(0).toUpperCase() + status.slice(1)} ({group.length})
                        </td>
                      </tr>,

                      /* Data rows */
                      ...group.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <Link to={`/admin/students/${s.id}`} className="adm-link">
                              {s.admission_number}
                            </Link>
                          </td>

                          <td>
                            <div className="student-cell">
                              <div className="student-avatar">
                                {s.full_name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="student-cell__name fw-600">{s.full_name}</div>
                                {s.email && (
                                  <div className="student-cell__sub">{s.email}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                            {s.current_classroom_display || "—"}
                          </td>

                          <td>
                            {s.gender ? (
                              <span className={`pill pill--${s.gender.toLowerCase()}`}>
                                <i
                                  className={`bi bi-gender-${
                                    s.gender.toLowerCase() === "male" ? "male" : "female"
                                  }`}
                                />
                                {s.gender.charAt(0).toUpperCase() + s.gender.slice(1)}
                              </span>
                            ) : "—"}
                          </td>

                          <td>
                            <span
                              className="pill"
                              style={{
                                background: style.bg,
                                color: style.color,
                                fontWeight: 600,
                                fontSize: 11,
                              }}
                            >
                              <i className={`bi ${style.icon}`} />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>

                          <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                            {formatDate(s.admission_date)}
                          </td>

                          <td>
                            <div className="tbl-actions">
                              <Link
                                to={`/admin/students/${s.id}`}
                                className="tbl-btn tbl-btn--view"
                                title="View Profile"
                              >
                                <i className="bi bi-eye" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )),
                    ];
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}