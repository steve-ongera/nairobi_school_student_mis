import { useState } from "react";
import { getSubjects } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, DataTable, AlertMessage } from "../../../components/common";

export function SubjectList() {
  const { data: subjects, loading, error } = useFetch(() => getSubjects());

  const columns = [
    { header: "Code", render: (s) => <code>{s.code || "—"}</code> },
    { header: "Name", render: (s) => <strong>{s.name}</strong> },
    { header: "Type", render: (s) => (
      <span className="badge bg-info">{s.subject_type}</span>
    )},
    { header: "Forms", render: (s) => (
      <div className="d-flex gap-1 flex-wrap">
        {s.applicable_forms?.map((f) => (
          <span key={f.id} className="badge bg-secondary">{f.name}</span>
        )) || "—"}
      </div>
    )},
    { header: "Status", render: (s) => (
      <span className={`badge bg-${s.is_active ? "success" : "secondary"}`}>
        {s.is_active ? "Active" : "Inactive"}
      </span>
    )},
  ];

  return (
    <>
      <PageTitle title="Subjects" breadcrumbs={[{ label: "Academics" }, { label: "Subjects" }]} />
      {error && <AlertMessage type="danger" message={error} />}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">All Subjects</h5>
          <DataTable columns={columns} data={subjects} loading={loading} emptyMessage="No subjects configured." />
        </div>
      </div>
    </>
  );
}