import { useState } from "react";
import { getMpesaTransactions } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDateTime, formatCurrency } from "../../../utils/formatters";
import {
  PageTitle, DataTable, AlertMessage, SearchBar,
} from "../../../components/common";

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