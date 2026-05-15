import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createExam, updateExam, getExam, getTerms, getForms } from "../../../utils/api";
import { PageTitle, AlertMessage } from "../../../components/common";

export default function ExamForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    name: "", exam_type: "endterm", term: "",
    applicable_form_ids: [], date: "", max_marks: 100, is_published: false,
  });
  const [terms, setTerms] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getTerms(), getForms()]).then(([t, f]) => {
      setTerms(t.data);
      setForms(f.data);
    });
    if (isEdit) {
      getExam(id).then((r) => {
        const e = r.data;
        setForm({
          name: e.name || "",
          exam_type: e.exam_type || "endterm",
          term: e.term || "",
          applicable_form_ids: e.applicable_forms?.map((f) => f.id) || [],
          date: e.date || "",
          max_marks: e.max_marks || 100,
          is_published: e.is_published || false,
        });
      });
    }
  }, [id]);

  const toggleForm = (formId) => {
    setForm((f) => ({
      ...f,
      applicable_form_ids: f.applicable_form_ids.includes(formId)
        ? f.applicable_form_ids.filter((i) => i !== formId)
        : [...f.applicable_form_ids, formId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isEdit) await updateExam(id, form);
      else await createExam(form);
      navigate("/admin/exams");
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === "string" ? d : Object.values(d || {}).flat().join(" | ") || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle
        title={isEdit ? "Edit Exam" : "Create Exam"}
        breadcrumbs={[{ label: "Exams", to: "/admin/exams" }, { label: isEdit ? "Edit" : "New" }]}
      />
      {error && <AlertMessage type="danger" message={error} onClose={() => setError("")} />}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">{isEdit ? "Update Exam Details" : "New Exam"}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-600">Exam Name *</label>
                <input type="text" className="form-control" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-600">Exam Type *</label>
                <select className="form-select" value={form.exam_type}
                  onChange={(e) => setForm((f) => ({ ...f, exam_type: e.target.value }))} required>
                  {[["opener","Opener"],["cat","CAT"],["midterm","Mid-Term"],["endterm","End-Term"],["mock","Mock KCSE"]].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-600">Max Marks</label>
                <input type="number" className="form-control" value={form.max_marks}
                  onChange={(e) => setForm((f) => ({ ...f, max_marks: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-600">Term *</label>
                <select className="form-select" value={form.term}
                  onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))} required>
                  <option value="">— Select Term —</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>{t.academic_year_display} – Term {t.term_number}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-600">Exam Date</label>
                <input type="date" className="form-control" value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label fw-600">Applicable Forms *</label>
                <div className="d-flex gap-3">
                  {forms.map((fm) => (
                    <div key={fm.id} className="form-check">
                      <input type="checkbox" className="form-check-input" id={`form-${fm.id}`}
                        checked={form.applicable_form_ids.includes(fm.id)}
                        onChange={() => toggleForm(fm.id)} />
                      <label className="form-check-label" htmlFor={`form-${fm.id}`}>{fm.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              {isEdit && (
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input type="checkbox" className="form-check-input" id="isPublished"
                      checked={form.is_published}
                      onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} />
                    <label className="form-check-label fw-600" htmlFor="isPublished">Published (visible to students)</label>
                  </div>
                </div>
              )}
            </div>
            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {isEdit ? "Update Exam" : "Create Exam"}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/admin/exams")}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}