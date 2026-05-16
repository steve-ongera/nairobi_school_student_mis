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
          width: 240px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          background: #fafbfc;
          padding: 16px 12px;
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
          margin-bottom: 8px;
        }

        .vtab-item {
          display: flex;
          flex-direction: column;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          border: none;
          background: transparent;
          text-align: left;
          transition: all var(--transition-fast);
          width: 100%;
        }

        .vtab-item:hover {
          background: var(--primary-light);
        }

        .vtab-item.active {
          background: var(--primary-light);
          border-left: 3px solid var(--primary);
        }

        .vtab-item__name {
          font-size: 13px;
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
          margin-top: 2px;
        }

        .vtab-empty-sidebar {
          padding: 24px 12px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        /* Right content */
        .vtab-content {
          flex: 1;
          padding: 28px;
          overflow-x: auto;
        }

        /* Summary chips */
        .result-summary {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .result-summary__item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--primary-light);
          border-radius: 12px;
          padding: 12px 18px;
          flex: 1;
          min-width: 120px;
        }

        .result-summary__item i {
          font-size: 20px;
          color: var(--primary);
        }

        .result-summary__val {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .result-summary__label {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* Results table */
        .results-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .results-table thead th {
          text-align: left;
          padding: 10px 14px;
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
          padding: 11px 14px;
          border-bottom: 1px solid var(--border-light);
          vertical-align: middle;
          color: var(--text-secondary);
        }

        .results-table tbody tr:last-child td { border-bottom: none; }
        .results-table tbody tr:hover { background: #fafbfc; }

        .results-table tfoot td {
          padding: 11px 14px;
          background: #f8fafc;
          border-top: 1px solid var(--border);
          font-weight: 700;
          color: var(--text-primary);
          font-size: 13px;
        }

        .marks-bar {
          height: 5px;
          border-radius: 4px;
          background: var(--border);
          width: 70px;
          margin-bottom: 4px;
          overflow: hidden;
        }

        .marks-bar__fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--primary), var(--accent));
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
          gap: 12px;
        }

        .vtab-placeholder i { font-size: 48px; opacity: 0.3; }
        .vtab-placeholder p { font-size: 14px; margin: 0; }

        @media (max-width: 768px) {
          .vtab-layout { flex-direction: column; }
          .vtab-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border); flex-direction: row; flex-wrap: wrap; padding: 12px; }
          .vtab-sidebar__heading { display: none; }
          .vtab-item { flex-direction: row; align-items: center; gap: 8px; flex: 1; min-width: 140px; }
          .result-summary { flex-direction: column; }
        }
      `}</style>

      <PageTitle title="My Results" breadcrumbs={[{ label: "Results" }]} />

      <div className="vtab-layout">

        {/* ── Left: exam list ── */}
        <div className="vtab-sidebar">
          <div className="vtab-sidebar__heading">Exams</div>

          {!exams?.length ? (
            <div className="vtab-empty-sidebar">No published exams yet.</div>
          ) : (
            exams.map((e) => (
              <button
                key={e.id}
                className={`vtab-item ${selectedExam === String(e.id) ? "active" : ""}`}
                onClick={() => setSelectedExam(String(e.id))}
              >
                <span className="vtab-item__name">{e.name}</span>
                <span className="vtab-item__sub">{e.term_display}</span>
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
                  { label: "Subjects",   value: results.length,     icon: "bi-book" },
                  { label: "Total Marks",value: total.toFixed(1),   icon: "bi-calculator" },
                  { label: "Mean Score", value: `${mean}`,          icon: "bi-bar-chart" },
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
                        <td style={{ color: "var(--text-muted)", width: 32 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.subject_name}</td>
                        <td>
                          <div className="marks-bar">
                            <div className="marks-bar__fill" style={{ width: `${r.marks}%` }} />
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
    } catch {
      setMsg({ type: "danger", text: "Failed to download report card." });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <PageTitle title="Report Card" breadcrumbs={[{ label: "Results" }, { label: "Report Card" }]} />

      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      <div className="vtab-layout">

        {/* ── Left: exam list ── */}
        <div className="vtab-sidebar">
          <div className="vtab-sidebar__heading">Exams</div>

          {!exams?.length ? (
            <div className="vtab-empty-sidebar">No published exams yet.</div>
          ) : (
            exams.map((e) => (
              <button
                key={e.id}
                className={`vtab-item ${selectedExam === String(e.id) ? "active" : ""}`}
                onClick={() => setSelectedExam(String(e.id))}
              >
                <span className="vtab-item__name">{e.name}</span>
                <span className="vtab-item__sub">{e.term_display}</span>
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
            <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
              <i className="bi bi-file-earmark-pdf"
                style={{ fontSize: 64, color: "var(--danger)", display: "block", marginBottom: 16 }}
              />
              <h5 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                Download Report Card
              </h5>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28 }}>
                Your PDF report card is ready to download for the selected exam.
              </p>
              <button
                className="btn btn-primary w-100"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <><span className="spinner-border spinner-border-sm" /> Generating PDF…</>
                ) : (
                  <><i className="bi bi-download" /> Download Report Card</>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </>
  );
}