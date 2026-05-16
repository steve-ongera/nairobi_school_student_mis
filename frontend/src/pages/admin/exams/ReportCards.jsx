import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getExams, getClassrooms, getClassroomStudents, downloadReportCard } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, AlertMessage, LoadingSpinner } from "../../../components/common";

export default function ReportCards() {
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState({
    exam: searchParams.get("exam") || "",
    classroom: "",
  });
  const [students, setStudents] = useState([]);
  const [checked, setChecked] = useState({});
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const { data: exams } = useFetch(() => getExams());
  const { data: classrooms } = useFetch(() => getClassrooms());

  const loadStudents = async (classroomId) => {
    if (!classroomId) { setStudents([]); return; }
    setStudentsLoading(true);
    try {
      const { data } = await getClassroomStudents(classroomId);
      setStudents(data);
      const all = {};
      data.forEach((s) => { all[s.id] = true; });
      setChecked(all);
    } catch {
      setMsg({ type: "danger", text: "Failed to load students." });
    } finally {
      setStudentsLoading(false);
    }
  };

  const toggleAll = (val) => {
    const all = {};
    students.forEach((s) => { all[s.id] = val; });
    setChecked(all);
  };

  const toggleOne = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));

  const selectedStudents = students.filter((s) => checked[s.id]);

  const handleDownload = async () => {
    if (!selected.exam || !selectedStudents.length) {
      setMsg({ type: "warning", text: "Select an exam and at least one student." });
      return;
    }
    setDownloading(true);
    setProgress({ done: 0, total: selectedStudents.length });
    setMsg({ type: "", text: "" });

    for (let i = 0; i < selectedStudents.length; i++) {
      const s = selectedStudents[i];
      try {
        const { data } = await downloadReportCard(s.id, selected.exam);
        const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `report_${s.admission_number}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        await new Promise((r) => setTimeout(r, 400));
      } catch {
        // skip errors silently
      }
      setProgress({ done: i + 1, total: selectedStudents.length });
    }

    setDownloading(false);
    setMsg({ type: "success", text: `Downloaded ${selectedStudents.length} report cards.` });
    setProgress(null);
  };

  return (
    <>
      <PageTitle title="Report Cards" breadcrumbs={[{ label: "Exams", to: "/admin/exams" }, { label: "Report Cards" }]} />
      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Generate Report Cards</h5>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label fw-600">Exam *</label>
              <select
                className="form-select"
                value={selected.exam}
                onChange={(e) => setSelected((s) => ({ ...s, exam: e.target.value }))}
              >
                <option value="">— Select Exam —</option>
                {exams?.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} – {e.term_display}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-600">Classroom *</label>
              <select
                className="form-select"
                value={selected.classroom}
                onChange={(e) => {
                  setSelected((s) => ({ ...s, classroom: e.target.value }));
                  loadStudents(e.target.value);
                }}
              >
                <option value="">— Select Classroom —</option>
                {classrooms?.map((c) => (
                  <option key={c.id} value={c.id}>{c.stream_display} – {c.academic_year_display}</option>
                ))}
              </select>
            </div>
          </div>

          {studentsLoading && <LoadingSpinner message="Loading students…" />}

          {!studentsLoading && students.length > 0 && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => toggleAll(true)}>
                    Select All
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleAll(false)}>
                    Deselect All
                  </button>
                  <span className="align-self-center text-muted small">
                    {selectedStudents.length} of {students.length} selected
                  </span>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={handleDownload}
                  disabled={downloading || !selectedStudents.length || !selected.exam}
                >
                  {downloading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Downloading…</>
                  ) : (
                    <><i className="bi bi-download me-2" />Download {selectedStudents.length} PDFs</>
                  )}
                </button>
              </div>

              {progress && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small>Downloading…</small>
                    <small>{progress.done} / {progress.total}</small>
                  </div>
                  <div className="progress" style={{ height: 8 }}>
                    <div
                      className="progress-bar bg-danger"
                      style={{ width: `${(progress.done / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedStudents.length === students.length}
                          onChange={(e) => toggleAll(e.target.checked)}
                        />
                      </th>
                      <th>Adm No</th>
                      <th>Student Name</th>
                      <th>Gender</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!checked[s.id]}
                            onChange={() => toggleOne(s.id)}
                          />
                        </td>
                        <td><code style={{ fontSize: 12 }}>{s.admission_number}</code></td>
                        <td className="fw-600">{s.full_name}</td>
                        <td className="text-capitalize">{s.gender}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={!selected.exam}
                            onClick={async () => {
                              try {
                                const { data } = await downloadReportCard(s.id, selected.exam);
                                const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `report_${s.admission_number}.pdf`;
                                a.click();
                                URL.revokeObjectURL(url);
                              } catch {
                                setMsg({ type: "danger", text: `Failed to download for ${s.full_name}.` });
                              }
                            }}
                          >
                            <i className="bi bi-file-pdf" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}