import { useState } from "react";
import { getInvoices, getPayments, getTerms } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatCurrency } from "../../../utils/formatters";
import { PageTitle, AlertMessage, LoadingSpinner } from "../../../components/common";
import { FeePaymentChart } from "../../../components/charts/Charts";
import { ExportCSV } from "../../../components/common/Extras";

export default function FinanceReports() {
  const [termId, setTermId] = useState("");
  const { data: terms } = useFetch(() => getTerms());
  const { data: invoices, loading: iLoading } = useFetch(
    () => getInvoices(termId ? { term: termId } : {}),
    [termId]
  );
  const { data: payments, loading: pLoading } = useFetch(() => getPayments());

  const loading = iLoading || pLoading;

  const arrears = invoices?.filter((inv) => parseFloat(inv.balance) > 0)
    .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance)) || [];

  const totals = invoices?.reduce(
    (acc, inv) => ({
      expected: acc.expected + parseFloat(inv.total_amount || 0),
      collected: acc.collected + parseFloat(inv.amount_paid || 0),
      outstanding: acc.outstanding + parseFloat(inv.balance || 0),
    }),
    { expected: 0, collected: 0, outstanding: 0 }
  );

  const arrearColumns = [
    { key: "student_name", label: "Student" },
    { key: "admission_number", label: "Adm No" },
    { key: "term_display", label: "Term" },
    { key: "total_amount", label: "Total Charged" },
    { key: "amount_paid", label: "Paid" },
    { key: "balance", label: "Balance" },
  ];

  return (
    <>
      <PageTitle title="Finance Reports" breadcrumbs={[{ label: "Finance" }, { label: "Reports" }]} />

      <div className="card">
        <div className="card-body">
          <div className="row g-3 mb-0">
            <div className="col-md-4">
              <label className="form-label fw-600">Filter by Term</label>
              <select className="form-select" value={termId} onChange={(e) => setTermId(e.target.value)}>
                <option value="">— All Terms —</option>
                {terms?.map((t) => (
                  <option key={t.id} value={t.id}>{t.academic_year_display} – Term {t.term_number}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && totals && (
        <>
          <div className="row">
            {[
              { label: "Total Expected", value: totals.expected, color: "primary", icon: "bi-receipt" },
              { label: "Total Collected", value: totals.collected, color: "success", icon: "bi-cash-coin" },
              { label: "Total Outstanding", value: totals.outstanding, color: "danger", icon: "bi-exclamation-circle" },
              {
                label: "Collection Rate",
                value: totals.expected > 0 ? `${((totals.collected / totals.expected) * 100).toFixed(1)}%` : "0%",
                color: totals.collected / totals.expected >= 0.8 ? "success" : "warning",
                icon: "bi-percent",
              },
            ].map((item) => (
              <div key={item.label} className="col-md-3">
                <div className="card info-card">
                  <div className="card-body">
                    <h5 className="card-title">{item.label}</h5>
                    <div className="d-flex align-items-center">
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          background: item.color === "success" ? "#e0f8e9" : item.color === "danger" ? "#fde8e8" : "#f6f6fe",
                          color: item.color === "success" ? "#2eca6a" : item.color === "danger" ? "#dc3545" : "#4154f1",
                        }}>
                        <i className={`bi ${item.icon}`} />
                      </div>
                      <div className="ps-3">
                        <h6 className={`text-${item.color}`}>
                          {typeof item.value === "number" ? formatCurrency(item.value) : item.value}
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {payments?.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Payment Trend</h5>
                <FeePaymentChart payments={payments} />
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">
                  Arrears Report
                  <span className="badge bg-danger ms-2">{arrears.length}</span>
                </h5>
                <ExportCSV data={arrears} columns={arrearColumns} filename="arrears_report.csv" />
              </div>
              {arrears.length ? (
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle">
                    <thead className="table-light">
                      <tr><th>Student</th><th>Adm No</th><th>Term</th><th>Charged</th><th>Paid</th><th>Balance</th></tr>
                    </thead>
                    <tbody>
                      {arrears.map((inv) => (
                        <tr key={inv.id}>
                          <td className="fw-600">{inv.student_name}</td>
                          <td><code style={{ fontSize: 12 }}>{inv.admission_number}</code></td>
                          <td>{inv.term_display}</td>
                          <td>{formatCurrency(inv.total_amount)}</td>
                          <td className="text-success">{formatCurrency(inv.amount_paid)}</td>
                          <td className="fw-700 text-danger">{formatCurrency(inv.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-check-circle text-success" style={{ fontSize: 36 }} />
                  <p className="text-muted mt-2">No arrears found for this period.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}