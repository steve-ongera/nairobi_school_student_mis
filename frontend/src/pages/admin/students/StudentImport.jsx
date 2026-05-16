import { useState } from "react";
import * as XLSX from "xlsx";
import { createStudent, getClassrooms } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, AlertMessage } from "../../../components/common";
import { FileUpload } from "../../../components/common/Extras";

export default function StudentImport() {
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [importing, setImporting] = useState(false);
  const { data: classrooms } = useFetch(() => getClassrooms());

  const handleFile = (f) => {
    setFile(f);
    setRows([]);
    setErrors([]);
    setProgress(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
      setRows(data.slice(0, 200));
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    setErrors([]);
    setProgress({ done: 0, total: rows.length });
    const errs = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        await createStudent({
          first_name: row.first_name || row["First Name"] || "",
          last_name: row.last_name || row["Last Name"] || "",
          email: row.email || row["Email"] || "",
          admission_number: row.admission_number || row["Admission Number"] || "",
          gender: (row.gender || row["Gender"] || "").toLowerCase(),
          date_of_birth: row.date_of_birth || row["Date of Birth"] || "",
          boarding_status: (row.boarding_status || row["Boarding"] || "day").toLowerCase(),
          current_classroom: row.classroom_id || row["Classroom ID"] || undefined,
        });
      } catch (err) {
        const d = err.response?.data;
        errs.push({
          row: i + 2,
          name: `${row.first_name || ""} ${row.last_name || ""}`.trim(),
          error: typeof d === "string" ? d : Object.values(d || {}).flat().join(", ") || "Failed",
        });
      }
      setProgress({ done: i + 1, total: rows.length });
    }

    setErrors(errs);
    setImporting(false);
    const succeeded = rows.length - errs.length;
    setMsg({
      type: succeeded > 0 ? "success" : "danger",
      text: `Import complete: ${succeeded} succeeded, ${errs.length} failed.`,
    });
  };

  const PREVIEW_COLS = ["first_name", "last_name", "email", "admission_number", "gender", "boarding_status"];

  return (
    <>
      <PageTitle title="Import Students" breadcrumbs={[{ label: "Students", to: "/admin/students" }, { label: "Import" }]} />
      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="row">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Upload Excel File</h5>

              <div className="alert alert-info mb-4">
                <strong>Required columns:</strong>{" "}
                <code>first_name</code>, <code>last_name</code>, <code>email</code>,{" "}
                <code>admission_number</code>, <code>gender</code>, <code>date_of_birth</code>,{" "}
                <code>boarding_status</code>, <code>classroom_id</code> (optional)
              </div>

              <FileUpload
                onFile={handleFile}
                accept=".xlsx,.xls"
                label={file ? file.name : "Click or drag Excel file here"}
                hint="Supports .xlsx and .xls — max 200 rows per upload"
              />

              {rows.length > 0 && (
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>{rows.length} rows detected</strong>
                    <button
                      className="btn btn-primary"
                      onClick={handleImport}
                      disabled={importing}
                    >
                      {importing ? (
                        <><span className="spinner-border spinner-border-sm me-2" />Importing…</>
                      ) : (
                        <><i className="bi bi-cloud-upload me-2" />Import {rows.length} Students</>
                      )}
                    </button>
                  </div>

                  {progress && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small>Progress</small>
                        <small>{progress.done} / {progress.total}</small>
                      </div>
                      <div className="progress" style={{ height: 8 }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${(progress.done / progress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="table-responsive" style={{ maxHeight: 320, overflowY: "auto" }}>
                    <table className="table table-sm table-bordered align-middle">
                      <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                        <tr>
                          <th>#</th>
                          {PREVIEW_COLS.map((c) => <th key={c}>{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            {PREVIEW_COLS.map((c) => (
                              <td key={c} style={{ fontSize: 12 }}>{row[c] || "—"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 10 && (
                      <p className="text-muted text-center py-2" style={{ fontSize: 12 }}>
                        Showing first 10 of {rows.length} rows
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          {errors.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title text-danger">
                  <i className="bi bi-exclamation-triangle me-2" />
                  Import Errors ({errors.length})
                </h5>
                <div className="table-responsive" style={{ maxHeight: 360, overflowY: "auto" }}>
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr><th>Row</th><th>Name</th><th>Error</th></tr>
                    </thead>
                    <tbody>
                      {errors.map((err, i) => (
                        <tr key={i}>
                          <td>{err.row}</td>
                          <td>{err.name || "—"}</td>
                          <td className="text-danger" style={{ fontSize: 12 }}>{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Instructions</h5>
              <ol className="text-muted" style={{ fontSize: 14 }}>
                <li className="mb-2">Prepare your Excel file with the required column headers in Row 1.</li>
                <li className="mb-2">Gender values: <code>male</code> or <code>female</code></li>
                <li className="mb-2">Boarding: <code>day</code>, <code>boarding</code>, or <code>day_boarding</code></li>
                <li className="mb-2">Date format: <code>YYYY-MM-DD</code> (e.g. 2008-05-14)</li>
                <li className="mb-2">To assign a classroom, include the classroom ID in <code>classroom_id</code> column.</li>
                <li>Maximum 200 rows per upload.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}