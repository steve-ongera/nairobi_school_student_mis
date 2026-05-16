import { useState } from "react";
import { useParams } from "react-router-dom";
import { getGradingScale, seedDefaultGrading, getExamResults, getExamRankings } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, DataTable, AlertMessage, LoadingSpinner, GradeBadge } from "../../../components/common";

// ── Grading Scale Settings ────────────────────────────────────────────────────
export function GradingSettings() {
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [seeding, setSeeding] = useState(false);
  const { data: scale, loading, error, refetch } = useFetch(() => getGradingScale());

  const handleSeedDefaults = async () => {
    if (!window.confirm("Seed KNEC default grading scale? This will add default grades.")) return;
    setSeeding(true);
    try {
      await seedDefaultGrading();
      setMsg({ type: "success", text: "KNEC default grading scale seeded." });
      refetch();
    } catch {
      setMsg({ type: "danger", text: "Failed to seed grading scale." });
    } finally {
      setSeeding(false);
    }
  };

  const columns = [
    { header: "Grade", render: (g) => <GradeBadge grade={g.grade} /> },
    { header: "Min Marks", key: "min_marks" },
    { header: "Max Marks", key: "max_marks" },
    { header: "Points", render: (g) => <strong>{g.points}</strong> },
    { header: "Description", key: "description" },
  ];

  return (
    <>
      <PageTitle
        title="Grading Scale"
        breadcrumbs={[{ label: "Settings" }, { label: "Grading" }]}
      />
      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">KNEC Grading Scale</h5>
            <button
              className="btn btn-outline-primary"
              onClick={handleSeedDefaults}
              disabled={seeding}
            >
              {seeding ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : (
                <i className="bi bi-arrow-clockwise me-2" />
              )}
              Seed KNEC Defaults
            </button>
          </div>

          {!loading && !scale?.length && (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2" />
              No grading scale configured. Click "Seed KNEC Defaults" to add the standard scale.
            </div>
          )}

          {error && <AlertMessage type="danger" message={error} />}
          <DataTable
            columns={columns}
            data={scale}
            loading={loading}
            emptyMessage="No grading scale configured."
          />
        </div>
      </div>
    </>
  );
}

// ── Exam Results View ─────────────────────────────────────────────────────────
export function ExamResults() {
  const { id } = useParams();
  const [classroomFilter, setClassroomFilter] = useState("");
  const { data: results, loading, error } = useFetch(
    () => getExamResults(id, classroomFilter ? { classroom: classroomFilter } : {}),
    [id, classroomFilter]
  );
  const { data: rankings } = useFetch(() => getExamRankings(id), [id]);

  const columns = [
    { header: "Adm No", render: (r) => <code style={{ fontSize: 12 }}>{r.admission_number}</code> },
    { header: "Student", key: "student_name" },
    { header: "Subject", key: "subject_name" },
    {
      header: "Marks",
      render: (r) => (
        <div className="d-flex align-items-center gap-2">
          <div className="progress flex-grow-1" style={{ height: 6, minWidth: 60 }}>
            <div
              className="progress-bar bg-primary"
              style={{ width: `${r.marks}%` }}
            />
          </div>
          <span>{r.marks}</span>
        </div>
      ),
    },
    { header: "Grade", render: (r) => <GradeBadge grade={r.grade} /> },
    { header: "Points", key: "points" },
    { header: "Remarks", render: (r) => <small className="text-muted">{r.remarks || "—"}</small> },
  ];

  return (
    <>
      <PageTitle
        title="Exam Results"
        breadcrumbs={[{ label: "Exams", to: "/admin/exams" }, { label: "Results" }]}
      />

      {error && <AlertMessage type="danger" message={error} />}

      {/* Summary counts */}
      {results && (
        <div className="row mb-3">
          <div className="col-md-3">
            <div className="card info-card">
              <div className="card-body">
                <h5 className="card-title">Total Entries</h5>
                <div className="d-flex align-items-center">
                  <div
                    className="card-icon rounded-circle d-flex align-items-center justify-content-center"
                    style={{ background: "#f6f6fe", color: "#4154f1" }}
                  >
                    <i className="bi bi-journal-check" />
                  </div>
                  <div className="ps-3">
                    <h6>{results.length}</h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">All Results</h5>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <DataTable
              columns={columns}
              data={results}
              loading={false}
              emptyMessage="No results for this exam yet."
            />
          )}
        </div>
      </div>
    </>
  );
}