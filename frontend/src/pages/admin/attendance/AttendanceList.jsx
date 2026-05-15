import { useState } from "react";
import { getAttendance, getClassrooms } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import { PageTitle, AlertMessage, LoadingSpinner, EmptyState } from "../../../components/common";
import { ExportCSV } from "../../../components/common/Extras";
import { AttendanceDonut } from "../../../components/charts/Charts";

const STATUS_COLORS = { present: "success", absent: "danger", late: "warning", sick: "info" };

export function AttendanceList() {
  const [filters, setFilters] = useState({
    classroom: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const { data: classrooms } = useFetch(() => getClassrooms());
  const { data: records, loading, error } = useFetch(
    () => getAttendance(filters.classroom ? filters : { date: filters.date }),
    [filters.classroom, filters.date]
  );

  const summary = records?.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; acc.total++; return acc; },
    { total: 0 }
  );

  const exportColumns = [
    { key: "student_name", label: "Student" },
    { key: "admission_number", label: "Adm No" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "remarks", label: "Remarks" },
    { key: "recorded_by_name", label: "Recorded By" },
  ];

  return (
    <>
      <PageTitle title="Attendance" breadcrumbs={[{ label: "Attendance" }]} />
      {error && <AlertMessage type="danger" message={error} />}

      <div className="card">
        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label fw-600">Classroom</label>
              <select className="form-select" value={filters.classroom}
                onChange={(e) => setFilters((f) => ({ ...f, classroom: e.target.value }))}>
                <option value="">— All Classrooms —</option>
                {classrooms?.map((c) => <option key={c.id} value={c.id}>{c.stream_display}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-600">Date</label>
              <input type="date" className="form-control" value={filters.date}
                onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              {records?.length > 0 && (
                <ExportCSV data={records} columns={exportColumns} filename={`attendance_${filters.date}.csv`} />
              )}
            </div>
          </div>

          {summary?.total > 0 && (
            <div className="d-flex gap-3 mb-3 flex-wrap">
              {["present", "absent", "late", "sick"].map((s) => (
                <span key={s} className={`badge bg-${STATUS_COLORS[s]} px-3 py-2`}>
                  {summary[s] || 0} {s}
                </span>
              ))}
              <span className="badge bg-secondary px-3 py-2">{summary.total} total</span>
            </div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : records?.length ? (
            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle">
                <thead className="table-light">
                  <tr><th>Student</th><th>Adm No</th><th>Class</th><th>Date</th><th>Status</th><th>Remarks</th><th>By</th></tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="fw-600">{r.student_name}</td>
                      <td><code style={{ fontSize: 12 }}>{r.admission_number}</code></td>
                      <td>{r.classroom_display}</td>
                      <td style={{ fontSize: 12 }}>{formatDate(r.date)}</td>
                      <td>
                        <span className={`badge bg-${STATUS_COLORS[r.status] || "secondary"} text-capitalize`}>{r.status}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "#899bbd" }}>{r.remarks || "—"}</td>
                      <td style={{ fontSize: 12 }}>{r.recorded_by_name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No attendance records for this date/class." icon="bi-calendar-x" />
          )}
        </div>
      </div>
    </>
  );
}

export function AttendanceReport() {
  const [classroomId, setClassroomId] = useState("");
  const { data: classrooms } = useFetch(() => getClassrooms());
  const { data: records, loading, error } = useFetch(
    () => classroomId ? getAttendance({ classroom: classroomId }) : Promise.resolve({ data: [] }),
    [classroomId]
  );

  const summary = records?.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; acc.total++; return acc; },
    { total: 0 }
  );

  return (
    <>
      <PageTitle title="Attendance Report" breadcrumbs={[{ label: "Attendance" }, { label: "Report" }]} />
      {error && <AlertMessage type="danger" message={error} />}

      <div className="card">
        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label fw-600">Select Classroom</label>
              <select className="form-select" value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}>
                <option value="">— Select Classroom —</option>
                {classrooms?.map((c) => <option key={c.id} value={c.id}>{c.stream_display} – {c.academic_year_display}</option>)}
              </select>
            </div>
          </div>

          {loading && <LoadingSpinner />}

          {!loading && summary?.total > 0 && (
            <div className="row mb-4">
              <div className="col-md-4">
                <AttendanceDonut
                  present={summary.present || 0}
                  absent={summary.absent || 0}
                  late={summary.late || 0}
                  sick={summary.sick || 0}
                />
              </div>
              <div className="col-md-8">
                <div className="table-responsive" style={{ maxHeight: 400, overflowY: "auto" }}>
                  <table className="table table-sm table-hover table-bordered align-middle">
                    <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                      <tr><th>Student</th><th>Date</th><th>Status</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.id}>
                          <td className="fw-600">{r.student_name}</td>
                          <td style={{ fontSize: 12 }}>{formatDate(r.date)}</td>
                          <td>
                            <span className={`badge bg-${STATUS_COLORS[r.status] || "secondary"} text-capitalize`}>{r.status}</span>
                          </td>
                          <td style={{ fontSize: 12, color: "#899bbd" }}>{r.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && classroomId && !records?.length && (
            <EmptyState message="No attendance records for this classroom." />
          )}
        </div>
      </div>
    </>
  );
}

export default AttendanceList;