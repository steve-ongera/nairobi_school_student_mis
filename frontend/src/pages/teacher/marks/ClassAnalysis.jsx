import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getExams, getSubjects, getClassrooms, getExamResults } from "../../../utils/api";
import { PageTitle, AlertMessage, LoadingSpinner, GradeBadge, EmptyState } from "../../../components/common";
import { ClassPerformanceChart } from "../../../components/charts/Charts";
import { ExportCSV } from "../../../components/common/Extras";

// Helper: unwrap DRF paginated or plain array responses
const unwrap = (res) => res?.data?.results ?? res?.data ?? [];

export default function ClassAnalysis() {
  const [searchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selected, setSelected] = useState({
    exam: searchParams.get("exam") || "",
    classroom: searchParams.get("classroom") || "",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
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
      .catch(() =>
        setFetchError("Failed to load dropdown data. Please refresh the page.")
      );
  }, []);

  // Load results when exam + classroom are both selected
  useEffect(() => {
    if (!selected.exam || !selected.classroom) {
      setResults([]);
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    getExamResults(selected.exam, { classroom: selected.classroom })
      .then((r) => setResults(unwrap(r)))
      .catch(() => setMsg({ type: "danger", text: "Failed to load results." }))
      .finally(() => setLoading(false));
  }, [selected.exam, selected.classroom]);

  // ── Computed stats ────────────────────────────────────────────────────────
  const stats = results.length
    ? {
        highest: Math.max(...results.map((r) => parseFloat(r.marks))),
        lowest: Math.min(...results.map((r) => parseFloat(r.marks))),
        mean: (
          results.reduce((s, r) => s + parseFloat(r.marks), 0) / results.length
        ).toFixed(1),
        passRate: Math.round(
          (results.filter((r) => parseFloat(r.marks) >= 50).length /
            results.length) *
            100
        ),
      }
    : null;

  // ── Pivot: one row per student, subjects as columns ───────────────────────
  // Collect unique subjects (sorted alphabetically)
  const subjectNames = [...new Set(results.map((r) => r.subject_name))].sort();

  // Build a map: student_id → { student_name, admission_number, subjects: { [subject]: { marks, grade } } }
  const studentMap = results.reduce((acc, r) => {
    const key = r.admission_number;
    if (!acc[key]) {
      acc[key] = {
        student_name: r.student_name,
        admission_number: r.admission_number,
        subjects: {},
      };
    }
    acc[key].subjects[r.subject_name] = { marks: r.marks, grade: r.grade };
    return acc;
  }, {});

  const pivotRows = Object.values(studentMap).sort((a, b) =>
    a.student_name.localeCompare(b.student_name)
  );

  // Per-student total & mean
  const withTotals = pivotRows.map((row) => {
    const scores = subjectNames
      .map((s) => parseFloat(row.subjects[s]?.marks))
      .filter((v) => !isNaN(v));
    const total = scores.reduce((a, b) => a + b, 0);
    const mean = scores.length ? (total / scores.length).toFixed(1) : "—";
    return { ...row, total: scores.length ? total : "—", mean };
  });

  // Group results by subject for chart
  const subjectData = results.reduce((acc, r) => {
    if (!acc[r.subject_name]) {
      acc[r.subject_name] = { total: 0, count: 0, subject_name: r.subject_name };
    }
    acc[r.subject_name].total += parseFloat(r.marks);
    acc[r.subject_name].count++;
    return acc;
  }, {});

  const chartData = Object.values(subjectData).map((s) => ({
    subject_name: s.subject_name,
    mean_score: (s.total / s.count).toFixed(1),
  }));

  // Export: flatten pivot back to rows for CSV
  const exportData = withTotals.flatMap((row) =>
    subjectNames.map((sub) => ({
      student_name: row.student_name,
      admission_number: row.admission_number,
      subject_name: sub,
      marks: row.subjects[sub]?.marks ?? "—",
      grade: row.subjects[sub]?.grade ?? "—",
    }))
  );

  const exportColumns = [
    { key: "student_name", label: "Student" },
    { key: "admission_number", label: "Adm No" },
    { key: "subject_name", label: "Subject" },
    { key: "marks", label: "Marks" },
    { key: "grade", label: "Grade" },
  ];

  const statCards = [
    {
      label: "Highest Marks",
      value: stats?.highest,
      icon: "bi-arrow-up-circle",
      bg: "#e0f8e9",
      fg: "#2eca6a",
    },
    {
      label: "Lowest Marks",
      value: stats?.lowest,
      icon: "bi-arrow-down-circle",
      bg: "#fde8e8",
      fg: "#dc3545",
    },
    {
      label: "Class Mean",
      value: stats?.mean,
      icon: "bi-calculator",
      bg: "#f6f6fe",
      fg: "#4154f1",
    },
    {
      label: "Pass Rate",
      value: stats ? `${stats.passRate}%` : null,
      icon: "bi-check-circle",
      bg: stats?.passRate >= 50 ? "#e0f8e9" : "#fff3cd",
      fg: stats?.passRate >= 50 ? "#2eca6a" : "#ffc107",
    },
  ];

  return (
    <>
      <PageTitle
        title="Class Analysis"
        breadcrumbs={[{ label: "Marks" }, { label: "Analysis" }]}
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
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-600">Exam</label>
              <select
                className="form-select"
                value={selected.exam}
                onChange={(e) =>
                  setSelected((s) => ({ ...s, exam: e.target.value }))
                }
              >
                <option value="">— Select Exam —</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} – {e.term_display}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-600">Classroom</label>
              <select
                className="form-select"
                value={selected.classroom}
                onChange={(e) =>
                  setSelected((s) => ({ ...s, classroom: e.target.value }))
                }
              >
                <option value="">— Select Classroom —</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.stream_display} – {c.academic_year_display}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {/* ── Stats cards ── */}
      {!loading && stats && (
        <>
          <div className="row">
            {statCards.map((item) => (
              <div key={item.label} className="col-md-3">
                <div className="card info-card">
                  <div className="card-body">
                    <h5 className="card-title">{item.label}</h5>
                    <div className="d-flex align-items-center">
                      <div
                        className="card-icon rounded-circle d-flex align-items-center justify-content-center"
                        style={{ background: item.bg, color: item.fg }}
                      >
                        <i className={`bi ${item.icon}`} />
                      </div>
                      <div className="ps-3">
                        <h6>{item.value}</h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Chart ── */}
          {chartData.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Subject Mean Scores</h5>
                <ClassPerformanceChart results={chartData} />
              </div>
            </div>
          )}

          {/* ── Pivoted Results table ── */}
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">
                  Results
                  <span className="count-chip" style={{ marginLeft: 10, fontSize: 13 }}>
                    {pivotRows.length} students
                  </span>
                </h5>
                <ExportCSV
                  data={exportData}
                  columns={exportColumns}
                  filename="class_analysis.csv"
                />
              </div>

              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      {/* Fixed columns */}
                      <th style={{ whiteSpace: "nowrap" }}>Adm No</th>
                      <th style={{ whiteSpace: "nowrap" }}>Student</th>

                      {/* One column per subject — just the subject name, no repetition */}
                      {subjectNames.map((sub) => (
                        <th
                          key={sub}
                          style={{ whiteSpace: "nowrap", textAlign: "center" }}
                        >
                          {sub}
                        </th>
                      ))}

                      {/* Summary columns */}
                      <th style={{ textAlign: "center", whiteSpace: "nowrap" }}>Total</th>
                      <th style={{ textAlign: "center", whiteSpace: "nowrap" }}>Mean</th>
                      <th style={{ textAlign: "center", whiteSpace: "nowrap" }}>Pass?</th>
                    </tr>
                  </thead>

                  <tbody>
                    {withTotals.map((row) => {
                      const meanVal = parseFloat(row.mean);
                      const passed = !isNaN(meanVal) && meanVal >= 50;

                      return (
                        <tr key={row.admission_number}>
                          {/* Adm No */}
                          <td>
                            <code style={{ fontSize: 12 }}>{row.admission_number}</code>
                          </td>

                          {/* Student name — appears once per row */}
                          <td className="fw-600" style={{ whiteSpace: "nowrap" }}>
                            {row.student_name}
                          </td>

                          {/* Marks for each subject — just the number + grade badge */}
                          {subjectNames.map((sub) => {
                            const entry = row.subjects[sub];
                            return (
                              <td key={sub} style={{ textAlign: "center" }}>
                                {entry ? (
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                    <span style={{ fontWeight: 600 }}>{entry.marks}</span>
                                    <GradeBadge grade={entry.grade} />
                                  </div>
                                ) : (
                                  <span style={{ color: "var(--text-muted)" }}>—</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Total */}
                          <td style={{ textAlign: "center", fontWeight: 700 }}>
                            {row.total}
                          </td>

                          {/* Mean */}
                          <td style={{ textAlign: "center", fontWeight: 700, color: "var(--primary)" }}>
                            {row.mean}
                          </td>

                          {/* Pass / Fail based on mean */}
                          <td style={{ textAlign: "center" }}>
                            <span className={`badge bg-${passed ? "success" : "danger"}`}>
                              {passed ? "Pass" : "Fail"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* ── Subject column means as a footer ── */}
                  {withTotals.length > 1 && (
                    <tfoot>
                      <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                        <td colSpan={2} style={{ color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Subject Mean
                        </td>
                        {subjectNames.map((sub) => {
                          const scores = results
                            .filter((r) => r.subject_name === sub)
                            .map((r) => parseFloat(r.marks))
                            .filter((v) => !isNaN(v));
                          const avg = scores.length
                            ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
                            : "—";
                          return (
                            <td key={sub} style={{ textAlign: "center", color: "var(--primary)" }}>
                              {avg}
                            </td>
                          );
                        })}
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {!loading && selected.exam && selected.classroom && results.length === 0 && (
        <div className="card">
          <div className="card-body">
            <EmptyState message="No results found for this selection." />
          </div>
        </div>
      )}

      {/* ── Prompt when nothing selected ── */}
      {!loading && (!selected.exam || !selected.classroom) && (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            <i className="bi bi-bar-chart" style={{ fontSize: 36 }} />
            <p className="mt-2 mb-0">
              Select an exam and classroom above to view analysis.
            </p>
          </div>
        </div>
      )}
    </>
  );
}