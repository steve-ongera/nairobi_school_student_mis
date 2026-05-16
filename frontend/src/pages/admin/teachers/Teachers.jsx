// src/pages/admin/teachers/Teachers.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getTeachers, createTeacher, updateTeacher, deleteTeacher,
  getTeacher, getAllocations, createAllocation, deleteAllocation,
  getSubjects, getClassrooms, getAcademicYears,
} from "../../../utils/api";
import { useFetch } from "../../../hooks";
import {
  PageTitle, DataTable, SearchBar, AlertMessage, ConfirmDialog, LoadingSpinner,
} from "../../../components/common";

/* ─── Scoped styles (shared across all three exports) ──────────────── */
const styles = `
  /* Toolbar */
  .tbl-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }

  .tbl-toolbar__right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* Action buttons */
  .tbl-actions { display: flex; gap: 6px; }

  .tbl-btn {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: all 150ms ease;
  }

  .tbl-btn--view { background: #eff6ff; color: var(--primary); }
  .tbl-btn--edit { background: #fef3c7; color: #b45309; }
  .tbl-btn--del  { background: #fef2f2; color: var(--danger); }

  .tbl-btn--view:hover { background: var(--primary); color: white; }
  .tbl-btn--edit:hover { background: var(--warning);  color: white; }
  .tbl-btn--del:hover  { background: var(--danger);   color: white; }

  /* Teacher name cell */
  .teacher-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .teacher-avatar {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: linear-gradient(135deg, var(--accent), #818cf8);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    flex-shrink: 0;
  }

  .teacher-cell__name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 13px;
    line-height: 1.3;
  }

  .teacher-cell__sub {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 1px;
  }

  /* Status / count badges */
  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .status-chip--active   { background: #ecfdf5; color: #065f46; }
  .status-chip--inactive { background: #f1f5f9; color: var(--text-muted); }

  .count-chip {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
    background: var(--primary-light);
    color: var(--primary-dark);
  }

  /* ── Form styles ── */
  .form-section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
  }

  .form-label { font-weight: 600; font-size: 13px; }

  .form-control, .form-select {
    border-radius: 6px;
    border: 1.5px solid var(--border);
    font-size: 14px;
    padding: 9px 12px;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }

  .form-control:focus, .form-select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    outline: none;
  }

  /* ── Allocation table ── */
  .alloc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  .alloc-table thead th {
    text-align: left;
    padding: 12px 16px;
    background: #f8fafc;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  .alloc-table tbody td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-light);
    vertical-align: middle;
    color: var(--text-secondary);
  }

  .alloc-table tbody tr:last-child td { border-bottom: none; }

  .alloc-table tbody tr:hover { background: #fafbfc; }

  .alloc-teacher { font-weight: 600; color: var(--text-primary); }
  .alloc-subject { color: var(--text-primary); }
  .alloc-class   { font-size: 12px; color: var(--text-muted); }

  /* ── Allocation form card ── */
  .alloc-form-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr) auto;
    gap: 12px;
    align-items: end;
  }

  @media (max-width: 992px) {
    .alloc-form-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 576px) {
    .alloc-form-grid {
      grid-template-columns: 1fr;
    }
    .tbl-toolbar { flex-direction: column; align-items: flex-start; }
    .tbl-toolbar__right { width: 100%; }
  }
`;

/* ── TeacherList ─────────────────────────────────────────────────────── */
export function TeacherList() {
  const [search,   setSearch]   = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [msg,      setMsg]      = useState({ type: "", text: "" });

  const { data: teachers, loading, error, refetch } = useFetch(
    () => getTeachers(search ? { search } : {}),
    [search]
  );

  const handleDelete = async () => {
    try {
      await deleteTeacher(deleteId);
      setMsg({ type: "success", text: "Teacher deleted." });
      refetch();
    } catch {
      setMsg({ type: "danger", text: "Failed to delete teacher." });
    } finally {
      setDeleteId(null);
    }
  };

  const columns = [
    {
      header: "Staff No",
      render: (t) => (
        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>
          {t.staff_number || "—"}
        </span>
      ),
    },
    {
      header: "Teacher",
      render: (t) => (
        <div className="teacher-cell">
          <div className="teacher-avatar">
            {t.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <Link to={`/admin/teachers/${t.id}`} className="teacher-cell__name" style={{ textDecoration: "none", color: "inherit" }}>
              {t.full_name}
            </Link>
            <div className="teacher-cell__sub">{t.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "TSC No",
      render: (t) => t.tsc_number || <span className="text-muted">—</span>,
    },
    {
      header: "Department",
      render: (t) => t.department || <span className="text-muted">—</span>,
    },
    {
      header: "Subjects",
      render: (t) => (
        <span className="count-chip">{t.allocation_count ?? 0}</span>
      ),
    },
    {
      header: "Status",
      render: (t) => (
        <span className={`status-chip status-chip--${t.is_active ? "active" : "inactive"}`}>
          <i className={`bi bi-${t.is_active ? "check-circle-fill" : "dash-circle"}`} />
          {t.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (t) => (
        <div className="tbl-actions">
          <Link to={`/admin/teachers/${t.id}`} className="tbl-btn tbl-btn--view" title="View">
            <i className="bi bi-eye" />
          </Link>
          <Link to={`/admin/teachers/${t.id}/edit`} className="tbl-btn tbl-btn--edit" title="Edit">
            <i className="bi bi-pencil" />
          </Link>
          <button
            className="tbl-btn tbl-btn--del"
            onClick={() => setDeleteId(t.id)}
            data-bs-toggle="modal"
            data-bs-target="#confirmDeleteTeacher"
            title="Delete"
          >
            <i className="bi bi-trash" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <PageTitle title="Teachers" breadcrumbs={[{ label: "Teachers" }]} />

      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      <div className="card">
        <div className="card-body">
          <div className="tbl-toolbar">
            <h5 className="card-title mb-0">All Teachers</h5>
            <div className="tbl-toolbar__right">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name or email…"
              />
              <Link to="/admin/teachers/new" className="btn btn-primary btn-sm">
                <i className="bi bi-person-plus me-1" /> Add Teacher
              </Link>
            </div>
          </div>

          {error && <AlertMessage type="danger" message={error} />}

          <DataTable
            columns={columns}
            data={teachers ?? []}
            loading={loading}
            emptyMessage="No teachers found."
          />
        </div>
      </div>

      <ConfirmDialog
        id="confirmDeleteTeacher"
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  );
}

/* ── TeacherForm ─────────────────────────────────────────────────────── */
export function TeacherForm() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id);

  const [form, setForm] = useState({
    email:               "",
    first_name:          "",
    last_name:           "",
    phone:               "",
    staff_number:        "",
    tsc_number:          "",
    department:          "",
    qualification:       "",
    date_joined_school:  new Date().toISOString().slice(0, 10),
    password:            "school@2024",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!isEdit) return;
    getTeacher(id).then((r) => {
      const t = r.data;
      setForm({
        email:              t.email              || "",
        first_name:         t.user?.first_name   || "",
        last_name:          t.user?.last_name    || "",
        phone:              t.user?.phone        || "",
        staff_number:       t.staff_number       || "",
        tsc_number:         t.tsc_number         || "",
        department:         t.department         || "",
        qualification:      t.qualification      || "",
        date_joined_school: t.date_joined_school || "",
      });
    });
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isEdit) await updateTeacher(id, form);
      else        await createTeacher(form);
      navigate("/admin/teachers");
    } catch (err) {
      const d = err.response?.data;
      setError(
        typeof d === "string"
          ? d
          : Object.entries(d || {})
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ") || "Failed to save."
      );
    } finally {
      setLoading(false);
    }
  };

  /* Reusable field */
  const Field = ({ label, name, type = "text", required = false, placeholder, colClass = "col-md-6" }) => (
    <div className={`${colClass} mb-3`}>
      <label className="form-label">
        {label}{required && <span className="text-danger ms-1">*</span>}
      </label>
      <input
        type={type}
        className="form-control"
        value={form[name]}
        placeholder={placeholder}
        onChange={(e) => set(name, e.target.value)}
        required={required}
      />
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <PageTitle
        title={isEdit ? "Edit Teacher" : "Add Teacher"}
        breadcrumbs={[
          { label: "Teachers", to: "/admin/teachers" },
          { label: isEdit ? "Edit" : "New" },
        ]}
      />

      {error && (
        <AlertMessage type="danger" message={error} onClose={() => setError("")} />
      )}

      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">
            {isEdit ? "Update Teacher Details" : "New Teacher Registration"}
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>

            {/* Account section */}
            <div className="form-section-label">Account Information</div>
            <div className="row">
              <Field label="First Name"  name="first_name"  required />
              <Field label="Last Name"   name="last_name"   required />
              <Field label="Email"       name="email"       type="email" required={!isEdit} />
              <Field label="Phone"       name="phone"       type="tel" />
              {!isEdit && (
                <Field label="Initial Password" name="password" placeholder="Default: school@2024" />
              )}
            </div>

            {/* Professional section */}
            <div className="form-section-label mt-2">Professional Details</div>
            <div className="row">
              <Field label="Staff Number"       name="staff_number"       required />
              <Field label="TSC Number"         name="tsc_number" />
              <Field label="Department"         name="department" />
              <Field label="Qualification"      name="qualification" />
              <Field label="Date Joined School" name="date_joined_school" type="date" />
            </div>

            <div className="d-flex gap-2 mt-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                {isEdit ? "Update Teacher" : "Add Teacher"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate("/admin/teachers")}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}

/* ── SubjectAllocation ───────────────────────────────────────────────── */
export function SubjectAllocation() {
  const [msg,  setMsg]  = useState({ type: "", text: "" });
  const [form, setForm] = useState({ teacher: "", subject: "", classroom: "", academic_year: "" });

  const { data: teachers  } = useFetch(() => getTeachers());
  const { data: subjects   } = useFetch(() => getSubjects());
  const { data: classrooms } = useFetch(() => getClassrooms());
  const { data: years      } = useFetch(() => getAcademicYears());
  const { data: allocs, loading, refetch } = useFetch(() => getAllocations());

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAllocation({
        teacher:       parseInt(form.teacher),
        subject:       parseInt(form.subject),
        classroom:     parseInt(form.classroom),
        academic_year: parseInt(form.academic_year),
      });
      setMsg({ type: "success", text: "Allocation created successfully." });
      refetch();
      setForm({ teacher: "", subject: "", classroom: "", academic_year: "" });
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.detail || "Failed to create allocation." });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this allocation?")) return;
    try {
      await deleteAllocation(id);
      setMsg({ type: "success", text: "Allocation removed." });
      refetch();
    } catch {
      setMsg({ type: "danger", text: "Failed to remove allocation." });
    }
  };

  const selects = [
    {
      label: "Teacher",
      key: "teacher",
      options: (teachers ?? []).map((t) => ({ value: t.id, label: t.full_name })),
    },
    {
      label: "Subject",
      key: "subject",
      options: (subjects ?? []).map((s) => ({ value: s.id, label: s.name })),
    },
    {
      label: "Classroom",
      key: "classroom",
      options: (classrooms ?? []).map((c) => ({
        value: c.id,
        label: `${c.stream_display} – ${c.academic_year_display}`,
      })),
    },
    {
      label: "Academic Year",
      key: "academic_year",
      options: (years ?? []).map((y) => ({ value: y.id, label: y.year })),
    },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <PageTitle
        title="Subject Allocation"
        breadcrumbs={[{ label: "Teachers" }, { label: "Subject Allocation" }]}
      />

      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      {/* Create allocation form */}
      <div className="card mb-3">
        <div className="card-header">
          <h5 className="card-title mb-0">Assign Teacher → Subject → Classroom</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreate}>
            <div className="alloc-form-grid">
              {selects.map(({ label, key, options }) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <select
                    className="form-select form-select-sm"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    required
                  >
                    <option value="">— {label} —</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div>
                <label className="form-label" style={{ visibility: "hidden" }}>Go</label>
                <button type="submit" className="btn btn-primary btn-sm w-100">
                  <i className="bi bi-plus-circle me-1" /> Assign
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Allocations table */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Current Allocations</h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4"><LoadingSpinner /></div>
          ) : (
            <div className="table-responsive">
              <table className="alloc-table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Subject</th>
                    <th>Classroom</th>
                    <th>Year</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(allocs ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No allocations found.
                      </td>
                    </tr>
                  ) : (
                    (allocs ?? []).map((a) => (
                      <tr key={a.id}>
                        <td className="alloc-teacher">{a.teacher_name}</td>
                        <td className="alloc-subject">{a.subject_name}</td>
                        <td className="alloc-class">{a.classroom_display}</td>
                        <td className="alloc-class">{a.academic_year_display}</td>
                        <td>
                          <button
                            className="tbl-btn tbl-btn--del"
                            onClick={() => handleDelete(a.id)}
                            title="Remove allocation"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}