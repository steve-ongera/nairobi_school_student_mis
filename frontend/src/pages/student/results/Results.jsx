// frontend/src/pages/student/results/Results.jsx
import { useState, useEffect } from "react";
import { useAuth, useFetch } from "../../../hooks";
import {
  getMyStudentProfile,
  getStudentResults,
  getExams,
  downloadReportCard,
} from "../../../utils/api";
import {
  PageTitle,
  LoadingSpinner,
  AlertMessage,
  GradeBadge,
} from "../../../components/common";

// ── Helper: group ExamResult rows by exam ─────────────────────────────────────
function groupResultsByExam(results = []) {
  const map = {};
  for (const r of results) {
    const examId = r.exam;
    if (!map[examId]) {
      map[examId] = {
        exam_id: r.exam,
        exam_name: r.exam_name,
        results: [],
        total: 0,
        count: 0,
      };
    }
    map[examId].results.push(r);
    map[examId].total += parseFloat(r.marks || 0);
    map[examId].count += 1;
  }
  // Compute mean per exam
  return Object.values(map).map((g) => ({
    ...g,
    mean: g.count > 0 ? (g.total / g.count).toFixed(1) : "—",
  }));
}

// =============================================================================
// MyResults
// =============================================================================
export const MyResults = () => {
  const [studentId, setStudentId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);

  // Step 1: get student profile to obtain the real student PK
  useEffect(() => {
    getMyStudentProfile()
      .then((res) => {
        setStudentId(res.data.id);
      })
      .catch(() => setProfileError("Could not load your student profile."))
      .finally(() => setProfileLoading(false));
  }, []);

  // Step 2: fetch all results for this student (no exam filter = all results)
  const {
    data: results,
    loading: resultsLoading,
    error: resultsError,
  } = useFetch(
    () => (studentId ? getStudentResults(studentId) : Promise.resolve({ data: [] })),
    [studentId]
  );

  const examGroups = groupResultsByExam(results ?? []);

  if (profileLoading || resultsLoading) return <LoadingSpinner />;
  if (profileError) return <AlertMessage type="danger" message={profileError} />;
  if (resultsError) return <AlertMessage type="danger" message={resultsError} />;

  return (
    <>
      <PageTitle title="My Results" breadcrumbs={[{ label: "Results" }]} />

      {examGroups.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            <i className="bi bi-journal-x fs-1 d-block mb-2" />
            No exam results available yet.
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {examGroups.map((group) => (
            <div key={group.exam_id} className="col-md-6 col-lg-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title fw-700">{group.exam_name}</h5>
                  <p className="text-muted mb-3">
                    {group.count} subject{group.count !== 1 ? "s" : ""}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <small className="text-muted d-block">Mean Score</small>
                      <span className="fw-700 fs-5">{group.mean}</span>
                    </div>
                    <div>
                      <small className="text-muted d-block">Total Marks</small>
                      <span className="fw-700 fs-5">{group.total.toFixed(0)}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-outline-primary btn-sm w-100"
                    onClick={() =>
                      setSelectedExam(
                        selectedExam?.exam_id === group.exam_id ? null : group
                      )
                    }
                  >
                    {selectedExam?.exam_id === group.exam_id
                      ? "Hide Details"
                      : "View Details"}
                  </button>
                </div>

                {/* Inline subject breakdown */}
                {selectedExam?.exam_id === group.exam_id && (
                  <div className="card-footer p-0">
                    <table className="table table-sm table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Subject</th>
                          <th className="text-center">Marks</th>
                          <th className="text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.results.map((r) => (
                          <tr key={r.id}>
                            <td>{r.subject_name}</td>
                            <td className="text-center">{r.marks}</td>
                            <td className="text-center">
                              <GradeBadge grade={r.grade} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// =============================================================================
// ReportCard  – PDF download via backend ReportLab endpoint
// =============================================================================
export const ReportCard = () => {
  const [studentId, setStudentId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState("");

  // Step 1: get real student PK
  useEffect(() => {
    getMyStudentProfile()
      .then((res) => setStudentId(res.data.id))
      .catch(() => setProfileError("Could not load your student profile."))
      .finally(() => setProfileLoading(false));
  }, []);

  // Step 2: fetch published exams so student can pick one
  const { data: exams, loading: examsLoading } = useFetch(
    () => getExams({ is_published: true }),
    []
  );

  const handleDownload = async () => {
    if (!selectedExamId) return;
    setDownloading(true);
    setDownloadError("");
    setDownloadSuccess("");
    try {
      const res = await downloadReportCard(studentId, selectedExamId);
      // res.data is a Blob (responseType: "blob" set in api.js)
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      const examName =
        exams?.find((e) => String(e.id) === String(selectedExamId))?.name ||
        "report";
      link.setAttribute(
        "download",
        `report_card_${examName.replace(/\s+/g, "_")}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDownloadSuccess("Report card downloaded successfully.");
    } catch (err) {
      const msg =
        err.response?.status === 403
          ? "Results for this exam have not been published yet."
          : err.response?.data?.detail || "Failed to download report card.";
      setDownloadError(msg);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => window.print();

  if (profileLoading) return <LoadingSpinner />;
  if (profileError) return <AlertMessage type="danger" message={profileError} />;

  return (
    <>
      <PageTitle
        title="Report Card"
        breadcrumbs={[{ label: "Results", to: "/student/results" }, { label: "Report Card" }]}
      />

      {downloadError && (
        <AlertMessage
          type="danger"
          message={downloadError}
          onClose={() => setDownloadError("")}
        />
      )}
      {downloadSuccess && (
        <AlertMessage
          type="success"
          message={downloadSuccess}
          onClose={() => setDownloadSuccess("")}
        />
      )}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Download Your Report Card</h5>
          <p className="text-muted">
            Select an exam below and download your official PDF report card.
          </p>

          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <label className="form-label fw-600">Select Exam</label>
              {examsLoading ? (
                <div className="text-muted">Loading exams…</div>
              ) : (
                <select
                  className="form-select"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                >
                  <option value="">— Choose an exam —</option>
                  {(exams ?? []).map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name} — {exam.term_display}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="col-md-6 d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={!selectedExamId || downloading || !studentId}
              >
                {downloading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf me-2" />
                    Download PDF
                  </>
                )}
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={handlePrint}
                disabled={!selectedExamId}
              >
                <i className="bi bi-printer me-1" /> Print
              </button>
            </div>
          </div>

          {(exams ?? []).length === 0 && !examsLoading && (
            <div className="alert alert-info mt-3 mb-0">
              <i className="bi bi-info-circle me-2" />
              No published exams found. Report cards are available once your
              teacher publishes the results.
            </div>
          )}
        </div>
      </div>
    </>
  );
};