// src/pages/admin/students/StudentList.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { getStudents, deleteStudent } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import {
  PageTitle, DataTable, SearchBar, StatusBadge, AlertMessage, ConfirmDialog,
} from "../../../components/common";

export default function StudentList() {
  const [search,   setSearch]   = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [msg,      setMsg]      = useState({ type: "", text: "" });

  const { data: response, loading, error, refetch } = useFetch(
    () => getStudents(search ? { search } : {}),
    [search]
  );

  const students = response?.results || response?.data || (Array.isArray(response) ? response : []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStudent(deleteId);
      setMsg({ type: "success", text: "Student deleted successfully." });
      refetch();
      setDeleteId(null);
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
      render: (row) =>
        row.current_classroom_display || <span className="text-muted">—</span>,
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
            <i className={`bi bi-house-door${row.boarding_status.toLowerCase() === "boarding" ? "-fill" : ""}`} />
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
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <PageTitle title="Students" breadcrumbs={[{ label: "Students" }]} />

      <AlertMessage
        type={msg.type}
        message={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      <div className="card">
        <div className="card-body">

          {/* Toolbar */}
          <div className="tbl-toolbar">
            <h5 className="card-title mb-0">All Students</h5>
            <div className="tbl-toolbar__right">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name or admission number…"
              />
              <Link to="/admin/students/new" className="btn btn-primary btn-sm">
                <i className="bi bi-person-plus me-1" /> Admit Student
              </Link>
            </div>
          </div>

          {error && <AlertMessage type="danger" message={error} />}

          <DataTable
            columns={columns}
            data={students}
            loading={loading}
            emptyMessage={
              search
                ? `No students match "${search}".`
                : "No students found. Click 'Admit Student' to get started."
            }
          />

        </div>
      </div>

      <ConfirmDialog
        id="confirmDelete"
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmLabel="Delete"
        confirmColor="danger"
      />
    </>
  );
}

/* ─── Scoped styles ─────────────────────────────────────────────────── */
const styles = `
  /* Toolbar */
  .tbl-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }

  .tbl-toolbar__right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* Adm number link */
  .adm-link {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    font-weight: 700;
    color: var(--primary);
    letter-spacing: 0.03em;
  }
  .adm-link:hover { text-decoration: underline; }

  /* Student name cell */
  .student-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .student-avatar {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: linear-gradient(135deg, var(--primary), #3b82f6);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    flex-shrink: 0;
  }

  .student-cell__name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 13px;
    line-height: 1.3;
  }

  .student-cell__sub {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 1px;
  }

  /* Pills (gender / boarding) */
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  .pill--male      { background: #eff6ff; color: var(--primary); }
  .pill--female    { background: #fdf2f8; color: #db2777; }
  .pill--boarding  { background: #fef3c7; color: #b45309; }
  .pill--day       { background: #cffafe; color: #0e7490; }

  /* Action buttons */
  .tbl-actions {
    display: flex;
    gap: 6px;
  }

  .tbl-btn {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: all 150ms ease;
  }

  .tbl-btn--view  { background: #eff6ff; color: var(--primary); }
  .tbl-btn--edit  { background: #fef3c7; color: #b45309; }
  .tbl-btn--del   { background: #fef2f2; color: var(--danger); }

  .tbl-btn--view:hover { background: var(--primary); color: white; }
  .tbl-btn--edit:hover { background: var(--warning);  color: white; }
  .tbl-btn--del:hover  { background: var(--danger);   color: white; }

  @media (max-width: 768px) {
    .tbl-toolbar { flex-direction: column; align-items: flex-start; }
    .tbl-toolbar__right { width: 100%; }
  }
`;