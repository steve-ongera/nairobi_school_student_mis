import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../../utils/api";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { PageTitle, StatCard, LoadingSpinner, AlertMessage } from "../../components/common";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error) return <AlertMessage type="danger" message={error} />;
  if (!data) return null;

  const {
    active_students, total_teachers, total_classrooms, collection_rate,
    total_fees_expected, total_fees_collected, total_fees_outstanding,
    current_academic_year, current_term, recent_payments, students_per_form,
  } = data;

  const COLORS = ["#4154f1", "#2eca6a", "#ff771d", "#4154f1"];

  return (
    <section className="dashboard">
      <PageTitle
        title="Admin Dashboard"
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* Info strip */}
      {current_academic_year && (
        <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-center gap-3">
          <i className="bi bi-calendar3" />
          <span>
            <strong>{current_academic_year.year}</strong> –{" "}
            {current_term ? `Term ${current_term.term_number}` : "No active term"}
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div className="row">
        <div className="col-xxl-3 col-md-6">
          <StatCard
            title="Active Students"
            value={active_students}
            icon="bi-person-check"
            color="primary"
            subtitle="Enrolled this year"
          />
        </div>
        <div className="col-xxl-3 col-md-6">
          <StatCard
            title="Teachers"
            value={total_teachers}
            icon="bi-person-badge"
            color="success"
            subtitle="Active staff members"
          />
        </div>
        <div className="col-xxl-3 col-md-6">
          <StatCard
            title="Classrooms"
            value={total_classrooms}
            icon="bi-buildings"
            color="warning"
            subtitle="This academic year"
          />
        </div>
        <div className="col-xxl-3 col-md-6">
          <StatCard
            title="Fee Collection"
            value={`${parseFloat(collection_rate || 0).toFixed(1)}%`}
            icon="bi-cash-coin"
            color={parseFloat(collection_rate) >= 80 ? "success" : "danger"}
            subtitle="Collection rate this term"
          />
        </div>
      </div>

      {/* Fee Summary + Students per Form */}
      <div className="row">
        {/* Fee Summary */}
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                Fee Summary <span>– {current_term ? `Term ${current_term.term_number}` : "All"}</span>
              </h5>
              <div className="d-flex flex-column gap-3 mt-2">
                {[
                  { label: "Expected", value: total_fees_expected, color: "primary" },
                  { label: "Collected", value: total_fees_collected, color: "success" },
                  { label: "Outstanding", value: total_fees_outstanding, color: "danger" },
                ].map((item) => (
                  <div key={item.label} className="d-flex justify-content-between align-items-center p-3 rounded"
                    style={{ background: "#f6f9ff" }}>
                    <span className="fw-600 text-primary-dark">{item.label}</span>
                    <span className={`fw-700 text-${item.color}`} style={{ fontSize: 18 }}>
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Collection Progress</small>
                  <small>{parseFloat(collection_rate || 0).toFixed(1)}%</small>
                </div>
                <div className="progress" style={{ height: 8 }}>
                  <div
                    className={`progress-bar bg-${parseFloat(collection_rate) >= 80 ? "success" : "warning"}`}
                    style={{ width: `${Math.min(parseFloat(collection_rate || 0), 100)}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 d-flex gap-2">
                <Link to="/admin/finance/invoices" className="btn btn-sm btn-primary">
                  <i className="bi bi-receipt me-1" /> Invoices
                </Link>
                <Link to="/admin/finance/payments" className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-cash me-1" /> Payments
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Students per Form */}
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Students per Form</h5>
              {students_per_form?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={students_per_form} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ebeef4" />
                    <XAxis dataKey="form" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
                    />
                    <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                      {students_per_form.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-center py-4">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="row">
        <div className="col-12">
          <div className="card recent-sales">
            <div className="card-body">
              <h5 className="card-title">Recent Payments <span>– Last 10</span></h5>
              {recent_payments?.length ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Student</th>
                        <th>Reference</th>
                        <th>Method</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent_payments.map((p, i) => (
                        <tr key={p.id}>
                          <td>{i + 1}</td>
                          <td>
                            <Link to={`/admin/students/${p.invoice?.student}`}>
                              {p.invoice?.student_name || "—"}
                            </Link>
                          </td>
                          <td>
                            <code style={{ fontSize: 12 }}>{p.transaction_reference || "—"}</code>
                          </td>
                          <td>
                            <span className="badge bg-info text-uppercase">
                              {p.payment_method}
                            </span>
                          </td>
                          <td className="fw-700 text-success">{formatCurrency(p.amount)}</td>
                          <td style={{ fontSize: 12 }}>{formatDateTime(p.payment_date)}</td>
                          <td>
                            <span className={`badge bg-${p.confirmed ? "success" : "warning"}`}>
                              {p.confirmed ? "Confirmed" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center py-3">No recent payments</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Quick Actions</h5>
              <div className="d-flex flex-wrap gap-2">
                {[
                  { to: "/admin/students/new", icon: "bi-person-plus", label: "Admit Student" },
                  { to: "/admin/exams/new", icon: "bi-journal-plus", label: "Create Exam" },
                  { to: "/admin/finance/invoices/generate", icon: "bi-receipt", label: "Generate Invoices" },
                  { to: "/admin/students/promote", icon: "bi-arrow-up-circle", label: "Promote Students" },
                  { to: "/admin/teachers/new", icon: "bi-person-badge", label: "Add Teacher" },
                  { to: "/admin/settings/grading", icon: "bi-gear", label: "Grading Scale" },
                ].map((a) => (
                  <Link key={a.to} to={a.to} className="btn btn-outline-primary">
                    <i className={`bi ${a.icon} me-2`} />
                    {a.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}