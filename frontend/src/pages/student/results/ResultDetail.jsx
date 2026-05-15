import { useParams, Link } from "react-router-dom";
import { getStudentResults, getExam, downloadReportCard } from "../../../utils/api";
import { useAuth, useFetch } from "../../../hooks";
import { PageTitle, LoadingSpinner, AlertMessage, GradeBadge } from "../../../components/common";
import { GradeBarChart } from "../../../components/charts/Charts";
import { useState } from "react";

export default function ResultDetail() {
  const { examId } = useParams();
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [dlMsg, setDlMsg] = useState("");

  const { data: results, loading: rLoading } = useFetch(
    () => getStudentResults(user?.id, { exam: examId }),
    [examId, user?.id]
  );
  const { data: exam, loading: eLoading } = useFetch(() => getExam(examId), [examId]);

  const loading = rLoading || eLoading;

  const total = results?.reduce((s, r) => s + parseFloat(r.marks || 0), 0) || 0;
  const mean = results?.length ? (total / results.length).toFixed(1) : null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data } = await downloadReportCard(user.id, examId);
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_card_${examId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDlMsg("Failed to download report card.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageTitle
        title="Exam Detail"
        breadcrumbs={[{ label: "Results", to: "/student/results" }, { label: exam?.name || "Exam" }]}
      />

      {dlMsg && <AlertMessage type="danger" message={dlMsg} onClose={() => setDlMsg("")} />}

      <div className="card mb-3">
        <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 className="card-title mb-1">{exam?.name}</h5>
            <small className="text-muted">{exam?.term_display}</small>
          </div>
          <div className="d-flex gap-2">
            <Link to="/student/results" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left me-1" />Back
            </Link>
            <button className="btn btn-danger btn-sm" onClick={handleDownload} disabled={downloading}>
              {downloading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-file-pdf me-1" />}
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {!results?.length ? (
        <div className="card"><div className="card-body text-center py-5 text-muted">No results for this exam.</div></div>
      ) : (
        <div className="row">
          <div className="col-lg-7">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Subject Results</h5>
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle">
                    <thead className="table-light">
                      <tr><th>#</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Points</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={r.id}>
                          <td>{i + 1}</td>
                          <td className="fw-600">{r.subject_name}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="progress flex-grow-1" style={{ height: 6, maxWidth: 70 }}>
                                <div className="progress-bar bg-primary" style={{ width: `${r.marks}%` }} />
                              </div>
                              {r.marks}
                            </div>
                          </td>
                          <td><GradeBadge grade={r.grade} /></td>
                          <td>{r.points ?? "—"}</td>
                          <td style={{ fontSize: 12, color: "#899bbd" }}>{r.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-light fw-700">
                        <td colSpan={2}>Total / Mean</td>
                        <td>{total.toFixed(1)} / {mean}</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Performance Chart</h5>
                <GradeBarChart results={results} />
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Summary</h5>
                {[
                  { label: "Subjects Sat", value: results.length },
                  { label: "Total Marks", value: total.toFixed(1) },
                  { label: "Mean Score", value: mean },
                ].map((row) => (
                  <div key={row.label} className="d-flex justify-content-between mb-2 p-2 rounded" style={{ background: "#f6f9ff" }}>
                    <span className="text-muted">{row.label}</span>
                    <span className="fw-700" style={{ color: "#012970" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}