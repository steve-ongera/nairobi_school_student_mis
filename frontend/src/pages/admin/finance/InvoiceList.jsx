import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getInvoices, generateInvoicesForClassroom, getClassrooms, getTerms,
} from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatCurrency } from "../../../utils/formatters";
import {
  PageTitle, DataTable, AlertMessage, SearchBar, StatusBadge, ConfirmDialog,
} from "../../../components/common";

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