import { useState } from "react";
import { Link } from "react-router-dom";
import { getTeachers, deleteTeacher } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import {
  PageTitle, DataTable, SearchBar, AlertMessage, ConfirmDialog,
} from "../../../components/common";

export function TeacherList() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const { data: teachers, loading, error, refetch } = useFetch(
    () => getTeachers(search ? { search } : {}),
    [search]
  );

  const handleDelete = async () => {
    try {
      await deleteTeacher(deleteId);
      setMsg({ type: "success", text: "Teacher deleted." });
      refetch();
    } catch {
      setMsg({ type: "danger", text: "Failed to delete teacher." });
    }
  };

  const columns = [
    { header: "Staff No", render: (t) => <code>{t.staff_number || "—"}</code> },
    { header: "Name", render: (t) =>
      <Link to={`/admin/teachers/${t.id}`} className="fw-600">{t.full_name}</Link> },
    { header: "Email", key: "email" },
    { header: "TSC No", render: (t) => t.tsc_number || "—" },
    { header: "Department", key: "department" },
    { header: "Allocations", render: (t) =>
      <span className="badge bg-primary">{t.allocation_count}</span> },
    { header: "Status", render: (t) => (
      <span className={`badge bg-${t.is_active ? "success" : "secondary"}`}>
        {t.is_active ? "Active" : "Inactive"}
      </span>
    )},
    { header: "Actions", render: (t) => (
      <div className="d-flex gap-1">
        <Link to={`/admin/teachers/${t.id}`} className="btn btn-sm btn-outline-primary">
          <i className="bi bi-eye" />
        </Link>
        <Link to={`/admin/teachers/${t.id}/edit`} className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-pencil" />
        </Link>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => setDeleteId(t.id)}
          data-bs-toggle="modal"
          data-bs-target="#confirmDelete"
        >
          <i className="bi bi-trash" />
        </button>
      </div>
    )},
  ];

  return (
    <>
      <PageTitle title="Teachers" breadcrumbs={[{ label: "Teachers" }]} />
      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h5 className="card-title mb-0">All Teachers</h5>
            <div className="d-flex gap-2">
              <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />
              <Link to="/admin/teachers/new" className="btn btn-primary">
                <i className="bi bi-person-plus me-1" /> Add Teacher
              </Link>
            </div>
          </div>
          {error && <AlertMessage type="danger" message={error} />}
          <DataTable columns={columns} data={teachers} loading={loading} emptyMessage="No teachers found." />
        </div>
      </div>

      <ConfirmDialog
        id="confirmDelete"
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher?"
        onConfirm={handleDelete}
      />
    </>
  );
}