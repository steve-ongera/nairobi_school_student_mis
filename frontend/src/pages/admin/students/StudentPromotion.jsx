import { useState } from "react";
import { bulkPromote, getClassrooms, getAcademicYears } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, AlertMessage, LoadingSpinner } from "../../../components/common";

export default function StudentPromotion() {
  const [form, setForm] = useState({
    from_classroom: "",
    to_classroom: "",
    academic_year: "",
    promotion_status: "promoted",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [result, setResult] = useState(null);

  const { data: classrooms } = useFetch(() => getClassrooms());
  const { data: years } = useFetch(() => getAcademicYears());

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm(
      `Promote all active students from the selected classroom?\nThis action cannot be undone.`
    )) return;

    setLoading(true);
    setMsg({ type: "", text: "" });
    setResult(null);
    try {
      const { data } = await bulkPromote({
        from_classroom: parseInt(form.from_classroom),
        to_classroom: form.to_classroom ? parseInt(form.to_classroom) : undefined,
        academic_year: parseInt(form.academic_year),
        promotion_status: form.promotion_status,
        notes: form.notes,
      });
      setResult(data);
      setMsg({ type: "success", text: data.detail });
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.detail || "Promotion failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Student Promotions"
        breadcrumbs={[{ label: "Students" }, { label: "Promotions" }]}
      />

      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="row">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Bulk Promotion</h5>

              <div className="alert alert-warning py-2 px-3 mb-3">
                <i className="bi bi-exclamation-triangle me-2" />
                <small>
                  This promotes <strong>all active students</strong> from the selected classroom.
                  Ensure the academic year and classrooms are correct before proceeding.
                </small>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-600">From Classroom *</label>
                  <select
                    className="form-select"
                    value={form.from_classroom}
                    onChange={(e) => set("from_classroom", e.target.value)}
                    required
                  >
                    <option value="">— Select source classroom —</option>
                    {classrooms?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.stream_display} – {c.academic_year_display}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-600">To Classroom (optional)</label>
                  <select
                    className="form-select"
                    value={form.to_classroom}
                    onChange={(e) => set("to_classroom", e.target.value)}
                  >
                    <option value="">— Auto-assign next class —</option>
                    {classrooms?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.stream_display} – {c.academic_year_display}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">Leave blank to auto-assign to next form.</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-600">Academic Year *</label>
                  <select
                    className="form-select"
                    value={form.academic_year}
                    onChange={(e) => set("academic_year", e.target.value)}
                    required
                  >
                    <option value="">— Select year —</option>
                    {years?.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.year} {y.is_current ? "(Current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-600">Promotion Status</label>
                  <select
                    className="form-select"
                    value={form.promotion_status}
                    onChange={(e) => set("promotion_status", e.target.value)}
                  >
                    <option value="promoted">Promoted</option>
                    <option value="repeated">Repeated</option>
                    <option value="graduated">Graduated (Form 4)</option>
                    <option value="transferred">Transferred Out</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-600">Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="Optional notes about this promotion batch"
                  />
                </div>

                <button type="submit" className="btn btn-warning fw-600" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Running promotions…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-up-circle me-2" />
                      Run Bulk Promotion
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="col-lg-6">
          {result && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title text-success">
                  <i className="bi bi-check-circle me-2" />
                  Promotion Complete
                </h5>
                <p className="text-muted">{result.detail}</p>
                <div className="table-responsive" style={{ maxHeight: 400, overflowY: "auto" }}>
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Student</th>
                        <th>Adm No</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.promotions?.map((p) => (
                        <tr key={p.id}>
                          <td className="fw-600">{p.student_name}</td>
                          <td>
                            <code style={{ fontSize: 11 }}>{p.admission_number}</code>
                          </td>
                          <td style={{ fontSize: 12 }}>{p.from_classroom_display}</td>
                          <td style={{ fontSize: 12 }}>{p.to_classroom_display || "—"}</td>
                          <td>
                            <span className="badge bg-success text-capitalize">
                              {p.promotion_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Info card */}
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">How It Works</h5>
              <ol className="text-muted" style={{ fontSize: 14 }}>
                <li className="mb-2">Select the classroom whose students you want to promote.</li>
                <li className="mb-2">Optionally select the destination classroom.</li>
                <li className="mb-2">Select the academic year for the promotion record.</li>
                <li className="mb-2">Choose the promotion status (Promoted, Repeated, etc.).</li>
                <li>Click "Run Bulk Promotion" – all active students will be moved.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}