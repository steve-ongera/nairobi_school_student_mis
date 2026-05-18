import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getExams, getSubjects, getClassrooms, getClassroomStudents,
  submitBulkMarks, getResultsByFilter, getMyAllocations,
} from "../../../utils/api";
import { PageTitle, AlertMessage, LoadingSpinner } from "../../../components/common";

// ─── helpers ────────────────────────────────────────────────────────────────

const unwrap = (res) => res?.data?.results ?? res?.data ?? [];

/**
 * Auto-generate a remark string from a raw marks value (0–100).
 * Returns "" when marks is empty / not a valid number.
 */
const autoRemark = (marksVal) => {
  const v = parseFloat(marksVal);
  if (isNaN(v) || marksVal === "") return "";
  if (v >= 80) return "Excellent";
  if (v >= 70) return "Very Good";
  if (v >= 60) return "Good";
  if (v >= 50) return "Average";
  if (v >= 40) return "Below Average";
  return "Poor";
};

// ─── component ──────────────────────────────────────────────────────────────

export default function MarksEntry() {
  const [searchParams] = useSearchParams();

  // ── dropdown data
  const [exams,      setExams]      = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  // ── allocation guard
  const [myAllocations,     setMyAllocations]     = useState([]);  // teacher's allocations
  const [allocationsLoaded, setAllocationsLoaded] = useState(false);
  const [isAdmin,           setIsAdmin]           = useState(false); // admins bypass guard

  // ── selection
  const [selected, setSelected] = useState({
    exam:      searchParams.get("exam")      || "",
    subject:   searchParams.get("subject")   || "",
    classroom: searchParams.get("classroom") || "",
  });

  // ── students + marks
  const [students,        setStudents]        = useState([]);
  const [marks,           setMarks]           = useState({});   // { [studentId]: { marks, remarks } }
  const [existingResults, setExistingResults] = useState({}); // { [studentId]: ExamResult }

  // ── UI state
  const [loading,         setLoading]         = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [resultsLoading,  setResultsLoading]  = useState(false);
  const [fetchError,      setFetchError]      = useState("");
  const [msg,             setMsg]             = useState({ type: "", text: "" });
  const [editMode,        setEditMode]        = useState(false);  // false = view-only when results exist

  // ────────────────────────────────────────────────────────────────────────
  // 1. Load dropdowns + teacher allocations on mount
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const role = localStorage.getItem("role") || sessionStorage.getItem("role") || "";
    const admin = role === "admin";
    setIsAdmin(admin);

    const drops = Promise.all([getExams(), getSubjects(), getClassrooms()]);
    const allocs = admin ? Promise.resolve(null) : getMyAllocations().catch(() => null);

    Promise.all([drops, allocs])
      .then(([[e, s, c], allocRes]) => {
        setExams(unwrap(e));
        setSubjects(unwrap(s));
        setClassrooms(unwrap(c));
        if (!admin && allocRes) {
          setMyAllocations(unwrap(allocRes));
        }
        setAllocationsLoaded(true);
      })
      .catch(() => {
        setFetchError("Failed to load data. Please refresh.");
        setAllocationsLoaded(true);
      });
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // 2. Derive whether this teacher is allocated to the selected combo
  // ────────────────────────────────────────────────────────────────────────
  const isAllocated = useMemo(() => {
    if (isAdmin) return true;
    if (!selected.subject || !selected.classroom) return null; // not yet selected
    return myAllocations.some(
      (a) =>
        String(a.subject) === String(selected.subject) &&
        String(a.classroom) === String(selected.classroom)
    );
  }, [isAdmin, myAllocations, selected.subject, selected.classroom]);

  // ────────────────────────────────────────────────────────────────────────
  // 3. Load students when classroom changes
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected.classroom) {
      setStudents([]);
      setMarks({});
      setExistingResults({});
      setEditMode(false);
      return;
    }
    setStudentsLoading(true);
    getClassroomStudents(selected.classroom)
      .then((r) => {
        const list = unwrap(r);
        setStudents(list);
        // initialise empty marks for each student
        const initial = {};
        list.forEach((s) => { initial[s.id] = { marks: "", remarks: "" }; });
        setMarks(initial);
        setExistingResults({});
        setEditMode(false);
      })
      .catch(() => setMsg({ type: "danger", text: "Failed to load students." }))
      .finally(() => setStudentsLoading(false));
  }, [selected.classroom]);

  // ────────────────────────────────────────────────────────────────────────
  // 4. Fetch existing results when exam + subject + students are ready
  // ────────────────────────────────────────────────────────────────────────
  const fetchExistingResults = useCallback(async () => {
    if (!selected.exam || !selected.subject || students.length === 0) {
      setExistingResults({});
      setEditMode(false);
      return;
    }

    setResultsLoading(true);
    try {
      // GET /api/results/?exam=<id>&subject=<id>
      const res = await getResultsByFilter({
        exam: selected.exam,
        subject: selected.subject,
      });
      const list = unwrap(res);

      // Build a map { studentId → result }
      const map = {};
      list.forEach((r) => {
        const sid = r.student ?? r.student_id;
        if (sid) map[String(sid)] = r;
      });
      setExistingResults(map);

      // Pre-fill marks state with existing data
      setMarks((prev) => {
        const next = { ...prev };
        students.forEach((s) => {
          const existing = map[String(s.id)];
          if (existing) {
            const parsedMarks = existing.marks != null ? String(parseFloat(existing.marks)) : "";
            next[s.id] = {
              marks:   parsedMarks,
              remarks: existing.remarks || autoRemark(parsedMarks),
            };
          } else {
            // keep whatever was typed, or blank
            next[s.id] = next[s.id] ?? { marks: "", remarks: "" };
          }
        });
        return next;
      });

      // Default to view mode if results already exist
      const hasAny = list.length > 0;
      setEditMode(!hasAny); // no results → straight into edit mode
    } catch {
      setMsg({ type: "warning", text: "Could not load existing marks." });
    } finally {
      setResultsLoading(false);
    }
  }, [selected.exam, selected.subject, students]);

  useEffect(() => { fetchExistingResults(); }, [fetchExistingResults]);

  // ────────────────────────────────────────────────────────────────────────
  // 5. Mark helpers
  // ────────────────────────────────────────────────────────────────────────
  const setMark = (studentId, field, value) => {
    setMarks((m) => {
      const updated = { ...m, [studentId]: { ...m[studentId], [field]: value } };
      // Auto-fill remark whenever marks change (only if remark matches previous auto or is empty)
      if (field === "marks") {
        const prevAuto  = autoRemark(m[studentId]?.marks ?? "");
        const curRemark = m[studentId]?.remarks ?? "";
        if (curRemark === "" || curRemark === prevAuto) {
          updated[studentId].remarks = autoRemark(value);
        }
      }
      return updated;
    });
  };

  const fillAll = (value) => {
    setMarks((m) => {
      const updated = { ...m };
      students.forEach((s) => {
        updated[s.id] = {
          marks:   value,
          remarks: value === "" ? "" : autoRemark(value),
        };
      });
      return updated;
    });
  };

  // ────────────────────────────────────────────────────────────────────────
  // 6. Derived counts
  // ────────────────────────────────────────────────────────────────────────
  const filledCount   = students.filter((s) => marks[s.id]?.marks !== "").length;
  const existingCount = Object.keys(existingResults).length;
  const hasExisting   = existingCount > 0;

  // The table is read-only when: there are existing results AND we're not in edit mode
  // AND the teacher is allocated (or admin). Non-allocated teachers are always read-only.
  const readOnly = !editMode || !isAllocated;

  // ────────────────────────────────────────────────────────────────────────
  // 7. Submit
  // ────────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected.exam || !selected.subject || !selected.classroom) {
      setMsg({ type: "warning", text: "Please select exam, subject, and classroom." });
      return;
    }

    const results = students
      .map((s) => ({
        student: s.id,
        marks:   parseFloat(marks[s.id]?.marks),
        remarks: marks[s.id]?.remarks || autoRemark(marks[s.id]?.marks),
      }))
      .filter((r) => !isNaN(r.marks) && r.marks >= 0);

    if (results.length === 0) {
      setMsg({ type: "warning", text: "No valid marks entered." });
      return;
    }

    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const { data } = await submitBulkMarks({
        exam:      parseInt(selected.exam),
        subject:   parseInt(selected.subject),
        classroom: parseInt(selected.classroom),
        results,
      });
      setMsg({
        type: "success",
        text: `Saved: ${data.created} new, ${data.updated} updated.${
          data.errors?.length ? ` ⚠ ${data.errors.length} error(s).` : ""
        }`,
      });
      setEditMode(false);
      fetchExistingResults(); // refresh existing map
    } catch (err) {
      setMsg({
        type: "danger",
        text: err.response?.data?.detail || "Failed to save marks. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // 8. Dropdown configs
  // ────────────────────────────────────────────────────────────────────────
  const selectConfigs = [
    {
      label: "Exam",
      key: "exam",
      options: exams.map((e) => ({ value: e.id, label: `${e.name} – ${e.term_display}` })),
    },
    {
      label: "Subject",
      key: "subject",
      options: subjects.map((s) => ({
        value: s.id,
        label: s.name,
        // flag unallocated subjects for teachers
        unallocated: !isAdmin && allocationsLoaded &&
          !myAllocations.some((a) => String(a.subject) === String(s.id)),
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

  // ────────────────────────────────────────────────────────────────────────
  // 9. Render
  // ────────────────────────────────────────────────────────────────────────
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
                  onChange={(e) => {
                    setSelected((s) => ({ ...s, [key]: e.target.value }));
                    setEditMode(false);
                  }}
                >
                  <option value="">— Select {label} —</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                      {o.unallocated ? " (not allocated)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Allocation warning banner */}
          {allocationsLoaded && !isAdmin && selected.subject && selected.classroom && isAllocated === false && (
            <div className="alert alert-warning d-flex align-items-center gap-2 mt-3 mb-0" role="alert">
              <i className="bi bi-shield-exclamation fs-5" />
              <span>
                You are <strong>not allocated</strong> to teach this subject in the selected
                classroom. You can view existing marks but cannot edit or submit.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Marks Table ── */}
      <div className="card">
        <div className="card-body">

          {/* Loading states */}
          {(studentsLoading || resultsLoading) && (
            <LoadingSpinner message={studentsLoading ? "Loading students…" : "Loading existing marks…"} />
          )}

          {/* No classroom selected */}
          {!studentsLoading && !resultsLoading && !selected.classroom && (
            <div className="text-center text-muted py-5">
              <i className="bi bi-pencil-square" style={{ fontSize: 36 }} />
              <p className="mt-2 mb-0">
                Select an exam, subject, and classroom above to begin.
              </p>
            </div>
          )}

          {/* Classroom selected but no students */}
          {!studentsLoading && !resultsLoading && selected.classroom && students.length === 0 && (
            <div className="empty-message text-center text-muted py-5">
              <i className="bi bi-people" style={{ fontSize: 36, display: "block", marginBottom: 8 }} />
              No students found in this classroom.
            </div>
          )}

          {/* ── Main table ── */}
          {!studentsLoading && !resultsLoading && students.length > 0 && (
            <form onSubmit={handleSubmit}>

              {/* Toolbar */}
              <div className="tbl-toolbar mb-3">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h5 className="card-title mb-0">
                    {students.length} Students
                  </h5>

                  {/* Status chips */}
                  {hasExisting && !editMode && (
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      <i className="bi bi-check-circle-fill me-1" />
                      {existingCount} marks saved
                    </span>
                  )}
                  {hasExisting && editMode && (
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                      <i className="bi bi-pencil-fill me-1" />
                      Editing {existingCount} existing marks
                    </span>
                  )}
                  {!hasExisting && selected.exam && selected.subject && (
                    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                      <i className="bi bi-plus-circle me-1" />
                      No marks yet
                    </span>
                  )}

                  {/* filled counter (edit mode only) */}
                  {editMode && isAllocated && (
                    <span
                      className="count-chip ms-1"
                      style={{
                        fontSize: 13,
                        background: filledCount === students.length ? "#e0f8e9" : "var(--primary-light)",
                        color: filledCount === students.length ? "#2eca6a" : "var(--primary-dark)",
                      }}
                    >
                      {filledCount} / {students.length} filled
                    </span>
                  )}
                </div>

                <div className="tbl-toolbar__right">
                  {/* Edit / Cancel toggle — only for allocated teachers or admins */}
                  {isAllocated && hasExisting && !editMode && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setEditMode(true)}
                    >
                      <i className="bi bi-pencil" /> Edit Marks
                    </button>
                  )}
                  {isAllocated && editMode && hasExisting && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setEditMode(false);
                        fetchExistingResults();
                      }}
                    >
                      <i className="bi bi-x-circle" /> Cancel Edit
                    </button>
                  )}

                  {/* Quick-fill — only in edit mode */}
                  {isAllocated && editMode && (
                    <>
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
                    </>
                  )}
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
                      <th style={{ width: 160 }}>Marks (0–100)</th>
                      <th style={{ width: 160 }}>Grade</th>
                      <th>Remarks</th>
                      {hasExisting && <th style={{ width: 90 }}>Status</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const marksVal  = marks[s.id]?.marks ?? "";
                      const remarkVal = marks[s.id]?.remarks ?? "";
                      const existing  = existingResults[String(s.id)];
                      const isInvalid =
                        marksVal !== "" &&
                        (isNaN(parseFloat(marksVal)) ||
                          parseFloat(marksVal) < 0 ||
                          parseFloat(marksVal) > 100);

                      // Grade display from existing result or derive locally
                      const gradeDisplay = existing?.grade
                        ? existing.grade
                        : marksVal !== "" && !isNaN(parseFloat(marksVal))
                        ? localGrade(parseFloat(marksVal))
                        : "—";

                      return (
                        <tr
                          key={s.id}
                          style={
                            existing && !editMode
                              ? { background: "rgba(46,202,106,0.04)" }
                              : undefined
                          }
                        >
                          {/* # */}
                          <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{i + 1}</td>

                          {/* Adm No */}
                          <td>
                            <code style={{ fontSize: 12 }}>{s.admission_number}</code>
                          </td>

                          {/* Name */}
                          <td>
                            <div className="student-cell">
                              <div className="student-avatar">
                                {s.full_name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="student-cell__name fw-600">{s.full_name}</span>
                            </div>
                          </td>

                          {/* Marks */}
                          <td>
                            {readOnly ? (
                              <span
                                className="fw-700"
                                style={{
                                  fontSize: 15,
                                  color: marksVal === "" ? "var(--text-muted)" : "inherit",
                                }}
                              >
                                {marksVal === "" ? "—" : marksVal}
                              </span>
                            ) : (
                              <>
                                <input
                                  type="number"
                                  className={`form-control form-control-sm ${isInvalid ? "is-invalid" : ""}`}
                                  min={0}
                                  max={100}
                                  step="any"
                                  value={marksVal}
                                  onChange={(e) => setMark(s.id, "marks", e.target.value)}
                                  placeholder="0 – 100"
                                />
                                {isInvalid && (
                                  <div className="invalid-feedback">0 – 100 only</div>
                                )}
                              </>
                            )}
                          </td>

                          {/* Grade */}
                          <td>
                            <span
                              className={`badge ${gradeColor(gradeDisplay)}`}
                              style={{ fontSize: 13, minWidth: 36 }}
                            >
                              {gradeDisplay}
                            </span>
                          </td>

                          {/* Remarks */}
                          <td>
                            {readOnly ? (
                              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                                {remarkVal || "—"}
                              </span>
                            ) : (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={remarkVal}
                                onChange={(e) => setMark(s.id, "remarks", e.target.value)}
                                placeholder="Auto-filled"
                              />
                            )}
                          </td>

                          {/* Status badge */}
                          {hasExisting && (
                            <td className="text-center">
                              {existing ? (
                                <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: 11 }}>
                                  Saved
                                </span>
                              ) : (
                                <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle" style={{ fontSize: 11 }}>
                                  New
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Submit — only when allocated + in edit mode */}
              {isAllocated && editMode && (
                <div className="d-flex gap-2 mt-3">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || filledCount === 0}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle me-1" />
                        {hasExisting ? "Update" : "Save"} {filledCount} Mark{filledCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                  {hasExisting && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setEditMode(false);
                        fetchExistingResults();
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}

            </form>
          )}
        </div>
      </div>
    </>
  );
}

// ─── local grade helper (mirrors KNEC scale) ─────────────────────────────────
// Used to show a grade preview before the server assigns the official one.

function localGrade(marks) {
  if (marks >= 80) return "A";
  if (marks >= 75) return "A-";
  if (marks >= 70) return "B+";
  if (marks >= 65) return "B";
  if (marks >= 60) return "B-";
  if (marks >= 55) return "C+";
  if (marks >= 50) return "C";
  if (marks >= 45) return "C-";
  if (marks >= 40) return "D+";
  if (marks >= 35) return "D";
  if (marks >= 30) return "D-";
  return "E";
}

function gradeColor(grade) {
  if (!grade || grade === "—") return "bg-secondary-subtle text-secondary";
  const g = String(grade).toUpperCase();
  if (g.startsWith("A"))  return "bg-success-subtle text-success";
  if (g.startsWith("B"))  return "bg-primary-subtle text-primary";
  if (g.startsWith("C"))  return "bg-warning-subtle text-warning";
  if (g.startsWith("D"))  return "bg-orange-subtle text-orange";
  return "bg-danger-subtle text-danger"; // E
}