import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getExams, getSubjects, getClassrooms, getClassroomStudents, submitBulkMarks,
} from "../../../utils/api";
import { PageTitle, AlertMessage, LoadingSpinner } from "../../../components/common";

// Helper: unwrap DRF paginated or plain array responses
const unwrap = (res) => res?.data?.results ?? res?.data ?? [];

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
  const [fetchError, setFetchError] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Load dropdowns on mount
  useEffect(() => {
    Promise.all([getExams(), getSubjects(), getClassrooms()])
      .then(([e, s, c]) => {
        setExams(unwrap(e));
        setSubjects(unwrap(s));
        setClassrooms(unwrap(c));
      })
      .catch(() => setFetchError("Failed to load dropdown data. Please refresh."));
  }, []);

  // Load students when classroom changes
  useEffect(() => {
    if (!selected.classroom) {
      setStudents([]);
      setMarks({});
      return;
    }
    setStudentsLoading(true);
    getClassroomStudents(selected.classroom)
      .then((r) => {
        const list = unwrap(r);
        setStudents(list);
        // Initialise marks map keyed by student id
        const initial = {};
        list.forEach((s) => {
          initial[s.id] = { marks: "", remarks: "" };
        });
        setMarks(initial);
      })
      .catch(() => setMsg({ type: "danger", text: "Failed to load students." }))
      .finally(() => setStudentsLoading(false));
  }, [selected.classroom]);

  const setMark = (studentId, field, value) => {
    setMarks((m) => ({ ...m, [studentId]: { ...m[studentId], [field]: value } }));
  };

  // Fill all students with the same mark (quick-fill helper)
  const fillAll = (value) => {
    setMarks((m) => {
      const updated = { ...m };
      students.forEach((s) => {
        updated[s.id] = { ...updated[s.id], marks: value };
      });
      return updated;
    });
  };

  const filledCount = students.filter((s) => marks[s.id]?.marks !== "").length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected.exam || !selected.subject || !selected.classroom) {
      setMsg({ type: "warning", text: "Please select exam, subject, and classroom." });
      return;
    }

    const results = students
      .map((s) => ({
        student: s.id,
        marks: parseFloat(marks[s.id]?.marks),
        remarks: marks[s.id]?.remarks || "",
      }))
      .filter((r) => !isNaN(r.marks) && r.marks >= 0);

    if (results.length === 0) {
      setMsg({ type: "warning", text: "No marks entered. Please fill in at least one student." });
      return;
    }

    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const { data } = await submitBulkMarks({
        exam: parseInt(selected.exam),
        subject: parseInt(selected.subject),
        classroom: parseInt(selected.classroom),
        results,
      });
      setMsg({
        type: "success",
        text: `Saved: ${data.created} new, ${data.updated} updated.${
          data.errors?.length ? ` ⚠ ${data.errors.length} error(s).` : ""
        }`,
      });
    } catch (err) {
      setMsg({
        type: "danger",
        text: err.response?.data?.detail || "Failed to save marks. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectConfigs = [
    {
      label: "Exam",
      key: "exam",
      options: exams.map((e) => ({
        value: e.id,
        label: `${e.name} – ${e.term_display}`,
      })),
    },
    {
      label: "Subject",
      key: "subject",
      options: subjects.map((s) => ({
        value: s.id,
        label: s.name,
      })),
    },
    {
      label: "Classroom",
      key: "classroom",
      options: classrooms.map((c) => ({
        value: c.id,
        label: `${c.stream_display} – ${c.academic_year_display}`,
      })),
    },
  ];

  return (
    <>
      <PageTitle
        title="Enter Marks"
        breadcrumbs={[{ label: "Marks" }, { label: "Entry" }]}
      />

      {fetchError && <AlertMessage type="danger" message={fetchError} />}
      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      {/* ── Selectors ── */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Select Exam, Subject & Class</h5>
          <div className="row g-3">
            {selectConfigs.map(({ label, key, options }) => (
              <div key={key} className="col-md-4">
                <label className="form-label fw-600">{label}</label>
                <select
                  className="form-select"
                  value={selected[key]}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, [key]: e.target.value }))
                  }
                >
                  <option value="">— Select {label} —</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Marks Table ── */}
      <div className="card">
        <div className="card-body">
          {studentsLoading && <LoadingSpinner message="Loading students…" />}

          {!studentsLoading && selected.classroom && students.length === 0 && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-people" style={{ fontSize: 36 }} />
              <p className="mt-2 mb-0">No students found in this classroom.</p>
            </div>
          )}

          {!studentsLoading && !selected.classroom && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-arrow-up-circle" style={{ fontSize: 36 }} />
              <p className="mt-2 mb-0">Select an exam, subject, and classroom above to begin.</p>
            </div>
          )}

          {!studentsLoading && students.length > 0 && (
            <form onSubmit={handleSubmit}>
              {/* Quick-fill toolbar */}
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h6 className="mb-0 fw-700">
                  {students.length} Students &mdash;{" "}
                  <span className="text-muted fw-400">
                    {filledCount} / {students.length} filled
                  </span>
                </h6>
                <div className="d-flex gap-2 align-items-center">
                  <span className="text-muted small">Quick fill:</span>
                  {[0, 50, 100].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => fillAll(String(v))}
                    >
                      {v}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => fillAll("")}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th style={{ width: 110 }}>Adm No</th>
                      <th>Student Name</th>
                      <th style={{ width: 150 }}>Marks (0 – 100)</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const marksVal = marks[s.id]?.marks ?? "";
                      const isInvalid =
                        marksVal !== "" &&
                        (isNaN(parseFloat(marksVal)) ||
                          parseFloat(marksVal) < 0 ||
                          parseFloat(marksVal) > 100);
                      return (
                        <tr key={s.id}>
                          <td className="text-muted">{i + 1}</td>
                          <td>
                            <code>{s.admission_number}</code>
                          </td>
                          <td className="fw-600">{s.full_name}</td>
                          <td>
                            <input
                              type="number"
                              className={`form-control form-control-sm ${
                                isInvalid ? "is-invalid" : ""
                              }`}
                              min={0}
                              max={100}
                              step={0.5}
                              value={marksVal}
                              onChange={(e) =>
                                setMark(s.id, "marks", e.target.value)
                              }
                              placeholder="0 – 100"
                            />
                            {isInvalid && (
                              <div className="invalid-feedback">0 – 100 only</div>
                            )}
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={marks[s.id]?.remarks || ""}
                              onChange={(e) =>
                                setMark(s.id, "remarks", e.target.value)
                              }
                              placeholder="Optional"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle me-2" />
                      Save {filledCount} Mark{filledCount !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}