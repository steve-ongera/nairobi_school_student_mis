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
      options: exams.map((e) => ({ value: e.id, label: `${e.name} – ${e.term_display}` })),
    },
    {
      label: "Subject",
      key: "subject",
      options: subjects.map((s) => ({ value: s.id, label: s.name })),
    },
    {
      label: "Classroom",
      key: "classroom",
      options: classrooms.map((c) => ({ value: c.id, label: `${c.stream_display} – ${c.academic_year_display}` })),
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
      <div className="card">
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

          {/* Loading students */}
          {studentsLoading && <LoadingSpinner message="Loading students…" />}

          {/* No classroom selected */}
          {!studentsLoading && !selected.classroom && (
            <div className="text-center text-muted py-5">
              <i className="bi bi-pencil-square" style={{ fontSize: 36 }} />
              <p className="mt-2 mb-0">Select an exam, subject, and classroom above to begin.</p>
            </div>
          )}

          {/* Classroom selected but no students */}
          {!studentsLoading && selected.classroom && students.length === 0 && (
            <div className="empty-message">
              <i className="bi bi-people" style={{ fontSize: 36, display: "block", marginBottom: 8 }} />
              No students found in this classroom.
            </div>
          )}

          {/* ── Main entry form ── */}
          {!studentsLoading && students.length > 0 && (
            <form onSubmit={handleSubmit}>

              {/* Toolbar */}
              <div className="tbl-toolbar">
                <h5 className="card-title mb-0">
                  {students.length} Students
                  <span
                    className="count-chip"
                    style={{
                      marginLeft: 10,
                      fontSize: 13,
                      background: filledCount === students.length ? "#e0f8e9" : "var(--primary-light)",
                      color: filledCount === students.length ? "#2eca6a" : "var(--primary-dark)",
                    }}
                  >
                    {filledCount} / {students.length} filled
                  </span>
                </h5>

                {/* Quick-fill buttons */}
                <div className="tbl-toolbar__right">
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                    Quick fill:
                  </span>
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
                    className="btn btn-outline-secondary btn-sm"
                    style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                    onClick={() => fillAll("")}
                  >
                    <i className="bi bi-x-circle" /> Clear
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th style={{ width: 120 }}>Adm No</th>
                      <th>Student</th>
                      <th style={{ width: 160 }}>Marks (0 – 100)</th>
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
                          {/* Row number */}
                          <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{i + 1}</td>

                          {/* Adm No — monospace, no label repetition */}
                          <td>
                            <code className="adm-link" style={{ fontSize: 12 }}>
                              {s.admission_number}
                            </code>
                          </td>

                          {/* Student name with avatar initial */}
                          <td>
                            <div className="student-cell">
                              <div className="student-avatar">
                                {s.full_name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="student-cell__name fw-600">{s.full_name}</span>
                            </div>
                          </td>

                          {/* Marks input */}
                          <td>
                            <input
                              type="number"
                              className={`form-control form-control-sm ${isInvalid ? "is-invalid" : ""}`}
                              min={0}
                              max={100}
                              step={0.5}
                              value={marksVal}
                              onChange={(e) => setMark(s.id, "marks", e.target.value)}
                              placeholder="0 – 100"
                            />
                            {isInvalid && (
                              <div className="invalid-feedback">0 – 100 only</div>
                            )}
                          </td>

                          {/* Remarks input */}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Submit */}
              <div className="d-flex gap-2 mt-3">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || filledCount === 0}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle" />
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