// pages/admin/teachers/TeacherList.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageTitle } from "../../../components/common/PageTitle";
import { DataTable, AlertMessage, LoadingSpinner, ConfirmDialog } from "../../../components/common/DataTable";
import useFetch from "../../../hooks/useFetch";
import { teachersAPI } from "../../../utils/api";
import { formatDate } from "../../../utils/formatters";

export default function TeacherList() {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [msg, setMsg] = useState(null);
  const { data, loading, error, refetch } = useFetch(() => teachersAPI.getTeachers(), []);
  const teachers = data?.results || data || [];

  const handleDelete = async () => {
    try {
      await teachersAPI.deleteTeacher(deleteTarget.id);
      setMsg({ type: "success", text: "Teacher deleted." });
      refetch();
    } catch { setMsg({ type: "danger", text: "Failed to delete teacher." }); }
    finally { setDeleteTarget(null); }
  };

  const columns = [
    { key: "staff_number", label: "Staff No" },
    { key: "full_name", label: "Name", render: (v, row) => (
      <Link to={`/admin/teachers/${row.id}`} className="fw-semibold text-primary">{v}</Link>
    )},
    { key: "email", label: "Email", render: (v) => <small className="text-muted">{v}</small> },
    { key: "tsc_number", label: "TSC No", render: (v) => v || "—" },
    { key: "department", label: "Department", render: (v) => v || "—" },
    { key: "allocation_count", label: "Allocations", render: (v) => (
      <span className="badge bg-primary-light text-primary">{v}</span>
    )},
    { key: "is_active", label: "Status", render: (v) => (
      <span className={`badge ${v ? "bg-success" : "bg-danger"}`}>{v ? "Active" : "Inactive"}</span>
    )},
  ];

  return (
    <section>
      <PageTitle title="Teachers" breadcrumbs={[{ label: "Teachers" }]} />
      {msg && <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="card-title mb-0">All Teachers</h5>
            <div className="d-flex gap-2">
              <Link to="/admin/teachers/allocations" className="btn btn-sm btn-outline-info">
                <i className="bi bi-journal-arrow-up me-1" />Subject Allocations
              </Link>
              <Link to="/admin/teachers/new" className="btn btn-sm btn-primary">
                <i className="bi bi-person-plus me-1" />Add Teacher
              </Link>
            </div>
          </div>
          {loading && <LoadingSpinner />}
          {error && <AlertMessage type="danger" message={error} />}
          {!loading && !error && (
            <DataTable columns={columns} data={teachers}
              actions={(row) => (
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-primary" style={{ fontSize: 11 }} onClick={() => navigate(`/admin/teachers/${row.id}`)}>
                    <i className="bi bi-eye" />
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 11 }} onClick={() => navigate(`/admin/teachers/${row.id}/edit`)}>
                    <i className="bi bi-pencil" />
                  </button>
                  <button className="btn btn-sm btn-outline-danger" style={{ fontSize: 11 }} onClick={() => setDeleteTarget(row)}>
                    <i className="bi bi-trash" />
                  </button>
                </div>
              )}
            />
          )}
        </div>
      </div>
      <ConfirmDialog show={!!deleteTarget} title="Delete Teacher"
        message={`Delete ${deleteTarget?.full_name} (${deleteTarget?.staff_number})?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} confirmLabel="Delete" />
    </section>
  );
}