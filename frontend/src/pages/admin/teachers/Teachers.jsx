// src/pages/admin/teachers/Teachers.jsx
import { useState, useEffect, useCallback } from "react";
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

// ── Reusable form field ───────────────────────────────────────────────────────
const Field = ({ label, name, type = "text", required = false, placeholder, form, set }) => (
  <div className="form-group">
    <label className="form-label">
      {label}{required && <span className="required">*</span>}
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

/* ══════════════════════════════════════════════════════════════════════
   TeacherList
   ══════════════════════════════════════════════════════════════════════ */
export function TeacherList() {
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [data,     setData]     = useState([]);
  const [count,    setCount]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [msg,      setMsg]      = useState({ type: "", text: "" });

  const PAGE_SIZE  = 20;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page };
      if (search) params.search = search;
      const res     = await getTeachers(params);
      const payload = res?.data ?? res;
      if (payload?.results !== undefined) {
        setData(payload.results);
        setCount(payload.count ?? payload.results.length);
      } else if (Array.isArray(payload)) {
        setData(payload);
        setCount(payload.length);
      } else {
        setData([]);
        setCount(0);
      }
    } catch (err) {
      setError("Failed to load teachers.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async () => {
    try {
      await deleteTeacher(deleteId);
      setMsg({ type: "success", text: "Teacher deleted." });
      if (data.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchTeachers();
    } catch {
      setMsg({ type: "danger", text: "Failed to delete teacher." });
    } finally {
      setDeleteId(null);
    }
  };

  const getPageNumbers = () => {
    const delta = 2, range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i);
    return range;
  };

  const columns = [
    {
      header: "Staff No",
      render: (t) => <span className="cell-mono">{t.staff_number || "—"}</span>,
    },
    {
      header: "Teacher",
      render: (t) => (
        <div className="cell-person">
          <div className="cell-avatar cell-avatar--indigo">
            {t.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <Link to={`/admin/teachers/${t.id}`} className="cell-name" style={{ textDecoration: "none" }}>
              {t.full_name}
            </Link>
            <div className="cell-meta">{t.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "TSC No",
      render: (t) => t.tsc_number
        ? <span className="cell-mono">{t.tsc_number}</span>
        : <span className="text-muted">—</span>,
    },
    {
      header: "Department",
      render: (t) => t.department || <span className="text-muted">—</span>,
    },
    {
      header: "Subjects",
      render: (t) => <span className="count-chip">{t.allocation_count ?? 0}</span>,
    },
    {
      header: "Status",
      render: (t) => (
        <span className={`status status--${t.is_active ? "active" : "inactive"}`}>
          <span className="status__dot" />
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
            className="tbl-btn tbl-btn--delete"
            onClick={() => setDeleteId(t.id)}
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
      <PageTitle title="Teachers" breadcrumbs={[{ label: "Teachers" }]} />

      {msg.text && (
        <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h5 className="card-title">
              All Teachers
              {count > 0 && <span className="count-chip ms-2">{count.toLocaleString()}</span>}
            </h5>
            <p className="card-subtitle">Manage teaching staff</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />
            <Link to="/admin/teachers/new" className="btn btn-primary btn-sm">
              <i className="bi bi-person-plus" /> Add Teacher
            </Link>
          </div>
        </div>

        {error && (
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <AlertMessage type="danger" message={error} />
          </div>
        )}

        <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
          <DataTable columns={columns} data={data} loading={loading} emptyMessage="No teachers found." />
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination__info">
              Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
              <strong>{Math.min(page * PAGE_SIZE, count)}</strong> of{" "}
              <strong>{count.toLocaleString()}</strong> teachers
            </span>
            <div className="pagination__controls">
              <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1} title="First">«</button>
              <button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
              {page > 3 && <span className="page-btn" style={{ cursor: "default", opacity: 0.4 }}>…</span>}
              {getPageNumbers().map((n) => (
                <button key={n} className={`page-btn${n === page ? " active" : ""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              {page < totalPages - 2 && <span className="page-btn" style={{ cursor: "default", opacity: 0.4 }}>…</span>}
              <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>›</button>
              <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Last">»</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        show={!!deleteId}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmLabel="Delete"
        confirmColor="danger"
      />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TeacherForm
   ══════════════════════════════════════════════════════════════════════ */
export function TeacherForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form, setForm] = useState({
    email:              "",
    first_name:         "",
    last_name:          "",
    phone:              "",
    staff_number:       "",
    tsc_number:         "",
    department:         "",
    qualification:      "",
    date_joined_school: new Date().toISOString().slice(0, 10),
    password:           "school@2024",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!isEdit) return;
    getTeacher(id).then((r) => {
      const t = r.data;
      setForm({
        email:              t.email                || "",
        first_name:         t.user?.first_name     || "",
        last_name:          t.user?.last_name      || "",
        phone:              t.user?.phone          || "",
        staff_number:       t.staff_number         || "",
        tsc_number:         t.tsc_number           || "",
        department:         t.department           || "",
        qualification:      t.qualification        || "",
        date_joined_school: t.date_joined_school   || "",
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

  const fp = { form, set };

  return (
    <>
      <PageTitle
        title={isEdit ? "Edit Teacher" : "Add Teacher"}
        breadcrumbs={[
          { label: "Teachers", to: "/admin/teachers" },
          { label: isEdit ? "Edit" : "New" },
        ]}
      />

      {error && <AlertMessage type="danger" message={error} onClose={() => setError("")} />}

      <div className="card">
        <div className="card-header">
          <div>
            <h5 className="card-title">{isEdit ? "Update Teacher Details" : "New Teacher Registration"}</h5>
            <p className="card-subtitle">{isEdit ? "Edit staff information below" : "Fill in the details to register a new teacher"}</p>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>

            <span className="form-section">Account Information</span>
            <div className="form-grid form-grid--2">
              <Field label="First Name" name="first_name" required {...fp} />
              <Field label="Last Name"  name="last_name"  required {...fp} />
              <Field label="Email"      name="email"      type="email" required={!isEdit} {...fp} />
              <Field label="Phone"      name="phone"      type="tel"  {...fp} />
              {!isEdit && (
                <Field label="Initial Password" name="password" placeholder="Default: school@2024" {...fp} />
              )}
            </div>

            <span className="form-section" style={{ marginTop: "var(--space-4)" }}>Professional Details</span>
            <div className="form-grid form-grid--2">
              <Field label="Staff Number"       name="staff_number"       required {...fp} />
              <Field label="TSC Number"         name="tsc_number"                  {...fp} />
              <Field label="Department"         name="department"                  {...fp} />
              <Field label="Qualification"      name="qualification"               {...fp} />
              <Field label="Date Joined School" name="date_joined_school" type="date" {...fp} />
            </div>

            <div className="d-flex gap-3" style={{ marginTop: "var(--space-5)" }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading && <span className="spinner spinner--sm" style={{ marginRight: 8, display: "inline-block" }} />}
                {isEdit ? "Update Teacher" : "Add Teacher"}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
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

/* ══════════════════════════════════════════════════════════════════════
   SubjectAllocation
   ══════════════════════════════════════════════════════════════════════ */
export function SubjectAllocation() {
  const [msg,    setMsg]    = useState({ type: "", text: "" });
  const [form,   setForm]   = useState({ teacher: "", subject: "", classroom: "", academic_year: "" });
  const [allocs, setAllocs] = useState([]);
  const [count,  setCount]  = useState(0);
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const [loading,setLoading]= useState(false);

  const PAGE_SIZE  = 15;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  const { data: teachers  } = useFetch(() => getTeachers());
  const { data: subjects   } = useFetch(() => getSubjects());
  const { data: classrooms } = useFetch(() => getClassrooms());
  const { data: years      } = useFetch(() => getAcademicYears());

  const fetchAllocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      const res     = await getAllocations(params);
      const payload = res?.data ?? res;
      if (payload?.results !== undefined) {
        setAllocs(payload.results);
        setCount(payload.count ?? payload.results.length);
      } else if (Array.isArray(payload)) {
        setAllocs(payload);
        setCount(payload.length);
      } else {
        setAllocs([]);
        setCount(0);
      }
    } catch {
      setMsg({ type: "danger", text: "Failed to load allocations." });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchAllocs(); }, [fetchAllocs]);
  useEffect(() => { setPage(1); },   [search]);

  const getPageNumbers = () => {
    const delta = 2, range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i);
    return range;
  };

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
      setForm({ teacher: "", subject: "", classroom: "", academic_year: "" });
      setPage(1);
      fetchAllocs();
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.detail || "Failed to create allocation." });
    }
  };

  const handleDelete = async (allocId) => {
    if (!window.confirm("Remove this allocation?")) return;
    try {
      await deleteAllocation(allocId);
      setMsg({ type: "success", text: "Allocation removed." });
      if (allocs.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchAllocs();
    } catch {
      setMsg({ type: "danger", text: "Failed to remove allocation." });
    }
  };

  const selects = [
    {
      label: "Teacher",
      key:   "teacher",
      options: (teachers ?? []).map((t) => ({ value: t.id, label: t.full_name })),
    },
    {
      label: "Subject",
      key:   "subject",
      options: (subjects ?? []).map((s) => ({ value: s.id, label: s.name })),
    },
    {
      label: "Classroom",
      key:   "classroom",
      options: (classrooms ?? []).map((c) => ({
        value: c.id,
        label: `${c.stream_display} – ${c.academic_year_display}`,
      })),
    },
    {
      label: "Academic Year",
      key:   "academic_year",
      options: (years ?? []).map((y) => ({ value: y.id, label: y.year })),
    },
  ];

  return (
    <>
      <PageTitle
        title="Subject Allocation"
        breadcrumbs={[{ label: "Teachers", to: "/admin/teachers" }, { label: "Subject Allocation" }]}
      />

      {msg.text && (
        <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />
      )}

      {/* ── Assign form ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div>
            <h5 className="card-title">Assign Teacher → Subject → Classroom</h5>
            <p className="card-subtitle">Create a new subject allocation</p>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreate}>
            <div className="alloc-form-grid">
              {selects.map(({ label, key, options }) => (
                <div className="form-group" key={key} style={{ marginBottom: 0 }}>
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
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ visibility: "hidden" }}>Go</label>
                <button type="submit" className="btn btn-primary btn-sm w-full">
                  <i className="bi bi-plus-circle" /> Assign
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── Allocations table ───────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div>
            <h5 className="card-title">
              Current Allocations
              {count > 0 && <span className="count-chip ms-2">{count.toLocaleString()}</span>}
            </h5>
            <p className="card-subtitle">All teacher-subject assignments</p>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Search teacher or subject…" />
        </div>

        <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Classroom</th>
                <th>Year</th>
                <th style={{ width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "var(--space-8)" }}>
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : allocs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state__icon"><i className="bi bi-journal-x" /></div>
                      <p className="empty-state__desc">No allocations found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                allocs.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="cell-person">
                        <div className="cell-avatar cell-avatar--indigo">
                          {a.teacher_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="cell-name">{a.teacher_name}</span>
                      </div>
                    </td>
                    <td><span className="fw-600">{a.subject_name}</span></td>
                    <td>{a.classroom_display}</td>
                    <td><span className="cell-mono">{a.academic_year_display}</span></td>
                    <td>
                      <button
                        className="tbl-btn tbl-btn--delete"
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

        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination__info">
              Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
              <strong>{Math.min(page * PAGE_SIZE, count)}</strong> of{" "}
              <strong>{count.toLocaleString()}</strong> allocations
            </span>
            <div className="pagination__controls">
              <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1} title="First">«</button>
              <button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
              {page > 3 && <span className="page-btn" style={{ cursor: "default", opacity: 0.4 }}>…</span>}
              {getPageNumbers().map((n) => (
                <button key={n} className={`page-btn${n === page ? " active" : ""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              {page < totalPages - 2 && <span className="page-btn" style={{ cursor: "default", opacity: 0.4 }}>…</span>}
              <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>›</button>
              <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Last">»</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}