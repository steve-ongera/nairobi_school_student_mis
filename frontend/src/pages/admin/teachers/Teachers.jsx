import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getTeachers, createTeacher, updateTeacher, deleteTeacher,
  getTeacher, getTeacherAllocations, getAllocations, createAllocation, deleteAllocation,
  getSubjects, getClassrooms, getAcademicYears,
} from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import {
  PageTitle, DataTable, SearchBar, AlertMessage, ConfirmDialog, LoadingSpinner,
} from "../../../components/common";

// ── Teacher List ──────────────────────────────────────────────────────────────
export function TeacherList() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

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
      render: (t) => <code>{t.staff_number || "—"}</code>,
    },
    {
      header: "Name",
      render: (t) => (
        <Link to={`/admin/teachers/${t.id}`} className="fw-600">
          {t.full_name}
        </Link>
      ),
    },
    { header: "Email", key: "email" },
    { header: "TSC No", render: (t) => t.tsc_number || "—" },
    { header: "Department", render: (t) => t.department || "—" },
    {
      header: "Allocations",
      render: (t) => (
        <span className="badge bg-primary">{t.allocation_count}</span>
      ),
    },
    {
      header: "Status",
      render: (t) => (
        <span className={`badge bg-${t.is_active ? "success" : "secondary"}`}>
          {t.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (t) => (
        <div className="d-flex gap-1">
          <Link
            to={`/admin/teachers/${t.id}`}
            className="btn btn-sm btn-outline-primary"
          >
            <i className="bi bi-eye" />
          </Link>
          <Link
            to={`/admin/teachers/${t.id}/edit`}
            className="btn btn-sm btn-outline-secondary"
          >
            <i className="bi bi-pencil" />
          </Link>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => setDeleteId(t.id)}
            data-bs-toggle="modal"
            data-bs-target="#confirmDelete"
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
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h5 className="card-title mb-0">All Teachers</h5>
            <div className="d-flex gap-2">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name or email…"
              />
              <Link to="/admin/teachers/new" className="btn btn-primary">
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
        id="confirmDelete"
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  );
}

// ── Teacher Form ──────────────────────────────────────────────────────────────
export function TeacherForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    staff_number: "",
    tsc_number: "",
    department: "",
    qualification: "",
    date_joined_school: new Date().toISOString().slice(0, 10),
    password: "school@2024",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    getTeacher(id).then((r) => {
      const t = r.data;
      setForm({
        email: t.email || "",
        first_name: t.user?.first_name || "",
        last_name: t.user?.last_name || "",
        phone: t.user?.phone || "",
        staff_number: t.staff_number || "",
        tsc_number: t.tsc_number || "",
        department: t.department || "",
        qualification: t.qualification || "",
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
      else await createTeacher(form);
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

  const Field = ({
    label,
    name,
    type = "text",
    required = false,
    placeholder,
  }) => (
    <div className="col-md-6 mb-3">
      <label className="form-label fw-600">
        {label}
        {required && " *"}
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
      <PageTitle
        title={isEdit ? "Edit Teacher" : "Add Teacher"}
        breadcrumbs={[
          { label: "Teachers", to: "/admin/teachers" },
          { label: isEdit ? "Edit" : "New" },
        ]}
      />
      {error && (
        <AlertMessage
          type="danger"
          message={error}
          onClose={() => setError("")}
        />
      )}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">
            {isEdit ? "Update Teacher Details" : "New Teacher Registration"}
          </h5>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <h6 className="text-primary-dark fw-700 mb-3">Account</h6>
              <Field label="First Name" name="first_name" required />
              <Field label="Last Name" name="last_name" required />
              <Field
                label="Email"
                name="email"
                type="email"
                required={!isEdit}
              />
              <Field label="Phone" name="phone" type="tel" />
              {!isEdit && (
                <Field
                  label="Initial Password"
                  name="password"
                  placeholder="Default: school@2024"
                />
              )}
            </div>
            <hr />
            <div className="row">
              <h6 className="text-primary-dark fw-700 mb-3">
                Professional Details
              </h6>
              <Field label="Staff Number" name="staff_number" required />
              <Field label="TSC Number" name="tsc_number" />
              <Field label="Department" name="department" />
              <Field label="Qualification" name="qualification" />
              <Field
                label="Date Joined School"
                name="date_joined_school"
                type="date"
              />
            </div>
            <div className="d-flex gap-2 mt-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm me-2" />
                )}
                {isEdit ? "Update Teacher" : "Add Teacher"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
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

// ── Subject Allocation ────────────────────────────────────────────────────────
export function SubjectAllocation() {
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [form, setForm] = useState({
    teacher: "",
    subject: "",
    classroom: "",
    academic_year: "",
  });

  const { data: teachers } = useFetch(() => getTeachers());
  const { data: subjects } = useFetch(() => getSubjects());
  const { data: classrooms } = useFetch(() => getClassrooms());
  const { data: years } = useFetch(() => getAcademicYears());
  const { data: allocs, loading, refetch } = useFetch(() => getAllocations());

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAllocation({
        teacher: parseInt(form.teacher),
        subject: parseInt(form.subject),
        classroom: parseInt(form.classroom),
        academic_year: parseInt(form.academic_year),
      });
      setMsg({ type: "success", text: "Allocation created successfully." });
      refetch();
      setForm({ teacher: "", subject: "", classroom: "", academic_year: "" });
    } catch (err) {
      setMsg({
        type: "danger",
        text: err.response?.data?.detail || "Failed to create allocation.",
      });
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
      options: (teachers ?? []).map((t) => ({
        value: t.id,
        label: t.full_name,
      })),
    },
    {
      label: "Subject",
      key: "subject",
      options: (subjects ?? []).map((s) => ({
        value: s.id,
        label: s.name,
      })),
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
      options: (years ?? []).map((y) => ({
        value: y.id,
        label: y.year,
      })),
    },
  ];

  return (
    <>
      <PageTitle
        title="Subject Allocation"
        breadcrumbs={[
          { label: "Teachers" },
          { label: "Subject Allocation" },
        ]}
      />
      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Assign Teacher → Subject → Classroom</h5>
          <form onSubmit={handleCreate} className="row g-3">
            {selects.map(({ label, key, options }) => (
              <div key={key} className="col-md-3">
                <label className="form-label fw-600">{label}</label>
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
            <div className="col-12">
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-plus-circle me-2" />
                Create Allocation
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Current Allocations</h5>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Teacher</th>
                    <th>Subject</th>
                    <th>Classroom</th>
                    <th>Year</th>
                    <th></th>
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
                        <td className="fw-600">{a.teacher_name}</td>
                        <td>{a.subject_name}</td>
                        <td>{a.classroom_display}</td>
                        <td>{a.academic_year_display}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(a.id)}
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