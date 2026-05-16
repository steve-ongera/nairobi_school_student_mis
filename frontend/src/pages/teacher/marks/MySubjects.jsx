import { Link } from "react-router-dom";
import { getMyAllocations } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, LoadingSpinner, AlertMessage } from "../../../components/common";

export default function MySubjects() {
  const { data: allocations, loading, error } = useFetch(() => getMyAllocations());

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageTitle
        title="My Subjects"
        breadcrumbs={[{ label: "Marks" }, { label: "My Subjects" }]}
      />

      {error && <AlertMessage type="danger" message={error} />}

      {!allocations?.length ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-message">
              <i
                className="bi bi-journal-x"
                style={{ fontSize: 36, display: "block", marginBottom: 8 }}
              />
              No subject allocations for this term.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* allocation count chip next to a subtle heading */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
              {allocations.length} allocation{allocations.length !== 1 ? "s" : ""} this term
            </span>
            <span className="count-chip">{allocations.length}</span>
          </div>

          <div className="row">
            {allocations.map((a) => (
              <div key={a.id} className="col-md-4">
                <div className="card">
                  <div className="card-body">

                    {/* ── Subject header ── */}
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div
                        className="card-icon rounded-circle d-flex align-items-center justify-content-center"
                        style={{ background: "#f6f6fe", color: "#4154f1", flexShrink: 0 }}
                      >
                        <i className="bi bi-journal-text" />
                      </div>
                      <div>
                        <h5 className="mb-0 fw-700" style={{ color: "var(--text-primary)", fontSize: 16 }}>
                          {a.subject_name}
                        </h5>
                        <small style={{ color: "var(--text-muted)", fontSize: 12 }}>
                          {a.classroom_display}
                        </small>
                      </div>
                    </div>

                    {/* ── Divider ── */}
                    <hr style={{ borderColor: "var(--border-light)", margin: "12px 0" }} />

                    {/* ── Actions ── */}
                    <div className="d-flex gap-2">
                      <Link
                        to={`/teacher/marks/entry?subject=${a.subject}&classroom=${a.classroom}`}
                        className="btn btn-primary btn-sm flex-grow-1"
                      >
                        <i className="bi bi-pencil" /> Enter Marks
                      </Link>
                      <Link
                        to={`/teacher/marks/analysis?subject=${a.subject}&classroom=${a.classroom}`}
                        className="btn btn-outline-primary btn-sm"
                        title="View Analysis"
                      >
                        <i className="bi bi-bar-chart" />
                      </Link>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}