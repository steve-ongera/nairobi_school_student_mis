// src/pages/admin/students/StudentList.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getStudents, deleteStudent } from "../../../utils/api";
import { formatDate } from "../../../utils/formatters";
import {
  PageTitle, DataTable, SearchBar, StatusBadge,
  AlertMessage, ConfirmDialog,
} from "../../../components/common";

const GENDER_ICON  = { M: "male",   F: "female",  O: "neuter" };
const GENDER_LABEL = { M: "Male",   F: "Female",  O: "Other"  };

export default function StudentList() {
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const pageSize                = 20;
  const [data,     setData]     = useState([]);
  const [count,    setCount]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [msg,      setMsg]      = useState({ type: "", text: "" });

  const totalPages = Math.ceil(count / pageSize);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res     = await getStudents({ search, page, page_size: pageSize });
      const payload = res?.data ?? res;
      if (payload?.results !== undefined) {
        setData(payload.results);
        setCount(payload.count ?? payload.results.length);
      } else if (Array.isArray(payload)) {
        setData(payload);
        setCount(payload.length);
      } else {
        setData([]);
        setCount(0);
      }
    } catch (err) {
      setError("Failed to load students. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { setPage(1); }, [search]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStudent(deleteId);
      setMsg({ type: "success", text: "Student deleted successfully." });
      setDeleteId(null);
      if (data.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchStudents();
    } catch {
      setMsg({ type: "danger", text: "Failed to delete student." });
    }
  };

  // ── Pagination page numbers ───────────────────────────────────────────────
  const getPageNumbers = () => {
    const delta = 2;
    const nums  = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) nums.push(i);
    return nums;
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      header: "Adm No",
      render: (row) => (
        <Link to={`/admin/students/${row.id}`} className="cell-mono">
          {row.admission_number}
        </Link>
      ),
    },
    {
      header: "Student",
      render: (row) => (
        <div className="cell-person">
          <div className="cell-avatar cell-avatar--indigo">
            {row.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="cell-name">{row.full_name}</div>
            <div className="cell-meta">{row.email || "—"}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Class",
      render: (row) =>
        row.current_classroom_display
          ? <span className="fw-500">{row.current_classroom_display}</span>
          : <span className="text-muted">—</span>,
    },
    {
      header: "Gender",
      render: (row) =>
        row.gender ? (
          <span className={`pill pill--${row.gender === "F" ? "female" : "male"}`}>
            <i className={`bi bi-gender-${GENDER_ICON[row.gender] ?? "neuter"}`} style={{ marginRight: 4 }} />
            {GENDER_LABEL[row.gender] ?? row.gender}
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
      render: (row) => (
        <span className="text-muted">{formatDate(row.admission_date)}</span>
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="tbl-actions">
          <Link
            to={`/admin/students/${row.id}`}
            className="tbl-btn tbl-btn--view"
            title="View"
          >
            <i className="bi bi-eye" />
          </Link>
          <Link
            to={`/admin/students/${row.id}/edit`}
            className="tbl-btn tbl-btn--edit"
            title="Edit"
          >
            <i className="bi bi-pencil" />
          </Link>
          <button
            className="tbl-btn tbl-btn--delete"
            onClick={() => setDeleteId(row.id)}
            title="Delete"
          >
            <i className="bi bi-trash" />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <PageTitle title="Students" breadcrumbs={[{ label: "Students" }]} />

      {msg.text && (
        <AlertMessage
          type={msg.type}
          message={msg.text}
          onClose={() => setMsg({ type: "", text: "" })}
        />
      )}

      <div className="card">
        {/* Toolbar */}
        <div className="card-header">
          <div>
            <h5 className="card-title">
              All Students
              {count > 0 && <span className="count-chip ms-2">{count.toLocaleString()}</span>}
            </h5>
            <p className="card-subtitle">Manage enrolled students</p>
          </div>
          <div className="d-flex align-items-center gap-3">
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

        {/* Error */}
        {error && (
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <AlertMessage type="danger" message={error} />
          </div>
        )}

        {/* Table */}
        <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            emptyMessage="No students found. Try a different search."
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination__info">
              Showing{" "}
              <strong>{(page - 1) * pageSize + 1}</strong>–
              <strong>{Math.min(page * pageSize, count)}</strong>{" "}
              of <strong>{count.toLocaleString()}</strong> students
            </span>

            <div className="pagination__controls">
              {/* First */}
              <button
                className="page-btn"
                onClick={() => setPage(1)}
                disabled={page === 1}
                title="First page"
              >
                «
              </button>

              {/* Prev */}
              <button
                className="page-btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                ‹
              </button>

              {/* Left ellipsis */}
              {page > 3 && (
                <span className="page-btn" style={{ cursor: "default", opacity: 0.4 }}>…</span>
              )}

              {/* Page numbers */}
              {getPageNumbers().map((n) => (
                <button
                  key={n}
                  className={`page-btn${n === page ? " active" : ""}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}

              {/* Right ellipsis */}
              {page < totalPages - 2 && (
                <span className="page-btn" style={{ cursor: "default", opacity: 0.4 }}>…</span>
              )}

              {/* Next */}
              <button
                className="page-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                ›
              </button>

              {/* Last */}
              <button
                className="page-btn"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                title="Last page"
              >
                »
              </button>
            </div>
          </div>
        )}
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