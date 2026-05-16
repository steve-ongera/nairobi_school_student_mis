// Updated StudentList.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { getStudents, deleteStudent } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import {
  PageTitle, DataTable, SearchBar, StatusBadge, AlertMessage, ConfirmDialog,
} from "../../../components/common";

export default function StudentList() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const { data: response, loading, error, refetch } = useFetch(
    () => getStudents(search ? { search } : {}),
    [search]
  );

  // Handle different response structures
  const students = response?.results || response?.data || (Array.isArray(response) ? response : []);
  
  console.log("Debug - Response:", response);
  console.log("Debug - Students array:", students);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStudent(deleteId);
      setMsg({ type: "success", text: "Student deleted." });
      refetch();
    } catch {
      setMsg({ type: "danger", text: "Failed to delete student." });
    }
  };

  const columns = [
    { header: "Adm No", key: "admission_number", render: (row) =>
      <Link to={`/admin/students/${row.id}`} className="fw-600">{row.admission_number}</Link> },
    { header: "Name", key: "full_name" },
    { header: "Class", key: "current_classroom_display" },
    { header: "Gender", key: "gender", render: (row) => row.gender?.charAt(0).toUpperCase() + row.gender?.slice(1) },
    { header: "Boarding", key: "boarding_status", render: (row) =>
      <span className="badge bg-info">{row.boarding_status}</span> },
    { header: "Status", key: "status", render: (row) => <StatusBadge status={row.status} /> },
    { header: "Admitted", key: "admission_date", render: (row) => formatDate(row.admission_date) },
    { header: "Actions", render: (row) => (
      <div className="d-flex gap-1">
        <Link to={`/admin/students/${row.id}`} className="btn btn-sm btn-outline-primary">
          <i className="bi bi-eye" />
        </Link>
        <Link to={`/admin/students/${row.id}/edit`} className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-pencil" />
        </Link>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => setDeleteId(row.id)}
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
      <PageTitle title="Students" breadcrumbs={[{ label: "Students" }]} />

      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h5 className="card-title mb-0">All Students</h5>
            <div className="d-flex gap-2 align-items-center">
              <SearchBar value={search} onChange={setSearch} placeholder="Search by name or adm no…" />
              <Link to="/admin/students/new" className="btn btn-primary">
                <i className="bi bi-person-plus me-1" /> Admit Student
              </Link>
            </div>
          </div>

          {error && <AlertMessage type="danger" message={error} />}

          <DataTable
            columns={columns}
            data={students}
            loading={loading}
            emptyMessage="No students found. Try a different search."
          />
        </div>
      </div>

      <ConfirmDialog
        show={!!deleteId}
        title="Delete Student"
        message="Are you sure you want to delete this student? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmLabel="Delete"
        confirmColor="danger"
      />
    </>
  );
}