import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTeacher, createTeacher, updateTeacher } from "../../../utils/api";
import { PageTitle, AlertMessage } from "../../../components/common";

// ✅ Field defined OUTSIDE so it never remounts on re-render
const Field = ({ label, name, type = "text", required = false, placeholder, form, set }) => (
  <div className="col-md-6 mb-3">
    <label className="form-label fw-600">{label}{required && " *"}</label>
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

export function TeacherForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    email: "", first_name: "", last_name: "", phone: "",
    staff_number: "", tsc_number: "", department: "", qualification: "",
    date_joined_school: new Date().toISOString().slice(0, 10),
    password: "school@2024",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
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
    }
  }, [id]);

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

  const fieldProps = { form, set };

  return (
    <>
      <PageTitle
        title={isEdit ? "Edit Teacher" : "Add Teacher"}
        breadcrumbs={[{ label: "Teachers", to: "/admin/teachers" }, { label: isEdit ? "Edit" : "New" }]}
      />
      {error && <AlertMessage type="danger" message={error} onClose={() => setError("")} />}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">{isEdit ? "Update Teacher Details" : "New Teacher Registration"}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <h6 className="text-primary-dark fw-700 mb-3">Account</h6>
              <Field label="First Name" name="first_name" required {...fieldProps} />
              <Field label="Last Name" name="last_name" required {...fieldProps} />
              <Field label="Email" name="email" type="email" required={!isEdit} {...fieldProps} />
              <Field label="Phone" name="phone" type="tel" {...fieldProps} />
              {!isEdit && (
                <Field label="Initial Password" name="password" placeholder="Default: school@2024" {...fieldProps} />
              )}
            </div>
            <hr />
            <div className="row">
              <h6 className="text-primary-dark fw-700 mb-3">Professional Details</h6>
              <Field label="Staff Number" name="staff_number" required {...fieldProps} />
              <Field label="TSC Number" name="tsc_number" {...fieldProps} />
              <Field label="Department" name="department" {...fieldProps} />
              <Field label="Qualification" name="qualification" {...fieldProps} />
              <Field label="Date Joined School" name="date_joined_school" type="date" {...fieldProps} />
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {isEdit ? "Update" : "Add Teacher"}
              </button>
              <button type="button" className="btn btn-outline-secondary"
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