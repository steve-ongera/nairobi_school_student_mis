import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getExams, getSubjects, getClassrooms, getExamResults } from "../../../utils/api";
import { PageTitle, AlertMessage, LoadingSpinner, GradeBadge, EmptyState } from "../../../components/common";
import { ClassPerformanceChart } from "../../../components/charts/Charts";
import { ExportCSV } from "../../../components/common/Extras";

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
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    Promise.all([getExams(), getSubjects(), getClassrooms()]).then(([e, s, c]) => {
      setExams(e.data);
      setSubjects(s.data);
      setClassrooms(c.data);
    });
  }, []);

  useEffect(() => {
    if (!selected.exam || !selected.classroom) return;
    setLoading(true);
    getExamResults(selected.exam, { classroom: selected.classroom })
      .then((r) => setResults(r.data))
      .catch(() => setMsg({ type: "danger", text: "Failed to load results." }))
      .finally(() => setLoading(false));
  }, [selected.exam, selected.classroom]);

  const stats = results.length
    ? {
        highest: Math.max(...results.map((r) => parseFloat(r.marks))),
        lowest: Math.min(...results.map((r) => parseFloat(r.marks))),
        mean: (results.reduce((s, r) => s + parseFloat(r.marks), 0) / results.length).toFixed(1),
        passRate: Math.round((results.filter((r) => parseFloat(r.marks) >= 50).length / results.length) * 100),
      }
    : null;

  const subjectData = results.reduce((acc, r) => {
    if (!acc[r.subject_name]) acc[r.subject_name] = { total: 0, count: 0, subject_name: r.subject_name };
    acc[r.subject_name].total += parseFloat(r.marks);
    acc[r.subject_name].count++;
    return acc;
  }, {});
  const chartData = Object.values(subjectData).map((s) => ({
    subject_name: s.subject_name,
    mean_score: (s.total / s.count).toFixed(1),
  }));

  const exportColumns = [
    { key: "student_name", label: "Student" },
    { key: "admission_number", label: "Adm No" },
    { key: "subject_name", label: "Subject" },
    { key: "marks", label: "Marks" },
    { key: "grade", label: "Grade" },
  ];

  return (
    <>
      <PageTitle title="Class Analysis" breadcrumbs={[{ label: "Marks" }, { label: "Analysis" }]} />
      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="card">
        <div className="card-body">
          <div className="row g-3 mb-0">
            <div className="col-md-4">
              <label className="form-label fw-600">Exam</label>
              <select className="form-select" value={selected.exam}
                onChange={(e) => setSelected((s) => ({ ...s, exam: e.target.value }))}>
                <option value="">— Select Exam —</option>
                {exams.map((e) => <option key={e.id} value={e.id}>{e.name} – {e.term_display}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-600">Classroom</label>
              <select className="form-select" value={selected.classroom}
                onChange={(e) => setSelected((s) => ({ ...s, classroom: e.target.value }))}>
                <option value="">— Select Classroom —</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.stream_display} – {c.academic_year_display}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && stats && (
        <>
          <div className="row">
            {[
              { label: "Highest Marks", value: stats.highest, icon: "bi-arrow-up-circle", color: "success" },
              { label: "Lowest Marks", value: stats.lowest, icon: "bi-arrow-down-circle", color: "danger" },
              { label: "Class Mean", value: stats.mean, icon: "bi-calculator", color: "primary" },
              { label: "Pass Rate", value: `${stats.passRate}%`, icon: "bi-check-circle", color: stats.passRate >= 50 ? "success" : "warning" },
            ].map((item) => (
              <div key={item.label} className="col-md-3">
                <div className="card info-card">
                  <div className="card-body">
                    <h5 className="card-title">{item.label}</h5>
                    <div className="d-flex align-items-center">
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center"
                        style={{ background: item.color === "success" ? "#e0f8e9" : item.color === "danger" ? "#fde8e8" : "#f6f6fe",
                          color: item.color === "success" ? "#2eca6a" : item.color === "danger" ? "#dc3545" : "#4154f1" }}>
                        <i className={`bi ${item.icon}`} />
                      </div>
                      <div className="ps-3"><h6>{item.value}</h6></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Subject Mean Scores</h5>
                <ClassPerformanceChart results={chartData} />
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Results ({results.length})</h5>
                <ExportCSV data={results} columns={exportColumns} filename="class_analysis.csv" />
              </div>
              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle">
                  <thead className="table-light">
                    <tr><th>Student</th><th>Adm No</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Pass?</th></tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.id}>
                        <td className="fw-600">{r.student_name}</td>
                        <td><code style={{ fontSize: 12 }}>{r.admission_number}</code></td>
                        <td>{r.subject_name}</td>
                        <td>{r.marks}</td>
                        <td><GradeBadge grade={r.grade} /></td>
                        <td>
                          <span className={`badge bg-${parseFloat(r.marks) >= 50 ? "success" : "danger"}`}>
                            {parseFloat(r.marks) >= 50 ? "Pass" : "Fail"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && selected.exam && selected.classroom && !results.length && (
        <div className="card"><div className="card-body"><EmptyState message="No results found for this selection." /></div></div>
      )}
    </>
  );
}