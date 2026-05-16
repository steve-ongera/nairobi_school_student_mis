// Updated StudentDetail.jsx - Clean & Modern
import { useParams, Link } from "react-router-dom";
import { getStudent, getStudentFeeStatement } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage, StatusBadge } from "../../../components/common";

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

      <div className="row g-4">
        {/* Left Column — Profile & Fee Summary */}
        <div className="col-xl-4">

          {/* Profile Card */}
          <div className="profile-card-modern">
            <div className="profile-avatar">
              {(student.full_name || "S").charAt(0).toUpperCase()}
            </div>
            <h2 className="profile-name">{student.full_name}</h2>
            <div className="profile-adm">{student.admission_number}</div>

            <div className="profile-badges">
              <StatusBadge status={student.status} />
              {student.boarding_status && (
                <span className={`badge-modern ${student.boarding_status === "boarding" ? "badge-boarding" : "badge-day"}`}>
                  <i className={`bi ${student.boarding_status === "boarding" ? "bi-house-door-fill" : "bi-house-door"}`} />
                  {" "}{student.boarding_status}
                </span>
              )}
              {student.gender && (
                <span className="badge-modern badge-gender">
                  <i className={`bi ${student.gender === "male" ? "bi-gender-male" : "bi-gender-female"}`} />
                  {" "}{student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}
                </span>
              )}
            </div>

            <div className="profile-actions">
              <Link to={`/admin/students/${id}/edit`} className="btn btn-primary btn-sm">
                <i className="bi bi-pencil" /> Edit
              </Link>
              <Link to={`/admin/exams/report-cards?student=${id}`} className="btn btn-outline-primary btn-sm">
                <i className="bi bi-file-pdf" /> Report Card
              </Link>
            </div>
          </div>

          {/* Fee Summary Card */}
          {feeStatement && (
            <div className="fee-card">
              <div className="fee-title">
                <i className="bi bi-cash-stack me-2" />
                Fee Summary
              </div>
              <div className="fee-row">
                <span className="fee-label">Total Charged</span>
                <span className="fee-value primary">{formatCurrency(feeStatement.total_charged)}</span>
              </div>
              <div className="fee-row">
                <span className="fee-label">Total Paid</span>
                <span className="fee-value success">{formatCurrency(feeStatement.total_paid)}</span>
              </div>
              <div className="fee-row">
                <span className="fee-label">Balance</span>
                <span className={`fee-value ${feeStatement.total_balance > 0 ? "danger" : "success"}`}>
                  {formatCurrency(feeStatement.total_balance)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Details Tabs */}
        <div className="col-xl-8">
          <div className="info-card-modern">

            {/* Tab Headers */}
            <ul className="nav nav-tabs-custom">
              <li className="nav-item">
                <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-overview">
                  <i className="bi bi-person me-1" /> Overview
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-class">
                  <i className="bi bi-building me-1" /> Class
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-parent">
                  <i className="bi bi-people me-1" /> Parent
                </button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content-custom">

              {/* Overview Tab */}
              <div className="tab-pane fade show active" id="tab-overview">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Date of Birth</div>
                    <div className="info-value">{formatDate(student.date_of_birth) || "—"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Nationality</div>
                    <div className="info-value">{student.nationality || "—"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Blood Group</div>
                    <div className="info-value">{student.blood_group || "—"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Admission Date</div>
                    <div className="info-value">{formatDate(student.admission_date) || "—"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">KCPE Marks</div>
                    <div className="info-value">{student.kcpe_marks || "—"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">KCPE Index No</div>
                    <div className="info-value">{student.kcpe_index_number || "—"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Dormitory</div>
                    <div className="info-value">{student.dormitory || "—"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Bed No</div>
                    <div className="info-value">{student.bed_number || "—"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Email</div>
                    <div className="info-value">{student.email || "—"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Medical Conditions</div>
                    <div className="info-value">{student.medical_conditions || "None"}</div>
                  </div>
                </div>
              </div>

              {/* Class Tab */}
              <div className="tab-pane fade" id="tab-class">
                {student.current_classroom ? (
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Form</div>
                      <div className="info-value">{student.current_classroom.form_name || "—"}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Stream</div>
                      <div className="info-value">{student.current_classroom.stream_name || "—"}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Classroom</div>
                      <div className="info-value">{student.current_classroom.stream_display || "—"}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Academic Year</div>
                      <div className="info-value">{student.current_classroom.academic_year_display || "—"}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Class Teacher</div>
                      <div className="info-value">{student.current_classroom.class_teacher_name || "—"}</div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-message">
                    <i className="bi bi-building fs-1 d-block mb-2" />
                    <p>No classroom assigned to this student.</p>
                  </div>
                )}
              </div>

              {/* Parent Tab */}
              <div className="tab-pane fade" id="tab-parent">
                {student.parent ? (
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Full Name</div>
                      <div className="info-value">{student.parent.full_name || "—"}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Email</div>
                      <div className="info-value">{student.parent.email || "—"}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Phone Number</div>
                      <div className="info-value">{student.parent.user?.phone || "—"}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Occupation</div>
                      <div className="info-value">{student.parent.occupation || "—"}</div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-message">
                    <i className="bi bi-person-x fs-1 d-block mb-2" />
                    <p>No parent or guardian linked to this student.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}