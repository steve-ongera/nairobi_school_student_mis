import { useState } from "react";
import { getInvoices, getPayments, createPayment } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDateTime, formatCurrency } from "../../../utils/formatters";
import {
  PageTitle, DataTable, AlertMessage, SearchBar, StatusBadge, EmptyState, ConfirmDialog,
} from "../../../components/common";

export function PaymentList() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    invoice: "", amount: "", payment_method: "cash", transaction_reference: "", payment_date: new Date().toISOString().slice(0, 10),
  });
  const [addMsg, setAddMsg] = useState({ type: "", text: "" });
  const { data: invoices } = useFetch(() => getInvoices());
  const { data: payments, loading, error, refetch } = useFetch(
    () => getPayments(search ? { search } : {}),
    [search]
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createPayment({ ...addForm, amount: parseFloat(addForm.amount), invoice: parseInt(addForm.invoice) });
      setAddMsg({ type: "success", text: "Payment recorded." });
      refetch();
      setShowAdd(false);
    } catch (err) {
      setAddMsg({ type: "danger", text: err.response?.data?.detail || "Failed to record payment." });
    }
  };

  const columns = [
    { header: "Date", render: (p) => <span style={{ fontSize: 12 }}>{formatDateTime(p.payment_date)}</span> },
    { header: "Student", render: (p) => p.invoice?.student_name || "—" },
    { header: "Reference", render: (p) => <code style={{ fontSize: 11 }}>{p.transaction_reference || "—"}</code> },
    { header: "Method", render: (p) => <span className="badge bg-info text-uppercase">{p.payment_method}</span> },
    { header: "Amount", render: (p) => <strong className="text-success">{formatCurrency(p.amount)}</strong> },
    { header: "Received By", render: (p) => p.received_by_name || "—" },
    { header: "Status", render: (p) => (
      <span className={`badge bg-${p.confirmed ? "success" : "warning"}`}>
        {p.confirmed ? "Confirmed" : "Pending"}
      </span>
    )},
  ];

  return (
    <>
      <PageTitle title="Payments" breadcrumbs={[{ label: "Finance" }, { label: "Payments" }]} />
      <AlertMessage type={addMsg.type} message={addMsg.text} onClose={() => setAddMsg({ type: "", text: "" })} />

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h5 className="card-title mb-0">All Payments</h5>
            <div className="d-flex gap-2">
              <SearchBar value={search} onChange={setSearch} placeholder="Search reference…" />
              <button className="btn btn-primary" onClick={() => setShowAdd((s) => !s)}>
                <i className="bi bi-plus-circle me-1" /> Record Payment
              </button>
            </div>
          </div>

          {showAdd && (
            <div className="p-3 mb-3 rounded" style={{ background: "#f6f9ff", border: "1px solid #ebeef4" }}>
              <h6 className="mb-3 text-primary-dark">Record Manual Payment</h6>
              <form onSubmit={handleAdd} className="row g-2">
                <div className="col-md-3">
                  <select className="form-select form-select-sm" value={addForm.invoice}
                    onChange={(e) => setAddForm((f) => ({ ...f, invoice: e.target.value }))} required>
                    <option value="">— Invoice —</option>
                    {invoices?.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.student_name} – {inv.term_display}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <input type="number" className="form-control form-control-sm" placeholder="Amount (KES)"
                    value={addForm.amount} onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div className="col-md-2">
                  <select className="form-select form-select-sm" value={addForm.payment_method}
                    onChange={(e) => setAddForm((f) => ({ ...f, payment_method: e.target.value }))}>
                    {["cash", "mpesa", "bank", "cheque"].map((m) => (
                      <option key={m} value={m}>{m.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Reference"
                    value={addForm.transaction_reference}
                    onChange={(e) => setAddForm((f) => ({ ...f, transaction_reference: e.target.value }))} />
                </div>
                <div className="col-md-2">
                  <input type="date" className="form-control form-control-sm" value={addForm.payment_date}
                    onChange={(e) => setAddForm((f) => ({ ...f, payment_date: e.target.value }))} />
                </div>
                <div className="col-md-1">
                  <button type="submit" className="btn btn-success btn-sm w-100">Save</button>
                </div>
              </form>
            </div>
          )}

          {error && <AlertMessage type="danger" message={error} />}
          <DataTable columns={columns} data={payments} loading={loading} emptyMessage="No payments." />
        </div>
      </div>
    </>
  );
}