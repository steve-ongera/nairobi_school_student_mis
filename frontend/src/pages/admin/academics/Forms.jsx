import { useState } from "react";
import { getForms, getStreams } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, AlertMessage, LoadingSpinner, EmptyState } from "../../../components/common";

export function FormList() {
  const { data: forms, loading, error } = useFetch(() => getForms());

  return (
    <>
      <PageTitle title="Forms" breadcrumbs={[{ label: "Academics" }, { label: "Forms" }]} />
      {error && <AlertMessage type="danger" message={error} />}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Forms (1 – 4)</h5>
          {loading ? (
            <LoadingSpinner />
          ) : forms?.length ? (
            <div className="row g-3">
              {forms.map((f) => (
                <div key={f.id} className="col-md-3">
                  <div
                    className="p-4 rounded text-center"
                    style={{ background: "#f6f9ff", border: "1px solid #ebeef4" }}
                  >
                    <i className="bi bi-building" style={{ fontSize: 32, color: "#4154f1" }} />
                    <h5 className="mt-2 mb-0 fw-700" style={{ color: "#012970" }}>{f.name}</h5>
                    {f.level && <small className="text-muted">Level {f.level}</small>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No forms configured." />
          )}
        </div>
      </div>
    </>
  );
}

export function StreamList() {
  const [formFilter, setFormFilter] = useState("");
  const { data: forms } = useFetch(() => getForms());
  const { data: streams, loading, error } = useFetch(
    () => getStreams(formFilter ? { form: formFilter } : {}),
    [formFilter]
  );

  return (
    <>
      <PageTitle title="Streams" breadcrumbs={[{ label: "Academics" }, { label: "Streams" }]} />
      {error && <AlertMessage type="danger" message={error} />}

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h5 className="card-title mb-0">All Streams</h5>
            <select
              className="form-select form-select-sm"
              style={{ maxWidth: 200 }}
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
            >
              <option value="">— All Forms —</option>
              {forms?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : streams?.length ? (
            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle">
                <thead className="table-light">
                  <tr><th>Stream Name</th><th>Form</th></tr>
                </thead>
                <tbody>
                  {streams.map((s) => (
                    <tr key={s.id}>
                      <td className="fw-600">{s.name}</td>
                      <td>{s.form_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No streams configured." />
          )}
        </div>
      </div>
    </>
  );
}

export default FormList;