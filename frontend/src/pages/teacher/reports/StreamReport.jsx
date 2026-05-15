import { useState } from "react";
import { getClassrooms, getExams, getStreamReport, downloadReportCard } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, AlertMessage, LoadingSpinner, GradeBadge, EmptyState } from "../../../components/common";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function StreamReport() {
  const { data: classrooms } = useFetch(() => getClassrooms());
  const { data: exams } = useFetch(() => getExams());
  const [selected, setSelected] = useState({ classroom: "", exam: "" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleLoad = async () => {
    if (!selected.classroom || !selected.exam) {
      setMsg({ type: "warning", text: "Select classroom and exam." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const { data } = await getStreamReport(selected.classroom, selected.exam);
      setReport(data);
    } catch {
      setMsg({ type: "danger", text: "Failed to load report." });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (studentId) => {
    try {
      const { data } = await downloadReportCard(studentId, selected.exam);
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_card_${studentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMsg({ type: "danger", text: "Failed to download report card." });
    }
  };

  const chartData = report?.students?.map((s) => ({
    name: s.student.full_name?.split(" ")[0],
    mean: parseFloat(s.summary?.mean_score) || 0,
  }));

  return (
    <>
      <PageTitle title="Stream Report" breadcrumbs={[{ label: "Reports" }, { label: "Stream" }]} />

      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Select Class & Exam</h5>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <select
                className="form-select"
                value={selected.classroom}
                onChange={(e) => setSelected((s) => ({ ...s, classroom: e.target.value }))}
              >
                <option value="">— Select Classroom —</option>
                {classrooms?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.stream_display} – {c.academic_year_display}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={selected.exam}
                onChange={(e) => setSelected((s) => ({ ...s, exam: e.target.value }))}
              >
                <option value="">— Select Exam —</option>
                {exams?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} – {e.term_display}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100" onClick={handleLoad} disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : "Load Report"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner message="Generating report…" />}

      {!loading && report && (
        <>
          {/* Chart */}
          {chartData?.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">
                  Mean Score Distribution – {report.classroom.stream_display}
                </h5>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ebeef4" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="mean" name="Mean Score" fill="#4154f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Rankings table */}
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">
                  {report.classroom.stream_display} – {report.exam.name}
                  <span className="badge bg-secondary ms-2">{report.students.length} students</span>
                </h5>
              </div>

              {!report.students.length ? (
                <EmptyState message="No results found." />
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Position</th>
                        <th>Adm No</th>
                        <th>Name</th>
                        <th>Total</th>
                        <th>Mean</th>
                        <th>Grade</th>
                        <th>Points</th>
                        <th>PDF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.students.map((s) => (
                        <tr key={s.student.id}>
                          <td>
                            <span
                              className={`badge ${
                                s.ranking?.stream_position === 1
                                  ? "bg-warning text-dark"
                                  : s.ranking?.stream_position <= 3
                                  ? "bg-secondary"
                                  : "bg-light text-dark"
                              }`}
                            >
                              #{s.ranking?.stream_position || "—"}
                            </span>
                          </td>
                          <td>
                            <code>{s.student.admission_number}</code>
                          </td>
                          <td className="fw-600">{s.student.full_name}</td>
                          <td>{s.summary?.total_marks ?? "—"}</td>
                          <td>{s.summary?.mean_score ?? "—"}</td>
                          <td>
                            <GradeBadge grade={s.summary?.mean_grade} />
                          </td>
                          <td>{s.summary?.mean_points ?? "—"}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDownload(s.student.id)}
                              title="Download PDF"
                            >
                              <i className="bi bi-file-pdf" />
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
      )}
    </>
  );
}