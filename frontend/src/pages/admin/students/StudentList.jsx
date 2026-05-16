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

  const students = response?.results || response?.data || (Array.isArray(response) ? response : []);

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
    {
      header: "Adm No",
      render: (row) => (
        <Link to={`/admin/students/${row.id}`} className="adm-link">
          {row.admission_number}
        </Link>
      ),
    },
    {
      header: "Student",
      render: (row) => (
        <div className="student-cell">
          <div className="student-avatar">
            {row.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="student-cell__name">{row.full_name}</div>
            <div className="student-cell__sub">{row.email || "—"}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Class",
      render: (row) => row.current_classroom_display || <span className="text-muted">—</span>,
    },
    {
      header: "Gender",
      render: (row) =>
        row.gender ? (
          <span className={`pill pill--${row.gender.toLowerCase()}`}>
            <i className={`bi bi-gender-${row.gender.toLowerCase() === "male" ? "male" : "female"}`} />
            {row.gender.charAt(0).toUpperCase() + row.gender.slice(1)}
          </span>
        ) : "—",
    },
    {
      header: "Boarding",
      render: (row) =>
        row.boarding_status ? (
          <span className={`pill pill--${row.boarding_status.toLowerCase()}`}>
            {row.boarding_status}
          </span>
        ) : "—",
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Admitted",
      render: (row) => formatDate(row.admission_date),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="tbl-actions">
          <Link to={`/admin/students/${row.id}`} className="tbl-btn tbl-btn--view" title="View">
            <i className="bi bi-eye" />
          </Link>
          <Link to={`/admin/students/${row.id}/edit`} className="tbl-btn tbl-btn--edit" title="Edit">
            <i className="bi bi-pencil" />
          </Link>
          <button
            className="tbl-btn tbl-btn--del"
            onClick={() => setDeleteId(row.id)}
            data-bs-toggle="modal"
            data-bs-target="#confirmDelete"
            title="Delete"
          >
            <i className="bi bi-trash" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageTitle title="Students" breadcrumbs={[{ label: "Students" }]} />

      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      <div className="card">
        <div className="card-body">
          <div className="tbl-toolbar">
            <h5 className="card-title mb-0">All Students</h5>
            <div className="tbl-toolbar__right">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name or adm no…"
              />
              <Link to="/admin/students/new" className="btn btn-primary btn-sm">
                <i className="bi bi-person-plus" /> Admit Student
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