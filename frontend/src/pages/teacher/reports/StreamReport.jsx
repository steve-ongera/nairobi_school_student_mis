import { useState } from "react";
import { getClassrooms, getExams, getStreamReport, downloadReportCard } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, AlertMessage, LoadingSpinner, GradeBadge, EmptyState } from "../../../components/common";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function StreamReport() {
  // useFetch already unwraps paginated responses after our hook fix
  const { data: classrooms } = useFetch(() => getClassrooms());
  const { data: exams } = useFetch(() => getExams());

  const [selected, setSelected] = useState({ classroom: "", exam: "" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null); // student id being downloaded
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleLoad = async () => {
    if (!selected.classroom || !selected.exam) {
      setMsg({ type: "warning", text: "Please select both a classroom and an exam." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    setReport(null);
    try {
      const { data } = await getStreamReport(selected.classroom, selected.exam);
      setReport(data);
    } catch (err) {
      setMsg({
        type: "danger",
        text: err.response?.data?.detail || "Failed to load report.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (studentId, studentName) => {
    setDownloading(studentId);
    setMsg({ type: "", text: "" });
    try {
      const res = await downloadReportCard(studentId, selected.exam);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_card_${studentName?.replace(/\s+/g, "_") || studentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMsg({
        type: "danger",
        text: err.response?.status === 403
          ? "Results for this exam are not yet published."
          : "Failed to download report card.",
      });
    } finally {
      setDownloading(null);
    }
  };

  const chartData = report?.students?.map((s) => ({
    name: s.student.full_name?.split(" ")[0] || "—",
    mean: parseFloat(s.summary?.mean_score) || 0,
  }));

  return (
    <>
      <PageTitle
        title="Stream Report"
        breadcrumbs={[{ label: "Reports" }, { label: "Stream" }]}
      />

      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      {/* ── Selectors ── */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Select Class & Exam</h5>
          <div className="row g-3">
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
                {(classrooms ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.stream_display} – {c.academic_year_display}
                  </option>
                ))}
              </select>
            </div>

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
                {(exams ?? []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} – {e.term_display}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-primary w-100"
                onClick={handleLoad}
                disabled={loading || !selected.classroom || !selected.exam}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <>
                    <i className="bi bi-search me-1" /> Load Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner message="Generating report…" />}

      {!loading && report && (
        <>
          {/* ── Mean score chart ── */}
          {chartData?.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">
                  Mean Score Distribution –{" "}
                  {report.classroom?.stream_display}
                </h5>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ebeef4" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-30}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar
                      dataKey="mean"
                      name="Mean Score"
                      fill="#4154f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Rankings table ── */}
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">
                  {report.classroom?.stream_display} – {report.exam?.name}
                  <span className="badge bg-secondary ms-2">
                    {report.students?.length} students
                  </span>
                </h5>
              </div>

              {!report.students?.length ? (
                <EmptyState message="No results found for this selection." />
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
                      {report.students.map((s) => {
                        const pos = s.ranking?.stream_position;
                        return (
                          <tr key={s.student.id}>
                            <td>
                              <span
                                className={`badge ${
                                  pos === 1
                                    ? "bg-warning text-dark"
                                    : pos <= 3
                                    ? "bg-secondary"
                                    : "bg-light text-dark"
                                }`}
                              >
                                #{pos || "—"}
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
                                onClick={() =>
                                  handleDownload(
                                    s.student.id,
                                    s.student.full_name
                                  )
                                }
                                disabled={downloading === s.student.id}
                                title="Download PDF Report Card"
                              >
                                {downloading === s.student.id ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : (
                                  <i className="bi bi-file-pdf" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Prompt when nothing loaded yet ── */}
      {!loading && !report && (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            <i className="bi bi-file-earmark-bar-graph" style={{ fontSize: 36 }} />
            <p className="mt-2 mb-0">
              Select a classroom and exam, then click Load Report.
            </p>
          </div>
        </div>
      )}
    </>
  );
}