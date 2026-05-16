import { useState } from "react";
import {
  getClassrooms, getSubjects, getAcademicYears, getTerms, getForms, getStreams,
  createAcademicYear,
} from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import { PageTitle, DataTable, AlertMessage, LoadingSpinner, EmptyState } from "../../../components/common";

// ── Classroom List ────────────────────────────────────────────────────────────
export function ClassroomList() {
  const { data: classrooms, loading, error } = useFetch(() => getClassrooms());

  const columns = [
    { header: "Classroom", render: (c) => <strong>{c.stream_display}</strong> },
    { header: "Form", key: "form_name" },
    { header: "Stream", key: "stream_name" },
    { header: "Year", key: "academic_year_display" },
    { header: "Class Teacher", render: (c) => c.class_teacher_name || "—" },
    { header: "Students", render: (c) => (
      <span className="badge bg-primary">{c.student_count}</span>
    )},
  ];

  return (
    <>
      <PageTitle title="Classrooms" breadcrumbs={[{ label: "Academics" }, { label: "Classrooms" }]} />
      {error && <AlertMessage type="danger" message={error} />}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">All Classrooms</h5>
          <DataTable columns={columns} data={classrooms} loading={loading} emptyMessage="No classrooms configured." />
        </div>
      </div>
    </>
  );
}

// ── Subject List ──────────────────────────────────────────────────────────────
export function SubjectList() {
  const { data: subjects, loading, error } = useFetch(() => getSubjects());

  const columns = [
    { header: "Code", render: (s) => <code>{s.code || "—"}</code> },
    { header: "Name", render: (s) => <strong>{s.name}</strong> },
    { header: "Type", render: (s) => (
      <span className="badge bg-info">{s.subject_type}</span>
    )},
    { header: "Forms", render: (s) => (
      <div className="d-flex gap-1 flex-wrap">
        {s.applicable_forms?.map((f) => (
          <span key={f.id} className="badge bg-secondary">{f.name}</span>
        )) || "—"}
      </div>
    )},
    { header: "Status", render: (s) => (
      <span className={`badge bg-${s.is_active ? "success" : "secondary"}`}>
        {s.is_active ? "Active" : "Inactive"}
      </span>
    )},
  ];

  return (
    <>
      <PageTitle title="Subjects" breadcrumbs={[{ label: "Academics" }, { label: "Subjects" }]} />
      {error && <AlertMessage type="danger" message={error} />}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">All Subjects</h5>
          <DataTable columns={columns} data={subjects} loading={loading} emptyMessage="No subjects configured." />
        </div>
      </div>
    </>
  );
}

// ── Academic Years & Terms ────────────────────────────────────────────────────
export function AcademicYearList() {
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showForm, setShowForm] = useState(false);
  const [newYear, setNewYear] = useState({ year: new Date().getFullYear(), start_date: "", end_date: "", is_current: false });
  const { data: years, loading, error, refetch } = useFetch(() => getAcademicYears());
  const { data: terms } = useFetch(() => getTerms());

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAcademicYear(newYear);
      setMsg({ type: "success", text: "Academic year created." });
      refetch();
      setShowForm(false);
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.detail || "Failed to create." });
    }
  };

  return (
    <>
      <PageTitle title="Academic Years" breadcrumbs={[{ label: "Academics" }, { label: "Years" }]} />
      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      {showForm && (
        <div className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">New Academic Year</h5>
            <form onSubmit={handleCreate} className="row g-3">
              <div className="col-md-2">
                <label className="form-label fw-600">Year</label>
                <input type="number" className="form-control" value={newYear.year}
                  onChange={(e) => setNewYear((f) => ({ ...f, year: e.target.value }))} required />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-600">Start Date</label>
                <input type="date" className="form-control" value={newYear.start_date}
                  onChange={(e) => setNewYear((f) => ({ ...f, start_date: e.target.value }))} required />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-600">End Date</label>
                <input type="date" className="form-control" value={newYear.end_date}
                  onChange={(e) => setNewYear((f) => ({ ...f, end_date: e.target.value }))} required />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="isCurrent"
                    checked={newYear.is_current}
                    onChange={(e) => setNewYear((f) => ({ ...f, is_current: e.target.checked }))} />
                  <label className="form-check-label fw-600" htmlFor="isCurrent">Set as Current</label>
                </div>
              </div>
              <div className="col-md-2 d-flex align-items-end gap-2">
                <button type="submit" className="btn btn-success btn-sm">Create</button>
                <button type="button" className="btn btn-secondary btn-sm"
                  onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Academic Years</h5>
                <button className="btn btn-sm btn-primary" onClick={() => setShowForm((s) => !s)}>
                  <i className="bi bi-plus me-1" />Add Year
                </button>
              </div>
              {loading ? (
                <LoadingSpinner />
              ) : years?.length ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>Year</th><th>Period</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {years.map((y) => (
                        <tr key={y.id}>
                          <td className="fw-700 fs-6">{y.year}</td>
                          <td style={{ fontSize: 12, color: "#899bbd" }}>
                            {formatDate(y.start_date)} – {formatDate(y.end_date)}
                          </td>
                          <td>
                            {y.is_current && <span className="badge bg-success">Current</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No academic years configured." />
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Terms</h5>
              {terms?.length ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>Term</th><th>Year</th><th>Period</th><th>Current</th></tr>
                    </thead>
                    <tbody>
                      {terms.map((t) => (
                        <tr key={t.id}>
                          <td className="fw-600">Term {t.term_number}</td>
                          <td>{t.academic_year_display}</td>
                          <td style={{ fontSize: 12, color: "#899bbd" }}>
                            {formatDate(t.start_date)} – {formatDate(t.end_date)}
                          </td>
                          <td>
                            {t.is_current && <span className="badge bg-success">✓</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No terms configured." />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}