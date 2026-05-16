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
        breadcrumbs={[{ label: "Teachers", to: "/admin/teachers" }, { label: teacher.full_name }]}
      />

      <div className="row">
        <div className="col-xl-4">
          <div className="card profile">
            <div className="card-body profile-card pt-4 d-flex flex-column align-items-center text-center">
              <div
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "linear-gradient(135deg,#4154f1,#012970)",
                  color: "#fff", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 30, fontWeight: 700, marginBottom: 12,
                }}
              >
                {(teacher.full_name || "T").charAt(0)}
              </div>
              <h2>{teacher.full_name}</h2>
              <h3 style={{ fontSize: 14, color: "#899bbd" }}>{teacher.email}</h3>
              <div className="d-flex gap-2 mt-2 flex-wrap justify-content-center">
                <span className={`badge bg-${teacher.is_active ? "success" : "secondary"}`}>
                  {teacher.is_active ? "Active" : "Inactive"}
                </span>
                {teacher.department && <span className="badge bg-info">{teacher.department}</span>}
              </div>
              <div className="mt-3 d-flex gap-2">
                <Link to={`/admin/teachers/${id}/edit`} className="btn btn-sm btn-primary">
                  <i className="bi bi-pencil me-1" />Edit
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Professional Details</h5>
              <div className="row profile-overview">
                {[
                  { label: "Staff Number", value: teacher.staff_number || "—" },
                  { label: "TSC Number", value: teacher.tsc_number || "—" },
                  { label: "Department", value: teacher.department || "—" },
                  { label: "Qualification", value: teacher.qualification || "—" },
                  { label: "Joined School", value: formatDate(teacher.date_joined_school) },
                  { label: "Total Allocations", value: teacher.allocation_count },
                ].map((row) => (
                  <div className="col-md-6" key={row.label}>
                    <div className="row mb-2">
                      <div className="col-5 label">{row.label}</div>
                      <div className="col-7">{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                Subject Allocations
                <span className="badge bg-primary ms-2">{allocations?.length || 0}</span>
              </h5>
              {allocations?.length ? (
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle">
                    <thead className="table-light">
                      <tr><th>Subject</th><th>Classroom</th><th>Year</th></tr>
                    </thead>
                    <tbody>
                      {allocations.map((a) => (
                        <tr key={a.id}>
                          <td className="fw-600">{a.subject_name}</td>
                          <td>{a.classroom_display}</td>
                          <td>{a.academic_year_display}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No allocations yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}