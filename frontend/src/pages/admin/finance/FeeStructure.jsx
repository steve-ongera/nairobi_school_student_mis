import { useState } from "react";
import { getFeeStructures, createFeeStructure, deleteFeeStructure, getTerms } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatCurrency } from "../../../utils/formatters";
import {
  PageTitle, DataTable, AlertMessage, StatusBadge, ConfirmDialog,
} from "../../../components/common";

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