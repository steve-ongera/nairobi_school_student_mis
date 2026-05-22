// src/pages/admin/students/StudentDetail.jsx
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getStudent, getStudentFeeStatement } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage, StatusBadge } from "../../../components/common";

export default function StudentDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: student, loading, error } = useFetch(() => getStudent(id), [id]);
  const { data: feeStatement } = useFetch(() => getStudentFeeStatement(id), [id]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <AlertMessage type="danger" message={error} />;
  if (!student) return null;

  const tabs = [
    { key: "overview", icon: "bi-person",   label: "Overview" },
    { key: "class",    icon: "bi-building", label: "Class"    },
    { key: "parent",   icon: "bi-people",   label: "Parent"   },
  ];

  return (
    <>
      <PageTitle
        title="Student Profile"
        breadcrumbs={[
          { label: "Students", to: "/admin/students" },
          { label: student.full_name || student.admission_number },
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "var(--space-6)", alignItems: "start" }}>

        {/* ── LEFT COLUMN ───────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

          {/* Profile hero card */}
          <div className="card">
            {/* Banner */}
            <div className="profile-hero__banner" />

            <div className="profile-hero__body">
              {/* Avatar */}
              <div className="profile-hero__avatar">
                {(student.full_name || "S").charAt(0).toUpperCase()}
              </div>

              <h2 className="profile-hero__name">{student.full_name}</h2>
              <span className="profile-hero__adm">{student.admission_number}</span>

              {/* Badges */}
              <div className="profile-hero__badges">
                <StatusBadge status={student.status} />
                {student.boarding_status && (
                  <span className={`pill pill--${student.boarding_status.toLowerCase()}`}>
                    <i className={`bi ${student.boarding_status === "Boarding" ? "bi-house-door-fill" : "bi-house-door"}`} />
                    {" "}{student.boarding_status}
                  </span>
                )}
                {student.gender && (
                  <span className={`pill pill--${student.gender === "F" ? "female" : "male"}`}>
                    <i className={`bi bi-gender-${student.gender === "F" ? "female" : "male"}`} />
                    {" "}{student.gender === "F" ? "Female" : student.gender === "M" ? "Male" : student.gender}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="profile-hero__actions">
                <Link to={`/admin/students/${id}/edit`} className="btn btn-primary btn-sm">
                  <i className="bi bi-pencil" /> Edit
                </Link>
                <Link to={`/admin/exams/report-cards?student=${id}`} className="btn btn-outline btn-sm">
                  <i className="bi bi-file-pdf" /> Report Card
                </Link>
              </div>
            </div>
          </div>

          {/* Fee summary card */}
          {feeStatement && (
            <div className="fee-summary">
              <div className="fee-summary__header">
                <i className="bi bi-cash-stack" style={{ marginRight: 8 }} />
                Fee Summary
              </div>
              <div className="fee-summary__body">
                <div className="fee-row">
                  <span className="fee-row__label">Total Charged</span>
                  <span className="fee-row__value fee-row__value--total">
                    {formatCurrency(feeStatement.total_charged)}
                  </span>
                </div>
                <div className="fee-row">
                  <span className="fee-row__label">Total Paid</span>
                  <span className="fee-row__value fee-row__value--paid">
                    {formatCurrency(feeStatement.total_paid)}
                  </span>
                </div>
                <div className="fee-row">
                  <span className="fee-row__label">Balance</span>
                  <span className={`fee-row__value ${feeStatement.total_balance > 0 ? "fee-row__value--balance" : "fee-row__value--paid"}`}>
                    {formatCurrency(feeStatement.total_balance)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────────────── */}
        <div className="card">
          {/* Tabs */}
          <div className="card-header" style={{ padding: "0 var(--space-6)" }}>
            <div className="tabs" style={{ borderBottom: "none" }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`tab-item${activeTab === tab.key ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <i className={`bi ${tab.icon}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body">

            {/* ── Overview tab ──────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="profile-info-grid">
                {[
                  { label: "Date of Birth",     value: formatDate(student.date_of_birth)    },
                  { label: "Nationality",        value: student.nationality                  },
                  { label: "Blood Group",        value: student.blood_group                  },
                  { label: "Admission Date",     value: formatDate(student.admission_date)   },
                  { label: "KCPE Marks",         value: student.kcpe_marks                   },
                  { label: "KCPE Index No",      value: student.kcpe_index_number            },
                  { label: "Dormitory",          value: student.dormitory                    },
                  { label: "Bed No",             value: student.bed_number                   },
                  { label: "Email",              value: student.email                        },
                  { label: "Medical Conditions", value: student.medical_conditions || "None" },
                ].map(({ label, value }) => (
                  <div key={label} className="info-row">
                    <span className="info-row__label">{label}</span>
                    <span className="info-row__value">{value || "—"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Class tab ─────────────────────────────────────────── */}
            {activeTab === "class" && (
              student.current_classroom ? (
                <div className="profile-info-grid">
                  {[
                    { label: "Form",          value: student.current_classroom.form_name            },
                    { label: "Stream",        value: student.current_classroom.stream_name          },
                    { label: "Classroom",     value: student.current_classroom.stream_display       },
                    { label: "Academic Year", value: student.current_classroom.academic_year_display},
                    { label: "Class Teacher", value: student.current_classroom.class_teacher_name   },
                  ].map(({ label, value }) => (
                    <div key={label} className="info-row">
                      <span className="info-row__label">{label}</span>
                      <span className="info-row__value">{value || "—"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state__icon"><i className="bi bi-building" /></div>
                  <p className="empty-state__desc">No classroom assigned to this student.</p>
                </div>
              )
            )}

            {/* ── Parent tab ────────────────────────────────────────── */}
            {activeTab === "parent" && (
              student.parent ? (
                <div className="profile-info-grid">
                  {[
                    { label: "Full Name",    value: student.parent.full_name        },
                    { label: "Email",        value: student.parent.email            },
                    { label: "Phone Number", value: student.parent.user?.phone      },
                    { label: "Occupation",   value: student.parent.occupation       },
                  ].map(({ label, value }) => (
                    <div key={label} className="info-row">
                      <span className="info-row__label">{label}</span>
                      <span className="info-row__value">{value || "—"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state__icon"><i className="bi bi-person-x" /></div>
                  <p className="empty-state__desc">No parent or guardian linked to this student.</p>
                </div>
              )
            )}

          </div>
        </div>
      </div>
    </>
  );
}