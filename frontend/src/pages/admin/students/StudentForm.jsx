import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createStudent, updateStudent, getStudent, getClassrooms, getForms } from "../../../utils/api";
import { PageTitle, AlertMessage } from "../../../components/common";

const INITIAL = {
  email: "", first_name: "", last_name: "", phone: "",
  admission_number: "", date_of_birth: "", gender: "",
  nationality: "Kenyan", kcpe_marks: "", kcpe_index_number: "",
  admission_date: new Date().toISOString().slice(0, 10),
  boarding_status: "day", current_classroom: "", parent: "",
  dormitory: "", bed_number: "", blood_group: "", medical_conditions: "",
};

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(id);

  useEffect(() => {
    getClassrooms().then((r) => setClassrooms(r.data)).catch(() => {});
    if (isEdit) {
      getStudent(id).then((r) => {
        const s = r.data;
        setForm({
          email: s.email || "",
          first_name: s.user?.first_name || "",
          last_name: s.user?.last_name || "",
          phone: s.user?.phone || "",
          admission_number: s.admission_number || "",
          date_of_birth: s.date_of_birth || "",
          gender: s.gender || "",
          nationality: s.nationality || "Kenyan",
          kcpe_marks: s.kcpe_marks || "",
          kcpe_index_number: s.kcpe_index_number || "",
          admission_date: s.admission_date || "",
          boarding_status: s.boarding_status || "day",
          current_classroom: s.current_classroom?.id || "",
          dormitory: s.dormitory || "",
          bed_number: s.bed_number || "",
          blood_group: s.blood_group || "",
          medical_conditions: s.medical_conditions || "",
        });
      }).catch(() => {});
    }
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isEdit) {
        await updateStudent(id, form);
      } else {
        await createStudent(form);
      }
      navigate("/admin/students");
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === "string"
          ? data
          : Object.entries(data || {})
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ") || "Failed to save student."
      );
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = "text", options, required = false }) => (
    <div className="col-md-6 mb-3">
      <label className="form-label fw-600">{label}{required && " *"}</label>
      {options ? (
        <select
          className="form-select"
          value={form[name]}
          onChange={(e) => set(name, e.target.value)}
          required={required}
        >
          <option value="">— Select —</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className="form-control"
          value={form[name]}
          onChange={(e) => set(name, e.target.value)}
          required={required}
        />
      )}
    </div>
  );

  return (
    <>
      <PageTitle
        title={isEdit ? "Edit Student" : "Admit New Student"}
        breadcrumbs={[
          { label: "Students", to: "/admin/students" },
          { label: isEdit ? "Edit" : "New" },
        ]}
      />

      <AlertMessage type="danger" message={error} onClose={() => setError("")} />

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">{isEdit ? "Update Student" : "Student Admission Form"}</h5>
          <form onSubmit={handleSubmit}>
            {/* Account */}
            <div className="row">
              <h6 className="text-primary-dark fw-700 mb-3 mt-2">Account Information</h6>
              <Field label="First Name" name="first_name" required />
              <Field label="Last Name" name="last_name" required />
              <Field label="Email Address" name="email" type="email" required={!isEdit} />
              <Field label="Phone Number" name="phone" type="tel" />
            </div>

            <hr />

            {/* Student */}
            <div className="row">
              <h6 className="text-primary-dark fw-700 mb-3">Student Details</h6>
              <Field label="Admission Number" name="admission_number" required />
              <Field label="Date of Birth" name="date_of_birth" type="date" />
              <Field
                label="Gender"
                name="gender"
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
                required
              />
              <Field label="Nationality" name="nationality" />
              <Field label="KCPE Index No" name="kcpe_index_number" />
              <Field label="KCPE Marks" name="kcpe_marks" type="number" />
              <Field label="Admission Date" name="admission_date" type="date" required />
              <Field
                label="Classroom"
                name="current_classroom"
                options={classrooms.map((c) => ({
                  value: c.id,
                  label: `${c.stream_display} – ${c.academic_year_display}`,
                }))}
              />
              <Field
                label="Boarding Status"
                name="boarding_status"
                options={[
                  { value: "day", label: "Day Scholar" },
                  { value: "boarding", label: "Boarding" },
                  { value: "day_boarding", label: "Day Boarding" },
                ]}
              />
            </div>

            <hr />

            {/* Boarding */}
            {form.boarding_status !== "day" && (
              <div className="row">
                <h6 className="text-primary-dark fw-700 mb-3">Boarding Details</h6>
                <Field label="Dormitory" name="dormitory" />
                <Field label="Bed Number" name="bed_number" />
              </div>
            )}

            {/* Medical */}
            <div className="row">
              <h6 className="text-primary-dark fw-700 mb-3">Medical</h6>
              <Field
                label="Blood Group"
                name="blood_group"
                options={["A+","A-","B+","B-","O+","O-","AB+","AB-"].map((b) => ({ value: b, label: b }))}
              />
              <div className="col-12 mb-3">
                <label className="form-label fw-600">Medical Conditions / Allergies</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.medical_conditions}
                  onChange={(e) => set("medical_conditions", e.target.value)}
                  placeholder="List any known conditions or 'None'"
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                ) : (
                  <><i className="bi bi-check2-circle me-2" />{isEdit ? "Update" : "Admit Student"}</>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/admin/students")}
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