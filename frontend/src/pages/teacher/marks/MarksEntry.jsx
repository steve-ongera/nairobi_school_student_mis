import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getExams, getSubjects, getClassrooms, getClassroomStudents, submitBulkMarks,
} from "../../../utils/api";
import { PageTitle, AlertMessage, LoadingSpinner } from "../../../components/common";

export default function MarksEntry() {
  const [searchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [selected, setSelected] = useState({
    exam: searchParams.get("exam") || "",
    subject: searchParams.get("subject") || "",
    classroom: searchParams.get("classroom") || "",
  });
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    Promise.all([getExams(), getSubjects(), getClassrooms()])
      .then(([e, s, c]) => {
        setExams(e.data);
        setSubjects(s.data);
        setClassrooms(c.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected.classroom) { setStudents([]); return; }
    setStudentsLoading(true);
    getClassroomStudents(selected.classroom)
      .then((r) => {
        setStudents(r.data);
        const initial = {};
        r.data.forEach((s) => { initial[s.id] = { marks: "", remarks: "" }; });
        setMarks(initial);
      })
      .catch(() => {})
      .finally(() => setStudentsLoading(false));
  }, [selected.classroom]);

  const setMark = (studentId, field, value) => {
    setMarks((m) => ({ ...m, [studentId]: { ...m[studentId], [field]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected.exam || !selected.subject || !selected.classroom) {
      setMsg({ type: "warning", text: "Please select exam, subject, and classroom." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const results = students.map((s) => ({
        student: s.id,
        marks: parseFloat(marks[s.id]?.marks) || 0,
        remarks: marks[s.id]?.remarks || "",
      })).filter((r) => r.marks > 0);

      const { data } = await submitBulkMarks({
        exam: parseInt(selected.exam),
        subject: parseInt(selected.subject),
        classroom: parseInt(selected.classroom),
        results,
      });

      setMsg({
        type: "success",
        text: `Saved: ${data.created} new, ${data.updated} updated.${
          data.errors?.length ? ` ${data.errors.length} errors.` : ""
        }`,
      });
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.detail || "Failed to save marks." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="Enter Marks" breadcrumbs={[{ label: "Marks" }, { label: "Entry" }]} />

      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Select Exam, Subject & Class</h5>
          <div className="row g-3 mb-4">
            {[
              {
                label: "Exam", key: "exam",
                options: exams.map((e) => ({ value: e.id, label: `${e.name} – ${e.term_display}` })),
              },
              {
                label: "Subject", key: "subject",
                options: subjects.map((s) => ({ value: s.id, label: s.name })),
              },
              {
                label: "Classroom", key: "classroom",
                options: classrooms.map((c) => ({ value: c.id, label: `${c.stream_display} – ${c.academic_year_display}` })),
              },
            ].map(({ label, key, options }) => (
              <div key={key} className="col-md-4">
                <label className="form-label fw-600">{label}</label>
                <select
                  className="form-select"
                  value={selected[key]}
                  onChange={(e) => setSelected((s) => ({ ...s, [key]: e.target.value }))}
                >
                  <option value="">— Select {label} —</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {studentsLoading && <LoadingSpinner message="Loading students…" />}

          {!studentsLoading && students.length > 0 && (
            <form onSubmit={handleSubmit}>
              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Adm No</th>
                      <th>Student Name</th>
                      <th style={{ width: 140 }}>Marks (0–100)</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id}>
                        <td>{i + 1}</td>
                        <td><code>{s.admission_number}</code></td>
                        <td className="fw-600">{s.full_name}</td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            min={0}
                            max={100}
                            step={0.5}
                            value={marks[s.id]?.marks || ""}
                            onChange={(e) => setMark(s.id, "marks", e.target.value)}
                            placeholder="0–100"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={marks[s.id]?.remarks || ""}
                            onChange={(e) => setMark(s.id, "remarks", e.target.value)}
                            placeholder="Optional"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                  ) : (
                    <><i className="bi bi-check2-circle me-2" />Save {students.length} Marks</>
                  )}
                </button>
                <span className="text-muted small align-self-center">
                  {students.filter((s) => marks[s.id]?.marks).length} / {students.length} filled
                </span>
              </div>
            </form>
          )}

          {!studentsLoading && selected.classroom && students.length === 0 && (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-people" style={{ fontSize: 32 }} />
              <p className="mt-2">No students in this classroom.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}