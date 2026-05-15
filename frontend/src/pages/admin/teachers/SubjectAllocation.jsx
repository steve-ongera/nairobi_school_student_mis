import { useState } from "react";
import {
  getTeachers, getAllocations, createAllocation, deleteAllocation,
  getSubjects, getClassrooms, getAcademicYears,
} from "../../../utils/api";
import { useFetch } from "../../../hooks";
import {
  PageTitle, AlertMessage, LoadingSpinner,
} from "../../../components/common";

export function SubjectAllocation() {
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [form, setForm] = useState({ teacher: "", subject: "", classroom: "", academic_year: "" });
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
      setMsg({ type: "success", text: "Allocation created." });
      refetch();
      setForm({ teacher: "", subject: "", classroom: "", academic_year: "" });
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.detail || "Failed to allocate." });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this allocation?")) return;
    try {
      await deleteAllocation(id);
      refetch();
    } catch {
      setMsg({ type: "danger", text: "Failed to remove." });
    }
  };

  return (
    <>
      <PageTitle
        title="Subject Allocation"
        breadcrumbs={[{ label: "Teachers" }, { label: "Subject Allocation" }]}
      />
      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Assign Teacher → Subject → Classroom</h5>
          <form onSubmit={handleCreate} className="row g-3">
            {[
              { label: "Teacher", key: "teacher", options: teachers?.map((t) => ({ value: t.id, label: t.full_name })) },
              { label: "Subject", key: "subject", options: subjects?.map((s) => ({ value: s.id, label: s.name })) },
              { label: "Classroom", key: "classroom", options: classrooms?.map((c) => ({ value: c.id, label: `${c.stream_display} – ${c.academic_year_display}` })) },
              { label: "Academic Year", key: "academic_year", options: years?.map((y) => ({ value: y.id, label: y.year })) },
            ].map(({ label, key, options }) => (
              <div key={key} className="col-md-3">
                <label className="form-label fw-600">{label}</label>
                <select className="form-select form-select-sm" value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} required>
                  <option value="">— {label} —</option>
                  {options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
            <div className="col-md-12">
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-plus-circle me-2" />Create Allocation
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
                    <th>Teacher</th><th>Subject</th><th>Classroom</th><th>Year</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {allocs?.map((a) => (
                    <tr key={a.id}>
                      <td className="fw-600">{a.teacher_name}</td>
                      <td>{a.subject_name}</td>
                      <td>{a.classroom_display}</td>
                      <td>{a.academic_year_display}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(a.id)}>
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}