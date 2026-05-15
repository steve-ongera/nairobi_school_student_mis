import { useState } from "react";
import { getMyAttendance } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage, EmptyState } from "../../../components/common";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const STATUS_COLORS = {
  present: "#2eca6a",
  absent: "#dc3545",
  late: "#ff771d",
  sick: "#4154f1",
};

const STATUS_LABELS = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  sick: "Sick/Excused",
};

export default function MyAttendance() {
  const [termId, setTermId] = useState("");
  const { data: records, loading, error } = useFetch(
    () => getMyAttendance(termId ? { term: termId } : {}),
    [termId]
  );

  const summary = records?.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      acc.total++;
      return acc;
    },
    { total: 0 }
  );

  const pieData = ["present", "absent", "late", "sick"]
    .filter((s) => summary?.[s] > 0)
    .map((s) => ({ name: STATUS_LABELS[s], value: summary[s], color: STATUS_COLORS[s] }));

  const attendancePct = summary?.total
    ? Math.round(((summary.present || 0) / summary.total) * 100)
    : null;

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageTitle title="My Attendance" breadcrumbs={[{ label: "Attendance" }]} />

      {error && <AlertMessage type="danger" message={error} />}

      <div className="row">
        {/* Summary */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Summary</h5>

              {summary?.total > 0 ? (
                <>
                  <div className="text-center mb-3">
                    <div
                      style={{
                        fontSize: 48,
                        fontWeight: 800,
                        color: attendancePct >= 80 ? "#2eca6a" : "#dc3545",
                      }}
                    >
                      {attendancePct}%
                    </div>
                    <small className="text-muted">Attendance Rate</small>
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>

                  {["present", "absent", "late", "sick"].map((s) => (
                    <div key={s} className="d-flex justify-content-between mb-1">
                      <span className="d-flex align-items-center gap-2">
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: STATUS_COLORS[s],
                            display: "inline-block",
                          }}
                        />
                        {STATUS_LABELS[s]}
                      </span>
                      <strong>{summary[s] || 0} days</strong>
                    </div>
                  ))}
                  <hr />
                  <div className="d-flex justify-content-between fw-700">
                    <span>Total Days</span>
                    <span>{summary.total}</span>
                  </div>

                  {attendancePct < 80 && (
                    <div className="alert alert-warning mt-3 py-2 px-3 mb-0">
                      <i className="bi bi-exclamation-triangle me-2" />
                      <small>Below 80% — speak to your class teacher.</small>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState message="No attendance records found." icon="bi-calendar-x" />
              )}
            </div>
          </div>
        </div>

        {/* Records table */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Attendance Records</h5>

              {!records?.length ? (
                <EmptyState message="No records for this period." />
              ) : (
                <div className="table-responsive" style={{ maxHeight: 500, overflowY: "auto" }}>
                  <table className="table table-hover table-bordered align-middle">
                    <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.id}>
                          <td>{formatDate(r.date)}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: STATUS_COLORS[r.status],
                                color: "#fff",
                              }}
                            >
                              {STATUS_LABELS[r.status] || r.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "#899bbd" }}>{r.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}