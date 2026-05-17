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

// ✅ Field at module level — never remounts on re-render
const Field = ({ label, name, type = "text", required = false, placeholder, colClass = "col-md-6", form, set }) => (
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

/* ── TeacherList ─────────────────────────────────────────────────────── */
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
      const response = await getTeachers(params);
      const payload  = response?.data ?? response;
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
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i);
    }
    return range;
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
          <div className="teacher-avatar">{t.full_name?.charAt(0).toUpperCase()}</div>
          <div>
            <Link to={`/admin/teachers/${t.id}`} className="teacher-cell__name"
              style={{ textDecoration: "none", color: "inherit" }}>
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
      render: (t) => <span className="count-chip">{t.allocation_count ?? 0}</span>,
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
      <PageTitle title="Teachers" breadcrumbs={[{ label: "Teachers" }]} />

      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      <div className="card">
        <div className="card-body">
          <div className="tbl-toolbar">
            <h5 className="card-title mb-0">
              All Teachers{" "}
              {count > 0 && <span className="badge bg-primary ms-2">{count}</span>}
            </h5>
            <div className="tbl-toolbar__right">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name or email…"
              />
              <Link to="/admin/teachers/new" className="btn btn-primary btn-sm">
                <i className="bi bi-person-plus" /> Add Teacher
              </Link>
            </div>
          </div>

          {error && <AlertMessage type="danger" message={error} />}

          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            emptyMessage="No teachers found."
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
              <small className="text-muted">
                Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
                <strong>{Math.min(page * PAGE_SIZE, count)}</strong> of{" "}
                <strong>{count}</strong> teachers
              </small>

              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(1)} disabled={page === 1} title="First">«</button>
                  </li>
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
                  </li>

                  {page > 3 && <li className="page-item disabled"><span className="page-link">…</span></li>}

                  {getPageNumbers().map((n) => (
                    <li key={n} className={`page-item ${n === page ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setPage(n)}>{n}</button>
                    </li>
                  ))}

                  {page < totalPages - 2 && <li className="page-item disabled"><span className="page-link">…</span></li>}

                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>›</button>
                  </li>
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Last">»</button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
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

  const fieldProps = { form, set };

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
          <h5 className="card-title mb-0">
            {isEdit ? "Update Teacher Details" : "New Teacher Registration"}
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-section-label">Account Information</div>
            <div className="row">
              <Field label="First Name" name="first_name" required {...fieldProps} />
              <Field label="Last Name"  name="last_name"  required {...fieldProps} />
              <Field label="Email"      name="email"      type="email" required={!isEdit} {...fieldProps} />
              <Field label="Phone"      name="phone"      type="tel" {...fieldProps} />
              {!isEdit && (
                <Field label="Initial Password" name="password" placeholder="Default: school@2024" {...fieldProps} />
              )}
            </div>

            <div className="form-section-label mt-2">Professional Details</div>
            <div className="row">
              <Field label="Staff Number"       name="staff_number"       required {...fieldProps} />
              <Field label="TSC Number"         name="tsc_number"                  {...fieldProps} />
              <Field label="Department"         name="department"                  {...fieldProps} />
              <Field label="Qualification"      name="qualification"               {...fieldProps} />
              <Field label="Date Joined School" name="date_joined_school" type="date" {...fieldProps} />
            </div>

            <div className="d-flex gap-2 mt-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                {isEdit ? "Update Teacher" : "Add Teacher"}
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate("/admin/teachers")}>
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
  const [msg,    setMsg]    = useState({ type: "", text: "" });
  const [form,   setForm]   = useState({
    teacher: "", subject: "", classroom: "", academic_year: "",
  });

  // ── pagination + search state ──────────────────────────────────────
  const [allocs,  setAllocs]  = useState([]);
  const [count,   setCount]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(false);

  const PAGE_SIZE  = 15;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  const { data: teachers  } = useFetch(() => getTeachers());
  const { data: subjects   } = useFetch(() => getSubjects());
  const { data: classrooms } = useFetch(() => getClassrooms());
  const { data: years      } = useFetch(() => getAcademicYears());

  // ── fetch allocations ──────────────────────────────────────────────
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

  // ── page numbers helper ────────────────────────────────────────────
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) range.push(i);
    return range;
  };

  // ── create allocation ──────────────────────────────────────────────
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
      setMsg({
        type: "danger",
        text: err.response?.data?.detail || "Failed to create allocation.",
      });
    }
  };

  // ── delete allocation ──────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Remove this allocation?")) return;
    try {
      await deleteAllocation(id);
      setMsg({ type: "success", text: "Allocation removed." });
      // If we deleted the last item on a non-first page, step back
      if (allocs.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchAllocs();
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
      <PageTitle
        title="Subject Allocation"
        breadcrumbs={[{ label: "Teachers" }, { label: "Subject Allocation" }]}
      />

      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      {/* ── Create form ── */}
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
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    required
                  >
                    <option value="">— {label} —</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <div>
                <label className="form-label" style={{ visibility: "hidden" }}>
                  Go
                </label>
                <button type="submit" className="btn btn-primary btn-sm w-100">
                  <i className="bi bi-plus-circle" /> Assign
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── Allocations table ── */}
      <div className="card">
        <div className="card-body">

          {/* toolbar: title + count + search */}
          <div className="tbl-toolbar mb-3">
            <h5 className="card-title mb-0">
              Current Allocations{" "}
              {count > 0 && (
                <span className="badge bg-primary ms-2">{count}</span>
              )}
            </h5>
            <div className="tbl-toolbar__right">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search teacher or subject…"
              />
            </div>
          </div>

          {/* table */}
          <div className="table-responsive">
            <table className="alloc-table">
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
                    <td colSpan={5} className="text-center py-4">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : allocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No allocations found.
                    </td>
                  </tr>
                ) : (
                  allocs.map((a) => (
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

          {/* pagination */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
              <small className="text-muted">
                Showing{" "}
                <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
                <strong>{Math.min(page * PAGE_SIZE, count)}</strong> of{" "}
                <strong>{count}</strong> allocations
              </small>

              <nav>
                <ul className="pagination pagination-sm mb-0">
                  {/* First */}
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      title="First"
                    >
                      «
                    </button>
                  </li>
                  {/* Prev */}
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 1}
                    >
                      ‹
                    </button>
                  </li>

                  {page > 3 && (
                    <li className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  )}

                  {getPageNumbers().map((n) => (
                    <li
                      key={n}
                      className={`page-item ${n === page ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    </li>
                  ))}

                  {page < totalPages - 2 && (
                    <li className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  )}

                  {/* Next */}
                  <li
                    className={`page-item ${page === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page === totalPages}
                    >
                      ›
                    </button>
                  </li>
                  {/* Last */}
                  <li
                    className={`page-item ${page === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      title="Last"
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}

        </div>
      </div>
    </>
  );
}