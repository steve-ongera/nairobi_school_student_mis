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

// ── Helper: group ExamResult rows by exam ────────────────────────────────────
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
  return Object.values(map).map((g) => ({
    ...g,
    mean: g.count > 0 ? (g.total / g.count).toFixed(1) : "—",
  }));
}

const GRADE_ORDER = {
  A: 12, "A-": 11, "B+": 10, B: 9, "B-": 8,
  "C+": 7, C: 6, "C-": 5, "D+": 4, D: 3, "D-": 2, E: 1,
};

function bestGrade(results) {
  return results.reduce((best, r) => {
    return (GRADE_ORDER[r.grade] || 0) > (GRADE_ORDER[best] || 0)
      ? r.grade
      : best;
  }, "E");
}

// =============================================================================
// MyResults
// =============================================================================
export const MyResults = () => {
  const [studentId, setStudentId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [expandedExam, setExpandedExam] = useState(null);

  useEffect(() => {
    getMyStudentProfile()
      .then((res) => setStudentId(res.data.id))
      .catch(() => setProfileError("Could not load your student profile."))
      .finally(() => setProfileLoading(false));
  }, []);

  const {
    data: results,
    loading: resultsLoading,
    error: resultsError,
  } = useFetch(
    () =>
      studentId
        ? getStudentResults(studentId)
        : Promise.resolve({ data: [] }),
    [studentId]
  );

  const examGroups = groupResultsByExam(results ?? []);

  if (profileLoading || resultsLoading) return <LoadingSpinner />;
  if (profileError)
    return <AlertMessage type="danger" message={profileError} />;
  if (resultsError)
    return <AlertMessage type="danger" message={resultsError} />;

  return (
    <>
      <style>{`
        /* ── Exam result cards grid ── */
        .exam-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--space-5);
          animation: fadeInUp var(--duration-300) var(--ease-out);
        }

        /* ── Per-exam card — uses .card base from main.css ── */
        .exam-card {
          display: flex;
          flex-direction: column;
          margin-bottom: 0;          /* grid handles spacing */
          transition: box-shadow var(--transition-base), transform var(--transition-base);
        }

        .exam-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        /* card-header accent bar */
        .exam-card__header {
          padding: var(--space-5) var(--space-6);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-sunken);
          position: relative;
        }

        .exam-card__header::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--brand-500), var(--teal-500));
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        }

        .exam-card__title {
          font-size: var(--text-md);
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: var(--tracking-snug);
          margin: 0 0 var(--space-1);
        }

        .exam-card__sub {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
        }

        /* ── KPI strip inside each exam card ── */
        .exam-kpi-strip {
          display: flex;
          border-bottom: 1px solid var(--color-border);
        }

        .exam-kpi {
          flex: 1;
          text-align: center;
          padding: var(--space-4) var(--space-3);
          position: relative;
        }

        .exam-kpi + .exam-kpi::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 1px;
          background: var(--color-border);
        }

        .exam-kpi__label {
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
          color: var(--color-text-muted);
          margin-bottom: var(--space-1);
          display: block;
        }

        .exam-kpi__val {
          font-size: var(--text-2xl);
          font-weight: 800;
          color: var(--color-text);
          font-family: var(--font-mono);
          letter-spacing: var(--tracking-tight);
          line-height: 1;
        }

        /* ── Expand toggle button ── */
        .exam-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          width: 100%;
          padding: var(--space-3) var(--space-4);
          border: none;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface-sunken);
          font-size: var(--text-sm);
          font-weight: 600;
          font-family: var(--font-sans);
          color: var(--brand-600);
          cursor: pointer;
          transition: background var(--transition-fast), color var(--transition-fast);
          margin-top: auto;
        }

        .exam-toggle:hover {
          background: var(--brand-50);
        }

        .exam-toggle i { font-size: 13px; }

        /* ── Inline subject breakdown (data-table style) ── */
        .subject-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--text-sm);
          font-family: var(--font-sans);
          animation: fadeInUp var(--duration-200) var(--ease-out);
        }

        .subject-table thead th {
          padding: 9px var(--space-4);
          text-align: left;
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
          background: var(--slate-50);
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }

        .subject-table thead th:not(:first-child) { text-align: center; }

        .subject-table tbody td {
          padding: 10px var(--space-4);
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          vertical-align: middle;
        }

        .subject-table tbody td:not(:first-child) { text-align: center; }

        .subject-table tbody tr:last-child td { border-bottom: none; }
        .subject-table tbody tr { transition: background var(--duration-75); }
        .subject-table tbody tr:hover { background: var(--slate-50); }

        .cell-subject-name {
          font-weight: 600;
          color: var(--color-text);
        }

        .cell-marks {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 600;
          color: var(--brand-600);
        }

        /* ── Empty state — matches main.css .empty-state ── */
        .results-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--space-12) var(--space-8);
        }

        .results-empty__icon {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-lg);
          background: var(--slate-100);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: var(--color-text-muted);
          margin-bottom: var(--space-5);
        }

        .results-empty__title {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: var(--space-2);
        }

        .results-empty__desc {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          max-width: 360px;
          line-height: var(--leading-relaxed);
        }

        /* ── Scrollable subject list inside card ── */
        .subject-scroll {
          max-height: 320px;
          overflow-y: auto;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .exam-grid { grid-template-columns: 1fr; }
          .exam-kpi__val { font-size: var(--text-xl); }
        }

        @media print {
          .exam-card { break-inside: avoid; box-shadow: none; }
          .exam-toggle { display: none; }
          .subject-scroll { max-height: none; overflow: visible; }
        }
      `}</style>

      <PageTitle title="My Results" breadcrumbs={[{ label: "Results" }]} />

      {examGroups.length === 0 ? (
        <div className="card">
          <div className="card-body results-empty">
            <div className="results-empty__icon">
              <i className="bi bi-journal-x" />
            </div>
            <h4 className="results-empty__title">No Results Yet</h4>
            <p className="results-empty__desc">
              Results will appear here once they are published by your teachers.
            </p>
          </div>
        </div>
      ) : (
        <div className="exam-grid">
          {examGroups.map((group) => (
            <div key={group.exam_id} className="card exam-card">
              {/* Header */}
              <div className="exam-card__header">
                <h5 className="exam-card__title">{group.exam_name}</h5>
                <span className="exam-card__sub">
                  {group.count} subject{group.count !== 1 ? "s" : ""}
                </span>
              </div>

              {/* KPI strip */}
              <div className="exam-kpi-strip">
                <div className="exam-kpi">
                  <span className="exam-kpi__label">Mean Score</span>
                  <span className="exam-kpi__val">{group.mean}</span>
                </div>
                <div className="exam-kpi">
                  <span className="exam-kpi__label">Total</span>
                  <span className="exam-kpi__val">
                    {group.total.toFixed(0)}
                  </span>
                </div>
                <div className="exam-kpi">
                  <span className="exam-kpi__label">Best Grade</span>
                  <span className="exam-kpi__val">
                    {bestGrade(group.results)}
                  </span>
                </div>
              </div>

              {/* Subject breakdown (collapsible) */}
              {expandedExam === group.exam_id && (
                <div className="subject-scroll">
                  <table className="subject-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Marks</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.results.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <span className="cell-subject-name">
                              {r.subject_name}
                            </span>
                          </td>
                          <td>
                            <span className="cell-marks">{r.marks}%</span>
                          </td>
                          <td>
                            <GradeBadge grade={r.grade} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Toggle */}
              <button
                className="exam-toggle"
                onClick={() =>
                  setExpandedExam(
                    expandedExam === group.exam_id ? null : group.exam_id
                  )
                }
              >
                <i
                  className={`bi ${
                    expandedExam === group.exam_id
                      ? "bi-chevron-up"
                      : "bi-chevron-down"
                  }`}
                />
                {expandedExam === group.exam_id
                  ? "Hide Details"
                  : "View Details"}
              </button>
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

  useEffect(() => {
    getMyStudentProfile()
      .then((res) => setStudentId(res.data.id))
      .catch(() => setProfileError("Could not load your student profile."))
      .finally(() => setProfileLoading(false));
  }, []);

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

  if (profileLoading) return <LoadingSpinner />;
  if (profileError)
    return <AlertMessage type="danger" message={profileError} />;

  const selectedExam = exams?.find(
    (e) => String(e.id) === String(selectedExamId)
  );

  return (
    <>
      <style>{`
        /* ── Report card layout ── */
        .rc-wrapper {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        /* ── Hero banner — mirrors .profile-hero__banner treatment ── */
        .rc-hero {
          background: linear-gradient(
            135deg,
            var(--brand-700) 0%,
            var(--brand-500) 55%,
            var(--teal-500) 100%
          );
          border-radius: var(--radius-lg);
          padding: var(--space-8) var(--space-7);
          display: flex;
          align-items: center;
          gap: var(--space-5);
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-brand);
        }

        .rc-hero::before,
        .rc-hero::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          background: rgba(255,255,255,0.06);
        }
        .rc-hero::before { width: 260px; height: 260px; top: -120px; right: -60px; }
        .rc-hero::after  { width: 100px; height: 100px; bottom: -40px; right: 160px; }

        .rc-hero__icon {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.18);
          border: 2px solid rgba(255,255,255,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #fff;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .rc-hero__body { position: relative; z-index: 1; }

        .rc-hero__title {
          font-size: var(--text-2xl);
          font-weight: 800;
          color: #fff;
          letter-spacing: var(--tracking-tight);
          margin: 0 0 var(--space-1);
        }

        .rc-hero__sub {
          font-size: var(--text-sm);
          color: rgba(255,255,255,0.75);
          margin: 0;
        }

        /* ── Download card ── */
        .rc-card { margin-bottom: 0; }

        /* ── Exam info row — reuses .info-row from main.css ── */
        .rc-exam-info {
          margin-top: var(--space-4);
          padding: var(--space-4) var(--space-5);
          border-radius: var(--radius);
          background: var(--brand-50);
          border: 1px solid var(--brand-100);
          display: flex;
          align-items: center;
          gap: var(--space-3);
          animation: fadeInUp var(--duration-200) var(--ease-out);
        }

        .rc-exam-info i {
          color: var(--brand-500);
          font-size: 16px;
          flex-shrink: 0;
        }

        .rc-exam-info__name {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--brand-700);
        }

        .rc-exam-info__term {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          margin-top: 1px;
        }

        /* ── Action row ── */
        .rc-actions {
          display: flex;
          gap: var(--space-3);
          align-items: flex-end;
        }

        .rc-actions .form-group { flex: 1; margin-bottom: 0; }

        @media (max-width: 640px) {
          .rc-hero { flex-direction: column; text-align: center; padding: var(--space-6); }
          .rc-hero__icon { margin: 0 auto; }
          .rc-actions { flex-direction: column; }
          .rc-actions .btn { width: 100%; }
        }

        @media print {
          .rc-hero, .btn, .header, .sidebar, .footer { display: none !important; }
          #main { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      <PageTitle
        title="Report Card"
        breadcrumbs={[
          { label: "Results", to: "/student/results" },
          { label: "Report Card" },
        ]}
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

      <div className="rc-wrapper">
        {/* Hero */}
        <div className="rc-hero">
          <div className="rc-hero__icon">
            <i className="bi bi-file-earmark-pdf-fill" />
          </div>
          <div className="rc-hero__body">
            <h2 className="rc-hero__title">Official Report Card</h2>
            <p className="rc-hero__sub">
              Download your official examination results as a PDF
            </p>
          </div>
        </div>

        {/* Download card */}
        <div className="card rc-card">
          <div className="card-header">
            <h5 className="card-title">
              <i className="bi bi-download me-2" />
              Download Report Card
            </h5>
          </div>

          <div className="card-body">
            <div className="rc-actions">
              {/* Exam selector */}
              <div className="form-group">
                <label className="form-label">
                  Select Exam
                  <span className="required">*</span>
                </label>
                {examsLoading ? (
                  <div
                    className="form-control"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    <span
                      className="spinner-border spinner-border-sm"
                      style={{
                        borderColor: "var(--brand-200)",
                        borderTopColor: "var(--brand-500)",
                      }}
                    />
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

              {/* Download button */}
              <button
                className={`btn btn-primary${downloading ? " is-loading" : ""}`}
                onClick={handleDownload}
                disabled={!selectedExamId || downloading || !studentId}
                style={{ flexShrink: 0 }}
              >
                {!downloading && <i className="bi bi-file-earmark-pdf me-2" />}
                {downloading ? "Generating PDF…" : "Download PDF"}
              </button>

              {/* Print button */}
              <button
                className="btn btn-outline btn-icon"
                onClick={() => window.print()}
                disabled={!selectedExamId}
                title="Print"
                style={{ flexShrink: 0 }}
              >
                <i className="bi bi-printer" />
              </button>
            </div>

            {/* No exams notice */}
            {!examsLoading && (exams ?? []).length === 0 && (
              <div className="alert alert--info mt-4 mb-0">
                <i className="bi bi-info-circle" />
                <div className="alert__body">
                  <p className="alert__text">
                    No published exams found. Report cards become available once
                    your teacher publishes results.
                  </p>
                </div>
              </div>
            )}

            {/* Selected exam info */}
            {selectedExam && (
              <div className="rc-exam-info">
                <i className="bi bi-journal-bookmark-fill" />
                <div>
                  <div className="rc-exam-info__name">{selectedExam.name}</div>
                  <div className="rc-exam-info__term">
                    {selectedExam.term_display}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};