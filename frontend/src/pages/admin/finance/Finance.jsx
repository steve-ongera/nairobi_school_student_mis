import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getInvoices, getPayments, getFeeStructures, getMpesaTransactions,
  createPayment, generateInvoicesForClassroom, createFeeStructure, deleteFeeStructure,
  getClassrooms, getTerms,
} from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatCurrency, formatDateTime, formatDate } from "../../../utils/formatters";
import {
  PageTitle, DataTable, AlertMessage, SearchBar, StatusBadge, EmptyState, ConfirmDialog,
} from "../../../components/common";

// ── Invoice List ─────────────────────────────────────────────────────────────
export function InvoiceList() {
  const [search, setSearch] = useState("");
  const [genMsg, setGenMsg] = useState({ type: "", text: "" });
  const [showGen, setShowGen] = useState(false);
  const [genForm, setGenForm] = useState({ classroom: "", term: "" });
  const [genLoading, setGenLoading] = useState(false);
  const { data: classrooms } = useFetch(() => getClassrooms());
  const { data: terms } = useFetch(() => getTerms());
  const { data: invoices, loading, error, refetch } = useFetch(
    () => getInvoices(search ? { search } : {}),
    [search]
  );

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenLoading(true);
    try {
      const { data } = await generateInvoicesForClassroom({
        classroom: parseInt(genForm.classroom),
        term: parseInt(genForm.term),
      });
      setGenMsg({ type: "success", text: data.detail });
      setShowGen(false);
      refetch();
    } catch (err) {
      setGenMsg({ type: "danger", text: err.response?.data?.detail || "Failed to generate." });
    } finally {
      setGenLoading(false);
    }
  };

  const columns = [
    { header: "Student", render: (inv) =>
      <Link to={`/admin/students/${inv.student}`} className="fw-600">{inv.student_name}</Link> },
    { header: "Adm No", key: "admission_number" },
    { header: "Term", key: "term_display" },
    { header: "Total", render: (inv) => <strong>{formatCurrency(inv.total_amount)}</strong> },
    { header: "Paid", render: (inv) => <span className="text-success">{formatCurrency(inv.amount_paid)}</span> },
    { header: "Balance", render: (inv) => (
      <span className={parseFloat(inv.balance) > 0 ? "text-danger fw-700" : "text-success"}>
        {formatCurrency(inv.balance)}
      </span>
    )},
    { header: "Status", render: (inv) => <StatusBadge status={inv.status} /> },
  ];

  return (
    <>
      <PageTitle title="Invoices" breadcrumbs={[{ label: "Finance" }, { label: "Invoices" }]} />

      <AlertMessage type={genMsg.type} message={genMsg.text} onClose={() => setGenMsg({ type: "", text: "" })} />

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h5 className="card-title mb-0">All Invoices</h5>
            <div className="d-flex gap-2">
              <SearchBar value={search} onChange={setSearch} placeholder="Search student…" />
              <button className="btn btn-primary" onClick={() => setShowGen((s) => !s)}>
                <i className="bi bi-receipt me-1" /> Generate
              </button>
            </div>
          </div>

          {showGen && (
            <div className="p-3 mb-3 rounded" style={{ background: "#f6f9ff", border: "1px solid #ebeef4" }}>
              <h6 className="text-primary-dark mb-3">Generate Invoices for Classroom</h6>
              <form onSubmit={handleGenerate} className="row g-2">
                <div className="col-md-4">
                  <select
                    className="form-select form-select-sm"
                    value={genForm.classroom}
                    onChange={(e) => setGenForm((f) => ({ ...f, classroom: e.target.value }))}
                    required
                  >
                    <option value="">— Classroom —</option>
                    {classrooms?.map((c) => (
                      <option key={c.id} value={c.id}>{c.stream_display}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select form-select-sm"
                    value={genForm.term}
                    onChange={(e) => setGenForm((f) => ({ ...f, term: e.target.value }))}
                    required
                  >
                    <option value="">— Term —</option>
                    {terms?.map((t) => (
                      <option key={t.id} value={t.id}>{t.academic_year_display} – Term {t.term_number}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button type="submit" className="btn btn-success btn-sm w-100" disabled={genLoading}>
                    {genLoading ? <span className="spinner-border spinner-border-sm" /> : "Generate"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {error && <AlertMessage type="danger" message={error} />}
          <DataTable columns={columns} data={invoices} loading={loading} emptyMessage="No invoices found." />
        </div>
      </div>
    </>
  );
}

// ── Payment List ──────────────────────────────────────────────────────────────
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

// ── Fee Structure ─────────────────────────────────────────────────────────────
export function FeeStructurePage() {
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showForm, setShowForm] = useState(false);
  const [newFee, setNewFee] = useState({ form: "", term: "", category: "", amount: "", description: "", is_mandatory: true });
  const { data: fees, loading, error, refetch } = useFetch(() => getFeeStructures());
  const { data: terms } = useFetch(() => getTerms());

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createFeeStructure({ ...newFee, amount: parseFloat(newFee.amount) });
      setMsg({ type: "success", text: "Fee structure created." });
      refetch();
      setShowForm(false);
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.detail || "Failed to create." });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee item?")) return;
    try {
      await deleteFeeStructure(id);
      setMsg({ type: "success", text: "Deleted." });
      refetch();
    } catch {
      setMsg({ type: "danger", text: "Failed to delete." });
    }
  };

  const columns = [
    { header: "Form", key: "form_name" },
    { header: "Term", key: "term_display" },
    { header: "Category", key: "category" },
    { header: "Description", key: "description" },
    { header: "Amount", render: (f) => <strong>{formatCurrency(f.amount)}</strong> },
    { header: "Mandatory", render: (f) => (
      <span className={`badge bg-${f.is_mandatory ? "success" : "secondary"}`}>
        {f.is_mandatory ? "Yes" : "No"}
      </span>
    )},
    { header: "Actions", render: (f) => (
      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(f.id)}>
        <i className="bi bi-trash" />
      </button>
    )},
  ];

  return (
    <>
      <PageTitle title="Fee Structure" breadcrumbs={[{ label: "Finance" }, { label: "Fee Structure" }]} />
      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      {showForm && (
        <div className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">Add Fee Item</h5>
            <form onSubmit={handleCreate} className="row g-2">
              {[
                { label: "Form Level", key: "form", type: "number", placeholder: "1–4" },
                { label: "Category", key: "category", placeholder: "e.g. Tuition" },
                { label: "Description", key: "description", placeholder: "Optional" },
                { label: "Amount (KES)", key: "amount", type: "number" },
              ].map((field) => (
                <div key={field.key} className="col-md-2">
                  <label className="form-label small fw-600">{field.label}</label>
                  <input
                    type={field.type || "text"}
                    className="form-control form-control-sm"
                    placeholder={field.placeholder}
                    value={newFee[field.key]}
                    onChange={(e) => setNewFee((f) => ({ ...f, [field.key]: e.target.value }))}
                    required={field.key !== "description"}
                  />
                </div>
              ))}
              <div className="col-md-2">
                <label className="form-label small fw-600">Term</label>
                <select className="form-select form-select-sm" value={newFee.term}
                  onChange={(e) => setNewFee((f) => ({ ...f, term: e.target.value }))} required>
                  <option value="">— Term —</option>
                  {terms?.map((t) => (
                    <option key={t.id} value={t.id}>{t.academic_year_display} – T{t.term_number}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-1 d-flex align-items-end">
                <button type="submit" className="btn btn-success btn-sm w-100">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Fee Structure</h5>
            <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
              <i className="bi bi-plus-circle me-1" /> Add Fee Item
            </button>
          </div>
          {error && <AlertMessage type="danger" message={error} />}
          <DataTable columns={columns} data={fees} loading={loading} emptyMessage="No fee items configured." />
        </div>
      </div>
    </>
  );
}

// ── MPESA Reconciliation ──────────────────────────────────────────────────────
export function MpesaReconcile() {
  const [search, setSearch] = useState("");
  const { data: transactions, loading, error } = useFetch(
    () => getMpesaTransactions(search ? { search } : {}),
    [search]
  );

  const columns = [
    { header: "Date", render: (t) => <span style={{ fontSize: 12 }}>{formatDateTime(t.created_at)}</span> },
    { header: "Phone", key: "phone_number" },
    { header: "Account Ref", key: "account_reference" },
    { header: "Amount", render: (t) => <strong className="text-success">{formatCurrency(t.amount)}</strong> },
    { header: "Receipt", render: (t) => (
      <code style={{ fontSize: 11 }}>{t.mpesa_receipt_number || "—"}</code>
    )},
    { header: "Status", render: (t) => (
      <span className={`badge bg-${
        t.status === "completed" ? "success" : t.status === "failed" ? "danger" : "warning"
      }`}>
        {t.status}
      </span>
    )},
  ];

  return (
    <>
      <PageTitle title="MPESA Transactions" breadcrumbs={[{ label: "Finance" }, { label: "MPESA" }]} />

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h5 className="card-title mb-0">MPESA Transactions</h5>
            <SearchBar value={search} onChange={setSearch} placeholder="Search phone or receipt…" />
          </div>
          {error && <AlertMessage type="danger" message={error} />}
          <DataTable columns={columns} data={transactions} loading={loading} emptyMessage="No MPESA transactions." />
        </div>
      </div>
    </>
  );
}