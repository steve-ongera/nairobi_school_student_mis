import { Link } from "react-router-dom";
import { getMyInvoices } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatCurrency, formatDate, formatDateTime } from "../../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage, StatusBadge } from "../../../components/common";

export default function FeeStatement() {
  const { data: invoices, loading, error } = useFetch(() => getMyInvoices());

  const totals = invoices?.reduce(
    (acc, inv) => ({
      charged: acc.charged + parseFloat(inv.total_amount || 0),
      paid: acc.paid + parseFloat(inv.amount_paid || 0),
      balance: acc.balance + parseFloat(inv.balance || 0),
    }),
    { charged: 0, paid: 0, balance: 0 }
  );

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageTitle
        title="Fee Statement"
        breadcrumbs={[{ label: "Fees" }, { label: "Statement" }]}
      />

      {error && <AlertMessage type="danger" message={error} />}

      {/* Summary */}
      {totals && (
        <div className="row mb-3">
          {[
            { label: "Total Charged", value: totals.charged, color: "primary", icon: "bi-receipt" },
            { label: "Total Paid", value: totals.paid, color: "success", icon: "bi-cash-coin" },
            {
              label: "Total Balance",
              value: totals.balance,
              color: totals.balance > 0 ? "danger" : "success",
              icon: "bi-wallet2",
            },
          ].map((item) => (
            <div key={item.label} className="col-md-4">
              <div className="card info-card">
                <div className="card-body">
                  <h5 className="card-title">{item.label}</h5>
                  <div className="d-flex align-items-center">
                    <div
                      className="card-icon rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor:
                          item.color === "success"
                            ? "#e0f8e9"
                            : item.color === "danger"
                            ? "#fde8e8"
                            : "#f6f6fe",
                        color:
                          item.color === "success"
                            ? "#2eca6a"
                            : item.color === "danger"
                            ? "#dc3545"
                            : "#4154f1",
                      }}
                    >
                      <i className={`bi ${item.icon}`} />
                    </div>
                    <div className="ps-3">
                      <h6 className={`text-${item.color}`}>{formatCurrency(item.value)}</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice list */}
      {invoices?.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-receipt" style={{ fontSize: 48, color: "#aab7cf" }} />
            <p className="mt-3 text-muted">No invoices found.</p>
          </div>
        </div>
      )}

      {invoices?.map((inv) => (
        <div key={inv.id} className="card mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
              <div>
                <h5 className="card-title mb-1">{inv.term_display}</h5>
                <small className="text-muted">Invoice #{inv.id}</small>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <StatusBadge status={inv.status} />
                <Link to="/student/fees/pay" className="btn btn-sm btn-primary">
                  <i className="bi bi-phone me-1" />Pay
                </Link>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">
                  Paid {formatCurrency(inv.amount_paid)} of {formatCurrency(inv.total_amount)}
                </small>
                <small>
                  {inv.total_amount > 0
                    ? Math.round((inv.amount_paid / inv.total_amount) * 100)
                    : 0}
                  %
                </small>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div
                  className="progress-bar bg-success"
                  style={{
                    width: `${
                      inv.total_amount > 0
                        ? Math.min((inv.amount_paid / inv.total_amount) * 100, 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="row text-center mb-3">
              {[
                { label: "Total Amount", value: formatCurrency(inv.total_amount) },
                { label: "Amount Paid", value: formatCurrency(inv.amount_paid), color: "success" },
                {
                  label: "Balance",
                  value: formatCurrency(inv.balance),
                  color: parseFloat(inv.balance) > 0 ? "danger" : "success",
                },
              ].map((item) => (
                <div key={item.label} className="col-4">
                  <div className={`fw-700 fs-6 ${item.color ? `text-${item.color}` : ""}`}>
                    {item.value}
                  </div>
                  <small className="text-muted">{item.label}</small>
                </div>
              ))}
            </div>

            {/* Payments */}
            {inv.payments?.length > 0 && (
              <>
                <h6 className="text-primary-dark mb-2">Payment History</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Reference</th>
                        <th>Method</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.payments.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontSize: 12 }}>{formatDateTime(p.payment_date)}</td>
                          <td>
                            <code style={{ fontSize: 11 }}>{p.transaction_reference || "—"}</code>
                          </td>
                          <td>
                            <span className="badge bg-info text-uppercase">{p.payment_method}</span>
                          </td>
                          <td className="fw-700 text-success">{formatCurrency(p.amount)}</td>
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
              </>
            )}
          </div>
        </div>
      ))}
    </>
  );
}