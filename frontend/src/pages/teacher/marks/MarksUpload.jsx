import { useState, useEffect } from "react";
import { getExams, getSubjects, getClassrooms, uploadMarksExcel } from "../../../utils/api";
import { PageTitle, AlertMessage } from "../../../components/common";

// Helper: unwrap DRF paginated or plain array responses
const unwrap = (res) => res?.data?.results ?? res?.data ?? [];

export default function MarksUpload() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selected, setSelected] = useState({ exam: "", subject: "", classroom: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([getExams(), getSubjects(), getClassrooms()])
      .then(([e, s, c]) => {
        setExams(unwrap(e));
        setSubjects(unwrap(s));
        setClassrooms(unwrap(c));
      })
      .catch(() =>
        setFetchError("Failed to load dropdown data. Please refresh the page.")
      );
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selected.exam || !selected.subject || !selected.classroom) {
      setMsg({ type: "warning", text: "Please fill all fields and select a file." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await uploadMarksExcel(formData, {
        exam: selected.exam,
        subject: selected.subject,
        classroom: selected.classroom,
      });
      setResult(data);
      setMsg({
        type: data.errors?.length ? "warning" : "success",
        text: `Upload complete: ${data.created} created, ${data.updated} updated.${
          data.errors?.length ? ` ⚠ ${data.errors.length} row(s) had errors.` : ""
        }`,
      });
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.detail || "Upload failed." });
    } finally {
      setLoading(false);
    }
  };

  const selectConfigs = [
    {
      label: "Exam",
      key: "exam",
      options: exams.map((e) => ({
        value: e.id,
        label: `${e.name} – ${e.term_display}`,
      })),
    },
    {
      label: "Subject",
      key: "subject",
      options: subjects.map((s) => ({ value: s.id, label: s.name })),
    },
    {
      label: "Classroom",
      key: "classroom",
      options: classrooms.map((c) => ({
        value: c.id,
        label: `${c.stream_display} – ${c.academic_year_display}`,
      })),
    },
  ];

  return (
    <>
      <PageTitle
        title="Upload Marks via Excel"
        breadcrumbs={[{ label: "Marks" }, { label: "Upload" }]}
      />

      {fetchError && <AlertMessage type="danger" message={fetchError} />}
      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      <div className="row">
        {/* ── Left: Upload form ── */}
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Upload Excel File</h5>

              <div className="alert alert-info d-flex gap-2 align-items-start mb-4">
                <i className="bi bi-info-circle-fill mt-1" />
                <div>
                  <strong>Excel Format Required:</strong>
                  <br />
                  <small>
                    Column A: <code>admission_number</code> &nbsp;|&nbsp;
                    Column B: <code>marks</code> (0–100) &nbsp;|&nbsp;
                    Column C: <code>remarks</code> (optional)
                    <br />
                    Row 1 must be headers. Data starts from Row 2.
                  </small>
                </div>
              </div>

              <form onSubmit={handleUpload}>
                <div className="row g-3 mb-3">
                  {selectConfigs.map(({ label, key, options }) => (
                    <div key={key} className="col-md-6">
                      <label className="form-label fw-600">{label}</label>
                      <select
                        className="form-select"
                        value={selected[key]}
                        onChange={(e) =>
                          setSelected((s) => ({ ...s, [key]: e.target.value }))
                        }
                        required
                      >
                        <option value="">— Select {label} —</option>
                        {options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-600">Excel File (.xlsx)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      setFile(e.target.files[0]);
                      setResult(null);
                    }}
                    required
                  />
                  {file && (
                    <small className="text-muted mt-1 d-block">
                      <i className="bi bi-file-earmark-excel text-success me-1" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </small>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-upload me-2" />
                      Upload & Process
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Right: Results + Instructions ── */}
        <div className="col-lg-5">
          {result && (
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Upload Results</h5>
                <div className="row text-center mb-3">
                  {[
                    { label: "Created", value: result.created, color: "success" },
                    { label: "Updated", value: result.updated, color: "primary" },
                    {
                      label: "Errors",
                      value: result.errors?.length || 0,
                      color: "danger",
                    },
                  ].map((item) => (
                    <div key={item.label} className="col-4">
                      <div className={`fw-700 fs-4 text-${item.color}`}>
                        {item.value}
                      </div>
                      <small className="text-muted">{item.label}</small>
                    </div>
                  ))}
                </div>

                {result.errors?.length > 0 && (
                  <>
                    <h6 className="text-danger mb-2">
                      <i className="bi bi-exclamation-triangle me-1" />
                      Row Errors
                    </h6>
                    <div
                      className="table-responsive"
                      style={{ maxHeight: 300, overflowY: "auto" }}
                    >
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Row</th>
                            <th>Adm No</th>
                            <th>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.errors.map((err, i) => (
                            <tr key={i}>
                              <td>{err.row || "—"}</td>
                              <td>
                                <code>{err.adm_no || err.student || "—"}</code>
                              </td>
                              <td
                                className="text-danger"
                                style={{ fontSize: 12 }}
                              >
                                {err.error}
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
          )}

          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Instructions</h5>
              <ol className="text-muted" style={{ fontSize: 14 }}>
                <li className="mb-2">Select the exam, subject, and classroom.</li>
                <li className="mb-2">
                  Prepare your Excel file with columns:{" "}
                  <code>admission_number</code>, <code>marks</code>,{" "}
                  <code>remarks</code>.
                </li>
                <li className="mb-2">Marks must be between 0 and 100.</li>
                <li className="mb-2">
                  If a result already exists for a student it will be updated,
                  not duplicated.
                </li>
                <li>Rows with invalid marks or unknown admission numbers are skipped and listed as errors.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}