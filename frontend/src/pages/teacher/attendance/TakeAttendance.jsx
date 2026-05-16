import { useState, useEffect } from "react";
import { getClassrooms, getClassroomStudents, submitBulkAttendance } from "../../../utils/api";
import { PageTitle, AlertMessage, LoadingSpinner } from "../../../components/common";

// Helper: unwrap DRF paginated or plain array responses
const unwrap = (res) => res?.data?.results ?? res?.data ?? [];

const STATUSES = [
  { value: "present", label: "Present", color: "success" },
  { value: "absent", label: "Absent", color: "danger" },
  { value: "late", label: "Late", color: "warning" },
  { value: "sick", label: "Sick", color: "info" },
];

export default function TakeAttendance() {
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Load classrooms on mount
  useEffect(() => {
    getClassrooms()
      .then((r) => setClassrooms(unwrap(r)))
      .catch(() => setFetchError("Failed to load classrooms. Please refresh."));
  }, []);

  // Load students when classroom changes
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setAttendance({});
      return;
    }
    setStudentsLoading(true);
    getClassroomStudents(selectedClass)
      .then((r) => {
        const list = unwrap(r);
        setStudents(list);
        const init = {};
        list.forEach((s) => {
          init[s.id] = { status: "present", remarks: "" };
        });
        setAttendance(init);
      })
      .catch(() => setMsg({ type: "danger", text: "Failed to load students." }))
      .finally(() => setStudentsLoading(false));
  }, [selectedClass]);

  const setStatus = (studentId, field, value) => {
    setAttendance((a) => ({
      ...a,
      [studentId]: { ...a[studentId], [field]: value },
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.id] = { status, remarks: "" };
    });
    setAttendance(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const records = students.map((s) => ({
        student: s.id,
        status: attendance[s.id]?.status || "present",
        remarks: attendance[s.id]?.remarks || "",
      }));
      const { data } = await submitBulkAttendance({
        classroom: parseInt(selectedClass),
        date,
        records,
      });
      setMsg({
        type: "success",
        text: `Attendance saved: ${data.created} new, ${data.updated} updated.`,
      });
    } catch (err) {
      setMsg({
        type: "danger",
        text: err.response?.data?.detail || "Failed to save attendance.",
      });
    } finally {
      setLoading(false);
    }
  };

  const counts = students.reduce((acc, s) => {
    const status = attendance[s.id]?.status || "present";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageTitle
        title="Take Attendance"
        breadcrumbs={[{ label: "Attendance" }]}
      />

      {fetchError && <AlertMessage type="danger" message={fetchError} />}
      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Select Class & Date</h5>
          <div className="row g-3 mb-4">
            <div className="col-md-5">
              <label className="form-label fw-600">Classroom</label>
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">— Select classroom —</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.stream_display} – {c.academic_year_display}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-600">Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {studentsLoading && <LoadingSpinner message="Loading students…" />}

          {!studentsLoading && !selectedClass && (
            <div className="text-center text-muted py-4">
              <i className="bi bi-people" style={{ fontSize: 36 }} />
              <p className="mt-2 mb-0">Select a classroom above to begin.</p>
            </div>
          )}

          {!studentsLoading && selectedClass && students.length === 0 && (
            <div className="text-center text-muted py-4">
              <i className="bi bi-person-x" style={{ fontSize: 36 }} />
              <p className="mt-2 mb-0">No students found in this classroom.</p>
            </div>
          )}

          {!studentsLoading && students.length > 0 && (
            <form onSubmit={handleSubmit}>
              {/* Quick mark all */}
              <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
                <span className="text-muted small me-1">Mark all:</span>
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`btn btn-sm btn-outline-${s.color}`}
                    onClick={() => markAll(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Count badges */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                {STATUSES.map((s) => (
                  <span
                    key={s.value}
                    className={`badge bg-${s.color} px-3 py-2`}
                  >
                    {counts[s.value] || 0} {s.label}
                  </span>
                ))}
              </div>

              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Adm No</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const status = attendance[s.id]?.status || "present";
                      return (
                        <tr
                          key={s.id}
                          style={{
                            background:
                              status === "absent"
                                ? "#fff5f5"
                                : status === "late"
                                ? "#fffdf0"
                                : status === "sick"
                                ? "#f0f9ff"
                                : "transparent",
                          }}
                        >
                          <td className="text-muted">{i + 1}</td>
                          <td>
                            <code>{s.admission_number}</code>
                          </td>
                          <td className="fw-600">{s.full_name}</td>
                          <td>
                            <div className="d-flex gap-1 flex-wrap">
                              {STATUSES.map((st) => (
                                <button
                                  key={st.value}
                                  type="button"
                                  className={`btn btn-sm ${
                                    status === st.value
                                      ? `btn-${st.color}`
                                      : `btn-outline-${st.color}`
                                  }`}
                                  onClick={() =>
                                    setStatus(s.id, "status", st.value)
                                  }
                                  style={{ fontSize: 11, padding: "2px 8px" }}
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Optional"
                              value={attendance[s.id]?.remarks || ""}
                              onChange={(e) =>
                                setStatus(s.id, "remarks", e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="submit"
                className="btn btn-primary mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving…
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-all me-2" />
                    Save Attendance for {students.length} Students
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}