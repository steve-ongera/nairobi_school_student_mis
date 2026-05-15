import { Link } from "react-router-dom";
import { getMyAllocations } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, LoadingSpinner, AlertMessage, EmptyState } from "../../../components/common";

export default function MySubjects() {
  const { data: allocations, loading, error } = useFetch(() => getMyAllocations());

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageTitle title="My Subjects" breadcrumbs={[{ label: "Marks" }, { label: "My Subjects" }]} />
      {error && <AlertMessage type="danger" message={error} />}

      {!allocations?.length ? (
        <div className="card"><div className="card-body"><EmptyState message="No subject allocations for this term." /></div></div>
      ) : (
        <div className="row">
          {allocations.map((a) => (
            <div key={a.id} className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "#f6f6fe", color: "#4154f1",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22,
                      }}
                    >
                      <i className="bi bi-journal-text" />
                    </div>
                    <div>
                      <h5 className="mb-0 fw-700" style={{ color: "#012970" }}>{a.subject_name}</h5>
                      <small className="text-muted">{a.classroom_display}</small>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <Link
                      to={`/teacher/marks/entry?subject=${a.subject}&classroom=${a.classroom}`}
                      className="btn btn-sm btn-primary flex-grow-1"
                    >
                      <i className="bi bi-pencil me-1" />Enter Marks
                    </Link>
                    <Link
                      to={`/teacher/marks/analysis?subject=${a.subject}&classroom=${a.classroom}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="bi bi-bar-chart" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}