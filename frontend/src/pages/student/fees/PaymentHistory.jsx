import { getMyPayments } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage, EmptyState } from "../../../components/common";

export default function PaymentHistory() {
  const { data: payments, loading, error } = useFetch(() => getMyPayments());

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageTitle
        title="Payment History"
        breadcrumbs={[{ label: "Fees" }, { label: "Payments" }]}
      />

      {error && <AlertMessage type="danger" message={error} />}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">All Payments</h5>

          {!payments?.length ? (
            <EmptyState message="No payments found." icon="bi-cash-coin" />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Term</th>
                      <th>Reference</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={p.id}>
                        <td>{i + 1}</td>
                        <td style={{ fontSize: 12 }}>{formatDateTime(p.payment_date)}</td>
                        <td style={{ fontSize: 12 }}>{p.invoice?.term_display || "—"}</td>
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
                  <tfoot>
                    <tr className="table-light">
                      <td colSpan={5} className="fw-700 text-end">Total Paid</td>
                      <td className="fw-700 text-success">
                        {formatCurrency(payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}