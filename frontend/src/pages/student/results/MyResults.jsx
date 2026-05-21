import { useState } from "react";
import { getExams, getStudentResults, downloadReportCard } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { useAuth } from "../../../hooks";
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
  const mean  = results?.length ? (total / results.length).toFixed(1) : null;

  return (
    <>
      <style>{`
        /* ── Vertical tab layout ── */
        .vtab-layout {
          display: flex;
          gap: 0;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          min-height: 480px;
        }

        /* Left sidebar */
        .vtab-sidebar {
          width: 280px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          background: #fafbfc;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .vtab-sidebar__heading {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          padding: 8px 12px 12px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 12px;
        }

        .vtab-item {
          display: flex;
          flex-direction: column;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          border: none;
          background: transparent;
          text-align: left;
          transition: all var(--transition-fast);
          width: 100%;
          position: relative;
        }

        .vtab-item:hover {
          background: var(--primary-light);
          transform: translateX(4px);
        }

        .vtab-item.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .vtab-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 12px;
          bottom: 12px;
          width: 3px;
          background: var(--primary);
          border-radius: 0 3px 3px 0;
        }

        .vtab-item__name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .vtab-item.active .vtab-item__name {
          color: var(--primary);
        }

        .vtab-item__sub {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .vtab-empty-sidebar {
          padding: 32px 16px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        /* Right content */
        .vtab-content {
          flex: 1;
          padding: 28px 32px;
          overflow-x: auto;
          background: var(--bg-card);
        }

        /* Summary chips */
        .result-summary {
          display: flex;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .result-summary__item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, var(--primary-light) 0%, rgba(37,99,235,0.05) 100%);
          border-radius: 16px;
          padding: 16px 20px;
          flex: 1;
          min-width: 140px;
          transition: all var(--transition-fast);
          border: 1px solid var(--border-light);
        }

        .result-summary__item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .result-summary__item i {
          font-size: 28px;
          color: var(--primary);
        }

        .result-summary__val {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .result-summary__label {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Results table */
        .results-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .results-table thead th {
          text-align: left;
          padding: 12px 16px;
          background: #f8fafc;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .results-table tbody td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-light);
          vertical-align: middle;
          color: var(--text-secondary);
        }

        .results-table tbody tr:last-child td { border-bottom: none; }
        .results-table tbody tr:hover { background: #fafbfc; }

        .results-table tfoot td {
          padding: 12px 16px;
          background: #f8fafc;
          border-top: 1px solid var(--border);
          font-weight: 700;
          color: var(--text-primary);
          font-size: 13px;
        }

        .marks-bar {
          height: 6px;
          border-radius: 3px;
          background: var(--border);
          width: 80px;
          margin-bottom: 6px;
          overflow: hidden;
        }

        .marks-bar__fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, var(--primary), var(--accent));
          transition: width 0.3s ease;
        }

        .vtab-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 360px;
          color: var(--text-muted);
          text-align: center;
          gap: 16px;
        }

        .vtab-placeholder i { 
          font-size: 64px; 
          opacity: 0.3;
        }
        
        .vtab-placeholder p { 
          font-size: 14px; 
          margin: 0;
          max-width: 300px;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 992px) {
          .vtab-sidebar {
            width: 240px;
            padding: 16px 12px;
          }
          
          .vtab-content {
            padding: 20px 24px;
          }
          
          .result-summary__val {
            font-size: 20px;
          }
          
          .result-summary__item i {
            font-size: 24px;
          }
        }

        @media (max-width: 768px) {
          .vtab-layout { 
            flex-direction: column; 
            border-radius: 16px;
          }
          
          .vtab-sidebar { 
            width: 100%; 
            border-right: none; 
            border-bottom: 1px solid var(--border);
            flex-direction: row;
            flex-wrap: wrap;
            padding: 16px;
            gap: 8px;
          }
          
          .vtab-sidebar__heading { 
            width: 100%;
            margin-bottom: 8px;
          }
          
          .vtab-item { 
            flex-direction: row; 
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex: 1;
            min-width: calc(50% - 8px);
            padding: 10px 14px;
          }
          
          .vtab-item.active::before {
            top: 8px;
            bottom: 8px;
          }
          
          .vtab-item__sub {
            margin-top: 0;
          }
          
          .vtab-content {
            padding: 20px;
          }
          
          .result-summary { 
            flex-direction: column;
            gap: 12px;
          }
          
          .result-summary__item {
            padding: 12px 16px;
          }
          
          .results-table thead th,
          .results-table tbody td,
          .results-table tfoot td {
            padding: 8px 12px;
          }
          
          .marks-bar {
            width: 60px;
          }
        }

        @media (max-width: 576px) {
          .vtab-sidebar {
            padding: 12px;
          }
          
          .vtab-item {
            min-width: 100%;
            padding: 10px 12px;
          }
          
          .vtab-content {
            padding: 16px;
          }
          
          .result-summary__val {
            font-size: 18px;
          }
          
          .results-table {
            font-size: 11px;
          }
          
          .results-table thead th,
          .results-table tbody td,
          .results-table tfoot td {
            padding: 6px 8px;
          }
          
          .marks-bar {
            width: 50px;
            height: 4px;
          }
          
          .vtab-placeholder i {
            font-size: 48px;
          }
          
          .vtab-placeholder p {
            font-size: 13px;
          }
        }
      `}</style>

      <PageTitle title="My Results" breadcrumbs={[{ label: "Results" }]} />

      <div className="vtab-layout">

        {/* ── Left: exam list ── */}
        <div className="vtab-sidebar">
          <div className="vtab-sidebar__heading">
            <i className="bi bi-journal-bookmark-fill me-2"></i>
            Exams
          </div>

          {!exams?.length ? (
            <div className="vtab-empty-sidebar">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              No published exams yet.
            </div>
          ) : (
            exams.map((e) => (
              <button
                key={e.id}
                className={`vtab-item ${selectedExam === String(e.id) ? "active" : ""}`}
                onClick={() => setSelectedExam(String(e.id))}
              >
                <div>
                  <span className="vtab-item__name">{e.name}</span>
                  <span className="vtab-item__sub">{e.term_display}</span>
                </div>
                {selectedExam === String(e.id) && (
                  <i className="bi bi-check-circle-fill" style={{ color: 'var(--primary)', fontSize: '16px' }}></i>
                )}
              </button>
            ))
          )}
        </div>

        {/* ── Right: results content ── */}
        <div className="vtab-content">
          {!selectedExam ? (
            <div className="vtab-placeholder">
              <i className="bi bi-arrow-left-circle" />
              <p>Select an exam from the left to view your results.</p>
            </div>
          ) : loading ? (
            <LoadingSpinner />
          ) : results?.length === 0 ? (
            <div className="vtab-placeholder">
              <i className="bi bi-journal-x" />
              <p>No results published for this exam yet.</p>
            </div>
          ) : (
            <>
              {/* Summary strip */}
              <div className="result-summary">
                {[
                  { label: "Subjects",   value: results.length,     icon: "bi-book", color: "primary" },
                  { label: "Total Marks",value: total.toFixed(1),   icon: "bi-calculator", color: "success" },
                  { label: "Mean Score", value: `${mean}`,          icon: "bi-bar-chart", color: "warning" },
                ].map((item) => (
                  <div className="result-summary__item" key={item.label}>
                    <i className={`bi ${item.icon}`} />
                    <div>
                      <div className="result-summary__val">{item.value}</div>
                      <div className="result-summary__label">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="results-table">
                  <thead>
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
                        <td style={{ color: "var(--text-muted)", width: 40 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.subject_name}</td>
                        <td style={{ minWidth: '100px' }}>
                          <div className="marks-bar">
                            <div className="marks-bar__fill" style={{ width: `${Math.min(r.marks, 100)}%` }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{r.marks}</span>
                        </td>
                        <td><GradeBadge grade={r.grade} /></td>
                        <td>{r.points ?? "—"}</td>
                        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
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
      setMsg({ type: "success", text: "Report card downloaded successfully!" });
      setTimeout(() => setMsg({ type: "", text: "" }), 3000);
    } catch {
      setMsg({ type: "danger", text: "Failed to download report card." });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <style>{`
        .download-card {
          background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
          border-radius: 20px;
          padding: 48px 32px;
          text-align: center;
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
          transition: all var(--transition-base);
        }
        
        .download-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        
        .download-icon {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        
        .download-icon i {
          font-size: 48px;
          color: var(--danger);
        }
        
        @media (max-width: 768px) {
          .download-card {
            padding: 32px 24px;
          }
          
          .download-icon {
            width: 80px;
            height: 80px;
          }
          
          .download-icon i {
            font-size: 38px;
          }
        }
        
        @media (max-width: 576px) {
          .download-card {
            padding: 24px 20px;
          }
        }
      `}</style>

      <PageTitle title="Report Card" breadcrumbs={[{ label: "Results" }, { label: "Report Card" }]} />

      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      <div className="vtab-layout">

        {/* ── Left: exam list ── */}
        <div className="vtab-sidebar">
          <div className="vtab-sidebar__heading">
            <i className="bi bi-journal-bookmark-fill me-2"></i>
            Exams
          </div>

          {!exams?.length ? (
            <div className="vtab-empty-sidebar">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              No published exams yet.
            </div>
          ) : (
            exams.map((e) => (
              <button
                key={e.id}
                className={`vtab-item ${selectedExam === String(e.id) ? "active" : ""}`}
                onClick={() => setSelectedExam(String(e.id))}
              >
                <div>
                  <span className="vtab-item__name">{e.name}</span>
                  <span className="vtab-item__sub">{e.term_display}</span>
                </div>
                {selectedExam === String(e.id) && (
                  <i className="bi bi-check-circle-fill" style={{ color: 'var(--primary)', fontSize: '16px' }}></i>
                )}
              </button>
            ))
          )}
        </div>

        {/* ── Right: download panel ── */}
        <div className="vtab-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {!selectedExam ? (
            <div className="vtab-placeholder">
              <i className="bi bi-arrow-left-circle" />
              <p>Select an exam from the left to download your report card.</p>
            </div>
          ) : (
            <div className="download-card">
              <div className="download-icon">
                <i className="bi bi-file-earmark-pdf-fill" />
              </div>
              <h5 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                Download Report Card
              </h5>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32, lineHeight: 1.5 }}>
                Your PDF report card is ready to download for <strong>{exams?.find(e => String(e.id) === selectedExam)?.name}</strong>
              </p>
              <button
                className="btn btn-primary w-100"
                onClick={handleDownload}
                disabled={downloading}
                style={{ padding: '12px', fontSize: '14px' }}
              >
                {downloading ? (
                  <><span className="spinner-border spinner-border-sm me-2" /> Generating PDF…</>
                ) : (
                  <><i className="bi bi-download me-2" /> Download Report Card</>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </>
  );
}