// src/pages/admin/teachers/TeacherDetail.jsx
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getTeacher, getTeacherAllocations } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage } from "../../../components/common";

export default function TeacherDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("details");

  const { data: teacher,     loading, error } = useFetch(() => getTeacher(id), [id]);
  const { data: allocations }                 = useFetch(() => getTeacherAllocations(id), [id]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <AlertMessage type="danger" message={error} />;
  if (!teacher) return null;

  const tabs = [
    { key: "details",     icon: "bi-person-badge", label: "Details"     },
    { key: "allocations", icon: "bi-book",          label: "Allocations" },
  ];

  const details = [
    { label: "Staff Number",     value: teacher.staff_number                  },
    { label: "TSC Number",       value: teacher.tsc_number                    },
    { label: "Department",       value: teacher.department                    },
    { label: "Qualification",    value: teacher.qualification                 },
    { label: "Joined School",    value: formatDate(teacher.date_joined_school)},
    { label: "Total Allocations",value: teacher.allocation_count ?? 0         },
  ];

  return (
    <>
      <PageTitle
        title="Teacher Profile"
        breadcrumbs={[
          { label: "Teachers", to: "/admin/teachers" },
          { label: teacher.full_name },
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "var(--space-6)", alignItems: "start" }}>

        {/* ── LEFT: Profile card ─────────────────────────────────── */}
        <div className="card">
          <div className="profile-hero__banner" />
          <div className="profile-hero__body">
            <div className="profile-hero__avatar">
              {(teacher.full_name || "T").charAt(0).toUpperCase()}
            </div>

            <h2 className="profile-hero__name">{teacher.full_name}</h2>
            <span className="profile-hero__adm">{teacher.email}</span>

            <div className="profile-hero__badges">
              <span className={`status status--${teacher.is_active ? "active" : "inactive"}`}>
                <span className="status__dot" />
                {teacher.is_active ? "Active" : "Inactive"}
              </span>
              {teacher.department && (
                <span className="badge badge--primary">{teacher.department}</span>
              )}
            </div>

            <div className="profile-hero__actions">
              <Link to={`/admin/teachers/${id}/edit`} className="btn btn-primary btn-sm">
                <i className="bi bi-pencil" /> Edit
              </Link>
              <Link to="/admin/teachers" className="btn btn-secondary btn-sm">
                <i className="bi bi-arrow-left" /> Back
              </Link>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Tabs ────────────────────────────────────────── */}
        <div className="card">
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
                  {tab.key === "allocations" && (
                    <span className="tab-count">{allocations?.length ?? 0}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body">

            {/* Details tab */}
            {activeTab === "details" && (
              <div className="profile-info-grid">
                {details.map(({ label, value }) => (
                  <div key={label} className="info-row">
                    <span className="info-row__label">{label}</span>
                    <span className="info-row__value">{value || "—"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Allocations tab */}
            {activeTab === "allocations" && (
              allocations?.length ? (
                <div className="table-wrap" style={{ border: "none" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Classroom</th>
                        <th>Academic Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((a) => (
                        <tr key={a.id}>
                          <td><span className="fw-600">{a.subject_name}</span></td>
                          <td>{a.classroom_display}</td>
                          <td><span className="cell-mono">{a.academic_year_display}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state__icon"><i className="bi bi-book" /></div>
                  <p className="empty-state__title">No Allocations</p>
                  <p className="empty-state__desc">No subject allocations have been assigned to this teacher yet.</p>
                  <Link to="/admin/teachers/allocations" className="btn btn-primary btn-sm">
                    <i className="bi bi-plus-circle" /> Assign Subjects
                  </Link>
                </div>
              )
            )}

          </div>
        </div>
      </div>
    </>
  );
}