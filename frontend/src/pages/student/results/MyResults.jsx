import { useState } from "react";
import { getExams, getStudentResults, downloadReportCard } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { useAuth } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage, GradeBadge, EmptyState } from "../../../components/common";

export function MyResults() {
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState("");
  const { data: exams } = useFetch(() => getExams({ is_published: true }));
  const { data: results, loading } = useFetch(
    () =>
      selectedExam && user?.id
        ? getStudentResults(user.id, { exam: selectedExam })
        : Promise.resolve({ data: [] }),
    [selectedExam, user?.id]
  );

  const total = results?.reduce((s, r) => s + parseFloat(r.marks || 0), 0) || 0;
  const mean = results?.length ? (total / results.length).toFixed(1) : null;

  return (
    <>
      <PageTitle title="My Results" breadcrumbs={[{ label: "Results" }]} />

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Select an Exam</h5>
          <div className="row mb-4">
            <div className="col-md-5">
              <select
                className="form-select"
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
              >
                <option value="">— Choose an exam —</option>
                {exams?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} – {e.term_display}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && <LoadingSpinner />}

          {!loading && selectedExam && results?.length === 0 && (
            <EmptyState message="No results for this exam yet." icon="bi-journal-x" />
          )}

          {!loading && results?.length > 0 && (
            <>
              {/* Summary strip */}
              <div className="row mb-3">
                {[
                  { label: "Subjects", value: results.length, icon: "bi-book" },
                  { label: "Total Marks", value: total.toFixed(1), icon: "bi-calculator" },
                  { label: "Mean Score", value: mean, icon: "bi-bar-chart" },
                ].map((item) => (
                  <div key={item.label} className="col-md-4">
                    <div
                      className="d-flex align-items-center gap-3 p-3 rounded mb-2"
                      style={{ background: "#f6f9ff" }}
                    >
                      <i className={`bi ${item.icon} fs-4 text-primary`} />
                      <div>
                        <div className="fw-700 fs-5">{item.value}</div>
                        <small className="text-muted">{item.label}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Subject</th>
                      <th>Marks</th>
                      <th>Grade</th>
                      <th>Points</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={r.id}>
                        <td>{i + 1}</td>
                        <td className="fw-600">{r.subject_name}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="progress flex-grow-1"
                              style={{ height: 6, maxWidth: 80 }}
                            >
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: `${r.marks}%` }}
                              />
                            </div>
                            <span>{r.marks}</span>
                          </div>
                        </td>
                        <td>
                          <GradeBadge grade={r.grade} />
                        </td>
                        <td>{r.points ?? "—"}</td>
                        <td style={{ fontSize: 12, color: "#899bbd" }}>{r.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-light fw-700">
                      <td colSpan={2}>Total / Mean</td>
                      <td>{total.toFixed(1)}</td>
                      <td colSpan={3}>{mean} avg marks</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function ReportCard() {
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const { data: exams } = useFetch(() => getExams({ is_published: true }));

  const handleDownload = async () => {
    if (!selectedExam || !user?.id) return;
    setDownloading(true);
    setMsg({ type: "", text: "" });
    try {
      const { data } = await downloadReportCard(user.id, selectedExam);
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_card_${selectedExam}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMsg({ type: "danger", text: "Failed to download report card." });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <PageTitle title="Report Card" breadcrumbs={[{ label: "Results" }, { label: "Report Card" }]} />

      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="row justify-content-center">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body text-center">
              <i className="bi bi-file-earmark-pdf" style={{ fontSize: 56, color: "#dc3545" }} />
              <h5 className="card-title mt-3">Download Report Card</h5>
              <p className="text-muted">Select an exam to download your PDF report card.</p>

              <div className="mb-3 text-start">
                <label className="form-label fw-600">Select Exam</label>
                <select
                  className="form-select"
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                >
                  <option value="">— Choose an exam —</option>
                  {exams?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} – {e.term_display}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-danger w-100"
                onClick={handleDownload}
                disabled={!selectedExam || downloading}
              >
                {downloading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <i className="bi bi-download me-2" />
                    Download Report Card
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}