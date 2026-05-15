import { useState } from "react";
import { useParams } from "react-router-dom";
import { getExamResults, getExamRankings } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, DataTable, AlertMessage, LoadingSpinner, GradeBadge } from "../../../components/common";

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