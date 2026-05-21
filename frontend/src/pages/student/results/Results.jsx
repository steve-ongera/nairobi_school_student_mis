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
      <style>{`
        /* Results Card Styles */
        .results-card {
          transition: all var(--transition-base);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          height: 100%;
        }
        
        .results-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        
        .results-card-header {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border-bottom: 1px solid var(--border);
          padding: 20px 20px 16px;
        }
        
        .results-card-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        
        .results-card-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .results-stats {
          display: flex;
          justify-content: space-between;
          padding: 16px 20px;
          background: #fafbfc;
          border-bottom: 1px solid var(--border);
        }
        
        .results-stat {
          text-align: center;
          flex: 1;
        }
        
        .results-stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        
        .results-stat-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .results-stat-value.small {
          font-size: 18px;
        }
        
        .results-table-wrapper {
          padding: 0;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .results-table-wrapper table {
          margin-bottom: 0;
        }
        
        .results-table-wrapper thead th {
          position: sticky;
          top: 0;
          background: white;
          z-index: 1;
        }
        
        /* Empty state */
        .empty-results {
          text-align: center;
          padding: 60px 20px;
          background: var(--bg-card);
          border-radius: 20px;
          border: 1px solid var(--border);
        }
        
        .empty-results i {
          font-size: 64px;
          color: var(--text-muted);
          opacity: 0.3;
          margin-bottom: 16px;
        }
        
        .empty-results p {
          color: var(--text-muted);
          margin: 0;
        }
        
        /* Print styles */
        @media print {
          .btn,
          .back-to-top,
          .header,
          .sidebar,
          .footer {
            display: none !important;
          }
          
          #main {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .results-card {
            break-inside: avoid;
            box-shadow: none;
            border: 1px solid #ddd;
          }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .results-card-title {
            font-size: 16px;
          }
          
          .results-stat-value {
            font-size: 18px;
          }
          
          .results-stat-value.small {
            font-size: 16px;
          }
          
          .results-table-wrapper {
            max-height: 250px;
          }
        }
        
        @media (max-width: 576px) {
          .results-card-header {
            padding: 16px;
          }
          
          .results-stats {
            padding: 12px 16px;
            flex-direction: column;
            gap: 12px;
          }
          
          .results-stat {
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .results-stat-label {
            margin-bottom: 0;
          }
          
          .results-table-wrapper td,
          .results-table-wrapper th {
            padding: 8px 12px;
            font-size: 12px;
          }
        }
      `}</style>

      <PageTitle title="My Results" breadcrumbs={[{ label: "Results" }]} />

      {examGroups.length === 0 ? (
        <div className="empty-results">
          <i className="bi bi-journal-x" />
          <p>No exam results available yet.</p>
          <small className="text-muted">Results will appear here once published by your teachers.</small>
        </div>
      ) : (
        <div className="row g-4">
          {examGroups.map((group) => (
            <div key={group.exam_id} className="col-md-6 col-lg-4">
              <div className="results-card">
                <div className="results-card-header">
                  <h5 className="results-card-title">{group.exam_name}</h5>
                  <div className="results-card-subtitle">
                    {group.count} subject{group.count !== 1 ? "s" : ""}
                  </div>
                </div>
                
                <div className="results-stats">
                  <div className="results-stat">
                    <div className="results-stat-label">Mean Score</div>
                    <div className="results-stat-value">{group.mean}</div>
                  </div>
                  <div className="results-stat">
                    <div className="results-stat-label">Total Marks</div>
                    <div className="results-stat-value small">{group.total.toFixed(0)}</div>
                  </div>
                  <div className="results-stat">
                    <div className="results-stat-label">Best Grade</div>
                    <div className="results-stat-value small">
                      {group.results.reduce((best, r) => {
                        const gradeOrder = { 'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8, 'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1 };
                        const currentBest = gradeOrder[best] || 0;
                        const current = gradeOrder[r.grade] || 0;
                        return current > currentBest ? r.grade : best;
                      }, 'E')}
                    </div>
                  </div>
                </div>
                
                <button
                  className="btn btn-outline-primary w-100 rounded-0"
                  style={{ borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                  onClick={() =>
                    setSelectedExam(
                      selectedExam?.exam_id === group.exam_id ? null : group
                    )
                  }
                >
                  <i className={`bi ${selectedExam?.exam_id === group.exam_id ? 'bi-chevron-up' : 'bi-chevron-down'} me-2`} />
                  {selectedExam?.exam_id === group.exam_id ? "Hide Details" : "View Details"}
                </button>

                {/* Inline subject breakdown */}
                {selectedExam?.exam_id === group.exam_id && (
                  <div className="results-table-wrapper">
                    <table className="table table-sm table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ padding: '12px 16px' }}>Subject</th>
                          <th style={{ padding: '12px 16px', width: '80px', textAlign: 'center' }}>Marks</th>
                          <th style={{ padding: '12px 16px', width: '80px', textAlign: 'center' }}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.results.map((r) => (
                          <tr key={r.id}>
                            <td style={{ padding: '10px 16px', fontWeight: 500 }}>{r.subject_name}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>{r.marks}%</td>
                            <td style={{ padding: '10px 16px', textAlign: 'center' }}>
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
      setTimeout(() => setDownloadSuccess(""), 3000);
    } catch (err) {
      const msg =
        err.response?.status === 403
          ? "Results for this exam have not been published yet."
          : err.response?.data?.detail || "Failed to download report card.";
      setDownloadError(msg);
      setTimeout(() => setDownloadError(""), 3000);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => window.print();

  if (profileLoading) return <LoadingSpinner />;
  if (profileError) return <AlertMessage type="danger" message={profileError} />;

  return (
    <>
      <style>{`
        /* Report Card Styles */
        .report-card-wrapper {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .report-card-preview {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        
        .report-card-preview::before {
          content: '';
          position: absolute;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 1%, transparent 1%);
          background-size: 50px 50px;
          animation: shimmer 20s linear infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .report-card-preview-icon {
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          position: relative;
          z-index: 1;
        }
        
        .report-card-preview-icon i {
          font-size: 40px;
          color: white;
        }
        
        .report-card-preview-title {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        
        .report-card-preview-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.9);
          position: relative;
          z-index: 1;
        }
        
        .report-card-form {
          background: var(--bg-card);
          border-radius: 20px;
          border: 1px solid var(--border);
          overflow: hidden;
        }
        
        .report-card-form-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          background: #fafbfc;
        }
        
        .report-card-form-header h5 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        
        .report-card-form-header p {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }
        
        .report-card-form-body {
          padding: 24px;
        }
        
        .exam-info-card {
          background: var(--primary-light);
          border-radius: 12px;
          padding: 16px;
          margin-top: 16px;
        }
        
        .exam-info-card h6 {
          font-size: 13px;
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 8px;
        }
        
        .exam-info-card p {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .report-card-preview {
            padding: 30px 20px;
          }
          
          .report-card-preview-icon {
            width: 60px;
            height: 60px;
          }
          
          .report-card-preview-icon i {
            font-size: 30px;
          }
          
          .report-card-preview-title {
            font-size: 20px;
          }
          
          .report-card-preview-subtitle {
            font-size: 12px;
          }
          
          .report-card-form-header {
            padding: 16px 20px;
          }
          
          .report-card-form-body {
            padding: 20px;
          }
        }
        
        @media (max-width: 576px) {
          .report-card-preview {
            padding: 24px 16px;
          }
          
          .report-card-preview-icon {
            width: 50px;
            height: 50px;
            margin-bottom: 16px;
          }
          
          .report-card-preview-icon i {
            font-size: 24px;
          }
          
          .report-card-preview-title {
            font-size: 18px;
          }
          
          .report-card-form-header {
            padding: 14px 16px;
          }
          
          .report-card-form-body {
            padding: 16px;
          }
          
          .report-card-form-body .d-flex {
            flex-direction: column;
          }
          
          .report-card-form-body .btn {
            width: 100%;
          }
        }
        
        /* Print styles */
        @media print {
          .report-card-preview,
          .btn,
          .back-to-top,
          .header,
          .sidebar,
          .footer {
            display: none !important;
          }
          
          .report-card-form {
            box-shadow: none;
            border: 1px solid #ddd;
          }
        }
      `}</style>

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

      <div className="report-card-wrapper">
        {/* Preview Banner */}
        <div className="report-card-preview">
          <div className="report-card-preview-icon">
            <i className="bi bi-file-earmark-pdf-fill" />
          </div>
          <h2 className="report-card-preview-title">Official Report Card</h2>
          <p className="report-card-preview-subtitle">
            Download your official examination results
          </p>
        </div>

        {/* Form Card */}
        <div className="report-card-form">
          <div className="report-card-form-header">
            <h5>
              <i className="bi bi-download me-2"></i>
              Download Your Report Card
            </h5>
            <p>Select an exam below to download your official PDF report card</p>
          </div>
          
          <div className="report-card-form-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-7">
                <label className="form-label fw-600">
                  <i className="bi bi-journal-bookmark-fill me-1"></i>
                  Select Exam
                </label>
                {examsLoading ? (
                  <div className="text-muted py-2">
                    <span className="spinner-border spinner-border-sm me-2" />
                    Loading exams…
                  </div>
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

              <div className="col-md-5">
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary flex-grow-1"
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
                    <i className="bi bi-printer" />
                  </button>
                </div>
              </div>
            </div>

            {(exams ?? []).length === 0 && !examsLoading && (
              <div className="alert alert-info mt-4 mb-0">
                <i className="bi bi-info-circle me-2" />
                No published exams found. Report cards are available once your teacher publishes the results.
              </div>
            )}
            
            {selectedExamId && !examsLoading && (
              <div className="exam-info-card">
                <h6>
                  <i className="bi bi-info-circle-fill me-1"></i>
                  Selected Exam Details
                </h6>
                <p>
                  <strong>{exams?.find(e => String(e.id) === String(selectedExamId))?.name}</strong><br />
                  {exams?.find(e => String(e.id) === String(selectedExamId))?.term_display}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};