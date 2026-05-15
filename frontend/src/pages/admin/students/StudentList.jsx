// pages/admin/students/StudentList.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageTitle } from "../../../components/common/PageTitle";
import { DataTable, LoadingSpinner, AlertMessage, ConfirmDialog } from "../../../components/common/DataTable";
import useFetch from "../../../hooks/useFetch";
import { studentsAPI, academicsAPI } from "../../../utils/api";
import { formatDate, statusColor } from "../../../utils/formatters";

export default function StudentList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ status: "", form: "", search: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [msg, setMsg] = useState(null);

  const { data: formsData } = useFetch(() => academicsAPI.getForms(), []);
  const { data, loading, error, refetch } = useFetch(
    () => studentsAPI.getStudents({ status: filters.status, "current_classroom__stream__form": filters.form }),
    [filters.status, filters.form]
  );

  const students = data?.results || data || [];
  const forms = formsData || [];

  const handleDelete = async () => {
    try {
      await studentsAPI.deleteStudent(deleteTarget.id);
      setMsg({ type: "success", text: `Student ${deleteTarget.admission_number} deleted.` });
      refetch();
    } catch {
      setMsg({ type: "danger", text: "Failed to delete student." });
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: "admission_number", label: "Adm No" },
    { key: "full_name", label: "Full Name", render: (v, row) => (
      <Link to={`/admin/students/${row.id}`} className="fw-semibold text-primary">{v}</Link>
    )},
    { key: "email", label: "Email", render: (v) => <small className="text-muted">{v}</small> },
    { key: "current_classroom_display", label: "Class" },
    { key: "gender", label: "Gender", render: (v) => v === "M" ? "Male" : v === "F" ? "Female" : "—" },
    { key: "boarding_status", label: "Type", render: (v) => (
      <span className={`badge ${v === "boarder" ? "bg-primary" : "bg-secondary"}`}>
        {v === "boarder" ? "Boarder" : "Day"}
      </span>
    )},
    { key: "status", label: "Status", render: (v) => (
      <span className={`badge bg-${statusColor(v)}`}>{v}</span>
    )},
    { key: "admission_date", label: "Admitted", render: (v) => formatDate(v) },
  ];

  return (
    <section>
      <PageTitle title="Students" breadcrumbs={[{ label: "Students" }]} />

      {msg && <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      {/* Filters + Add button */}
      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div className="d-flex flex-wrap gap-2 align-items-end">
              <div>
                <label className="form-label small text-muted mb-1">Status</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="transferred">Transferred</option>
                  <option value="completed">Completed</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="form-label small text-muted mb-1">Form</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.form}
                  onChange={(e) => setFilters((f) => ({ ...f, form: e.target.value }))}
                >
                  <option value="">All Forms</option>
                  {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setFilters({ status: "", form: "" })}>
                <i className="bi bi-x-circle me-1" />Clear
              </button>
            </div>
            <div className="d-flex gap-2">
              <Link to="/admin/students/import" className="btn btn-sm btn-outline-success">
                <i className="bi bi-file-earmark-excel me-1" />Import Excel
              </Link>
              <Link to="/admin/students/new" className="btn btn-sm btn-primary">
                <i className="bi bi-person-plus me-1" />Admit Student
              </Link>
            </div>
          </div>

          {loading && <LoadingSpinner />}
          {error && <AlertMessage type="danger" message={error} />}
          {!loading && !error && (
            <DataTable
              columns={columns}
              data={students}
              actions={(row) => (
                <div className="d-flex gap-1">
                  <button className="btn btn-xs btn-outline-primary btn-sm" style={{ fontSize: 11 }}
                    onClick={() => navigate(`/admin/students/${row.id}`)}>
                    <i className="bi bi-eye" />
                  </button>
                  <button className="btn btn-xs btn-outline-secondary btn-sm" style={{ fontSize: 11 }}
                    onClick={() => navigate(`/admin/students/${row.id}/edit`)}>
                    <i className="bi bi-pencil" />
                  </button>
                  <button className="btn btn-xs btn-outline-danger btn-sm" style={{ fontSize: 11 }}
                    onClick={() => setDeleteTarget(row)}>
                    <i className="bi bi-trash" />
                  </button>
                </div>
              )}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        show={!!deleteTarget}
        title="Delete Student"
        message={`Are you sure you want to delete ${deleteTarget?.full_name} (${deleteTarget?.admission_number})? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete Student"
      />
    </section>
  );
}