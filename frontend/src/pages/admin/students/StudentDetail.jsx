import { useParams, Link } from "react-router-dom";
import { getStudent, getStudentResults, getStudentFeeStatement } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage, GradeBadge, StatusBadge } from "../../../components/common";

export default function StudentDetail() {
  const { id } = useParams();
  const { data: student, loading, error } = useFetch(() => getStudent(id), [id]);
  const { data: feeStatement } = useFetch(() => getStudentFeeStatement(id), [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="danger" message={error} />;
  if (!student) return null;

  return (
    <>
      <PageTitle
        title="Student Profile"
        breadcrumbs={[
          { label: "Students", to: "/admin/students" },
          { label: student.full_name || student.admission_number },
        ]}
      />

      <div className="row">
        {/* Profile Card */}
        <div className="col-xl-4">
          <div className="card profile">
            <div className="card-body profile-card pt-4 d-flex flex-column align-items-center">
              <div
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "#4154f1", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 700, marginBottom: 12,
                }}
              >
                {(student.full_name || "S").charAt(0)}
              </div>
              <h2>{student.full_name}</h2>
              <h3>{student.admission_number}</h3>
              <div className="mt-2 d-flex gap-2 flex-wrap justify-content-center">
                <StatusBadge status={student.status} />
                <span className="badge bg-info text-capitalize">{student.boarding_status}</span>
                {student.gender && (
                  <span className="badge bg-secondary text-capitalize">{student.gender}</span>
                )}
              </div>
              <div className="mt-3 d-flex gap-2">
                <Link to={`/admin/students/${id}/edit`} className="btn btn-sm btn-primary">
                  <i className="bi bi-pencil me-1" />Edit
                </Link>
                <Link
                  to={`/admin/exams/report-cards?student=${id}`}
                  className="btn btn-sm btn-outline-primary"
                >
                  <i className="bi bi-file-pdf me-1" />Report Card
                </Link>
              </div>
            </div>
          </div>

          {/* Fee Summary */}
          {feeStatement && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Fee Summary</h5>
                {[
                  { label: "Total Charged", value: feeStatement.total_charged, color: "primary" },
                  { label: "Total Paid", value: feeStatement.total_paid, color: "success" },
                  { label: "Balance", value: feeStatement.total_balance, color: feeStatement.total_balance > 0 ? "danger" : "success" },
                ].map((row) => (
                  <div key={row.label} className="d-flex justify-content-between mb-2">
                    <span className="text-muted">{row.label}</span>
                    <span className={`fw-700 text-${row.color}`}>{formatCurrency(row.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="col-xl-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Personal Information</h5>
              <ul className="nav nav-tabs nav-tabs-bordered mb-3">
                {["Overview", "Class", "Parent"].map((tab) => (
                  <li className="nav-item" key={tab}>
                    <button
                      className={`nav-link ${tab === "Overview" ? "active" : ""}`}
                      data-bs-toggle="tab"
                      data-bs-target={`#tab-${tab.toLowerCase()}`}
                    >
                      {tab}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="tab-content pt-2">
                {/* Overview */}
                <div className="tab-pane fade show active" id="tab-overview">
                  <div className="row profile-overview">
                    {[
                      { label: "Date of Birth", value: formatDate(student.date_of_birth) },
                      { label: "Nationality", value: student.nationality || "—" },
                      { label: "Blood Group", value: student.blood_group || "—" },
                      { label: "Admission Date", value: formatDate(student.admission_date) },
                      { label: "KCPE Marks", value: student.kcpe_marks ?? "—" },
                      { label: "KCPE Index No", value: student.kcpe_index_number || "—" },
                      { label: "Dormitory", value: student.dormitory || "—" },
                      { label: "Bed No", value: student.bed_number || "—" },
                      { label: "Email", value: student.email || "—" },
                      { label: "Medical", value: student.medical_conditions || "None" },
                    ].map((row) => (
                      <div className="col-lg-6" key={row.label}>
                        <div className="row mb-2">
                          <div className="col-5 label">{row.label}</div>
                          <div className="col-7">{row.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Class */}
                <div className="tab-pane fade" id="tab-class">
                  {student.current_classroom ? (
                    <div className="row profile-overview">
                      {[
                        { label: "Form", value: student.current_classroom.form_name },
                        { label: "Stream", value: student.current_classroom.stream_name },
                        { label: "Classroom", value: student.current_classroom.stream_display },
                        { label: "Academic Year", value: student.current_classroom.academic_year_display },
                        { label: "Class Teacher", value: student.current_classroom.class_teacher_name || "—" },
                      ].map((row) => (
                        <div className="col-lg-6" key={row.label}>
                          <div className="row mb-2">
                            <div className="col-5 label">{row.label}</div>
                            <div className="col-7">{row.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No classroom assigned.</p>
                  )}
                </div>

                {/* Parent */}
                <div className="tab-pane fade" id="tab-parent">
                  {student.parent ? (
                    <div className="row profile-overview">
                      {[
                        { label: "Name", value: student.parent.full_name },
                        { label: "Email", value: student.parent.email || "—" },
                        { label: "Phone", value: student.parent.user?.phone || "—" },
                        { label: "Occupation", value: student.parent.occupation || "—" },
                      ].map((row) => (
                        <div className="col-lg-6" key={row.label}>
                          <div className="row mb-2">
                            <div className="col-5 label">{row.label}</div>
                            <div className="col-7">{row.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No parent/guardian linked.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}