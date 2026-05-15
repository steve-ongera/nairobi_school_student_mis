// pages/admin/students/StudentDetail.jsx
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageTitle } from "../../../components/common/PageTitle";
import { LoadingSpinner, AlertMessage, Badge } from "../../../components/common/DataTable";
import useFetch from "../../../hooks/useFetch";
import { studentsAPI } from "../../../utils/api";
import { formatDate, formatCurrency, gradeColor, statusColor, formatPhone } from "../../../utils/formatters";

export default function StudentDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState("overview");

  const { data: student, loading, error } = useFetch(() => studentsAPI.getStudent(id), [id]);
  const { data: feeStatement } = useFetch(() => studentsAPI.getFeeStatement(id), [id]);
  const { data: classHistory } = useFetch(() => studentsAPI.getClassHistory(id), [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="danger" message={error} />;
  if (!student) return null;

  const invoices = feeStatement?.invoices || [];
  const history = classHistory || [];

  return (
    <section>
      <PageTitle
        title="Student Profile"
        breadcrumbs={[{ label: "Students", to: "/admin/students" }, { label: student.admission_number }]}
      />

      <div className="row">
        {/* ── Left: Profile card ── */}
        <div className="col-xl-4">
          <div className="card text-center">
            <div className="card-body py-4">
              <div
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "linear-gradient(135deg,#4154f1,#012970)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px", color: "#fff", fontSize: 32, fontWeight: 800, fontFamily: "Nunito",
                }}
              >
                {student.user?.first_name?.[0]}{student.user?.last_name?.[0]}
              </div>
              <h5 className="mb-0" style={{ color: "#012970", fontFamily: "Nunito", fontWeight: 700 }}>
                {student.full_name}
              </h5>
              <p className="text-muted small mb-2">{student.admission_number}</p>
              <span className={`badge bg-${statusColor(student.status)} rounded-pill px-3`}>{student.status}</span>

              <div className="mt-3 pt-3 border-top">
                {[
                  { icon: "bi-building", label: student.current_classroom_display || "—" },
                  { icon: "bi-envelope", label: student.email },
                  { icon: "bi-person", label: student.gender === "M" ? "Male" : student.gender === "F" ? "Female" : "—" },
                  { icon: "bi-house", label: student.boarding_status === "boarder" ? `Boarder – ${student.dormitory || "Dorm TBD"}` : "Day Scholar" },
                ].map((item, i) => (
                  <div key={i} className="d-flex align-items-center gap-2 mb-2 text-start">
                    <i className={`bi ${item.icon} text-primary`} style={{ width: 18 }} />
                    <span className="small text-muted">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 d-flex gap-2 justify-content-center">
                <Link to={`/admin/students/${id}/edit`} className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-pencil me-1" />Edit
                </Link>
                <Link to={`/admin/exams/reports?student=${id}`} className="btn btn-sm btn-outline-success">
                  <i className="bi bi-file-text me-1" />Report Card
                </Link>
              </div>
            </div>
          </div>

          {/* Fee Balance summary */}
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">Fee Balance</h6>
              <div className="d-flex justify-content-between">
                <span className="small text-muted">Total Outstanding</span>
                <span className={`fw-bold ${Number(student.fee_balance) > 0 ? "text-danger" : "text-success"}`}>
                  {formatCurrency(student.fee_balance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Tabs ── */}
        <div className="col-xl-8">
          <div className="card">
            <div className="card-body pt-3">
              <ul className="nav nav-tabs nav-tabs-bordered">
                {["overview", "fees", "history"].map((t) => (
                  <li className="nav-item" key={t}>
                    <button
                      className={`nav-link${tab === t ? " active" : ""}`}
                      onClick={() => setTab(t)}
                    >
                      {t === "overview" ? "Overview" : t === "fees" ? "Fee Statement" : "Class History"}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Overview tab */}
              {tab === "overview" && (
                <div className="tab-content pt-3">
                  <h6 className="text-primary mb-3" style={{ fontFamily: "Poppins" }}>Personal Information</h6>
                  <div className="row">
                    {[
                      ["Date of Birth", formatDate(student.date_of_birth)],
                      ["Nationality", student.nationality],
                      ["National ID", student.national_id || "—"],
                      ["Birth Certificate", student.birth_certificate_number || "—"],
                      ["Blood Group", student.blood_group || "—"],
                      ["KCPE Index", student.kcpe_index_number || "—"],
                      ["KCPE Marks", student.kcpe_marks ? `${student.kcpe_marks}/500` : "—"],
                      ["Admission Date", formatDate(student.admission_date)],
                    ].map(([label, value]) => (
                      <div className="col-sm-6 mb-3" key={label}>
                        <label className="small text-muted d-block" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
                        <span className="fw-semibold" style={{ color: "#2c384e" }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {student.parent && (
                    <>
                      <hr />
                      <h6 className="text-primary mb-3" style={{ fontFamily: "Poppins" }}>Parent / Guardian</h6>
                      <div className="row">
                        {[
                          ["Name", student.parent.full_name],
                          ["Relationship", student.parent.relationship],
                          ["Phone", formatPhone(student.parent.user?.phone)],
                          ["Email", student.parent.user?.email],
                        ].map(([label, value]) => (
                          <div className="col-sm-6 mb-3" key={label}>
                            <label className="small text-muted d-block" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
                            <span className="fw-semibold" style={{ color: "#2c384e" }}>{value || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {student.medical_conditions && (
                    <>
                      <hr />
                      <h6 className="text-primary mb-2" style={{ fontFamily: "Poppins" }}>Medical Notes</h6>
                      <p className="small text-muted">{student.medical_conditions}</p>
                    </>
                  )}
                </div>
              )}

              {/* Fee Statement tab */}
              {tab === "fees" && (
                <div className="pt-3">
                  <div className="row text-center mb-4">
                    {[
                      { label: "Total Invoiced", val: feeStatement?.total_charged, color: "primary" },
                      { label: "Total Paid", val: feeStatement?.total_paid, color: "success" },
                      { label: "Balance", val: feeStatement?.total_balance, color: "danger" },
                    ].map((item) => (
                      <div className="col-4" key={item.label}>
                        <div className={`text-${item.color} fw-bold`} style={{ fontSize: 18, fontFamily: "Nunito" }}>
                          {formatCurrency(item.val)}
                        </div>
                        <div className="text-muted small">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover mis-table">
                      <thead>
                        <tr><th>Term</th><th>Invoiced</th><th>Paid</th><th>Balance</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr key={inv.id}>
                            <td style={{ fontSize: 13 }}>{inv.term_display}</td>
                            <td>{formatCurrency(inv.total_amount)}</td>
                            <td className="text-success">{formatCurrency(inv.amount_paid)}</td>
                            <td className="text-danger">{formatCurrency(inv.balance)}</td>
                            <td><span className={`badge bg-${statusColor(inv.status)}`}>{inv.status}</span></td>
                          </tr>
                        ))}
                        {invoices.length === 0 && (
                          <tr><td colSpan={5} className="text-center text-muted py-3">No invoices found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Class History tab */}
              {tab === "history" && (
                <div className="pt-3">
                  <div className="table-responsive">
                    <table className="table mis-table">
                      <thead>
                        <tr><th>Academic Year</th><th>Term</th><th>Classroom</th><th>Enrolled</th><th>Notes</th></tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.id}>
                            <td>{h.academic_year_display}</td>
                            <td>{h.term_display || "—"}</td>
                            <td><span className="badge bg-primary-light text-primary">{h.classroom_display}</span></td>
                            <td style={{ fontSize: 12 }}>{formatDate(h.date_enrolled)}</td>
                            <td style={{ fontSize: 12 }}>{h.notes || "—"}</td>
                          </tr>
                        ))}
                        {history.length === 0 && (
                          <tr><td colSpan={5} className="text-center text-muted py-3">No history records</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}