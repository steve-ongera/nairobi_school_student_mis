import { useParams, Link } from "react-router-dom";
import { getTeacher, getTeacherAllocations } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage } from "../../../components/common";

export default function TeacherDetail() {
  const { id } = useParams();
  const { data: teacher, loading, error } = useFetch(() => getTeacher(id), [id]);
  const { data: allocations } = useFetch(() => getTeacherAllocations(id), [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="danger" message={error} />;
  if (!teacher) return null;

  return (
    <>
      <PageTitle
        title="Teacher Profile"
        breadcrumbs={[
          { label: "Teachers", to: "/admin/teachers" },
          { label: teacher.full_name },
        ]}
      />

      <div className="row g-4">
        {/* Left Column — Profile Card */}
        <div className="col-xl-4">
          <div className="profile-card-modern">
            <div className="profile-avatar">
              {(teacher.full_name || "T").charAt(0).toUpperCase()}
            </div>
            <h2 className="profile-name">{teacher.full_name}</h2>
            <div className="profile-adm">{teacher.email}</div>

            <div className="profile-badges">
              <span className={`status-chip status-chip--${teacher.is_active ? "active" : "inactive"}`}>
                <i className={`bi bi-${teacher.is_active ? "check-circle-fill" : "dash-circle"}`} />
                {teacher.is_active ? "Active" : "Inactive"}
              </span>
              {teacher.department && (
                <span className="badge-modern badge-gender">{teacher.department}</span>
              )}
            </div>

            <div className="profile-actions">
              <Link to={`/admin/teachers/${id}/edit`} className="btn btn-primary btn-sm">
                <i className="bi bi-pencil" /> Edit
              </Link>
              <Link to="/admin/teachers" className="btn btn-outline-secondary btn-sm">
                <i className="bi bi-arrow-left" /> Back
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column — Details */}
        <div className="col-xl-8">

          {/* Professional Details */}
          <div className="info-card-modern mb-4">
            <div className="info-header">
              <h5 className="info-title">
                <i className="bi bi-person-badge me-2" style={{ color: "var(--primary)" }} />
                Professional Details
              </h5>
            </div>
            <div className="tab-content-custom">
              <div className="info-grid">
                {[
                  { label: "Staff Number",      value: teacher.staff_number       || "—" },
                  { label: "TSC Number",         value: teacher.tsc_number         || "—" },
                  { label: "Department",         value: teacher.department         || "—" },
                  { label: "Qualification",      value: teacher.qualification      || "—" },
                  { label: "Joined School",      value: formatDate(teacher.date_joined_school) || "—" },
                  { label: "Total Allocations",  value: teacher.allocation_count   ?? 0 },
                ].map((row) => (
                  <div className="info-item" key={row.label}>
                    <div className="info-label">{row.label}</div>
                    <div className="info-value">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Allocations */}
          <div className="info-card-modern">
            <div className="info-header" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h5 className="info-title" style={{ flex: 1 }}>
                <i className="bi bi-book me-2" style={{ color: "var(--primary)" }} />
                Subject Allocations
              </h5>
              <span className="count-chip">{allocations?.length || 0}</span>
            </div>
            <div className="card-body p-0">
              {allocations?.length ? (
                <div className="table-responsive">
                  <table className="alloc-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Classroom</th>
                        <th>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((a) => (
                        <tr key={a.id}>
                          <td className="alloc-subject fw-600">{a.subject_name}</td>
                          <td className="alloc-class">{a.classroom_display}</td>
                          <td className="alloc-class">{a.academic_year_display}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-message">
                  <i className="bi bi-book fs-1 d-block mb-2" />
                  <p>No subject allocations yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}