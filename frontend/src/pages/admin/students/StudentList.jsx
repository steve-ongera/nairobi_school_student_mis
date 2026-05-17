// Updated StudentList.jsx – with working server-side pagination
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getStudents, deleteStudent } from "../../../utils/api";
import { formatDate } from "../../../utils/formatters";
import {
  PageTitle, DataTable, SearchBar, StatusBadge, AlertMessage, ConfirmDialog,
} from "../../../components/common";

export default function StudentList() {
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [pageSize]              = useState(20);          // match your DRF PAGE_SIZE
  const [data, setData]         = useState([]);
  const [count, setCount]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [msg, setMsg]           = useState({ type: "", text: "" });

  const totalPages = Math.ceil(count / pageSize);

  // ── Fetch whenever page or search changes ──────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getStudents({ search, page, page_size: pageSize });
      // Handle both paginated { count, results } and plain array responses
      const payload = response?.data ?? response;
      if (payload?.results !== undefined) {
        // Paginated DRF response
        setData(payload.results);
        setCount(payload.count ?? payload.results.length);
      } else if (Array.isArray(payload)) {
        // Non-paginated fallback
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

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Reset to page 1 whenever search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStudent(deleteId);
      setMsg({ type: "success", text: "Student deleted successfully." });
      setDeleteId(null);
      // If last item on page > 1, go back one page
      if (data.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchStudents();
      }
    } catch {
      setMsg({ type: "danger", text: "Failed to delete student." });
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const GENDER_ICON = { M: "male", F: "female", O: "neuter" };
  const GENDER_LABEL = { M: "Male", F: "Female", O: "Other" };

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
            <i className={`bi bi-gender-${GENDER_ICON[row.gender] ?? "neuter"} me-1`} />
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
      render: (row) => formatDate(row.admission_date),
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

  // ── Pagination helper ──────────────────────────────────────────────────────
  const getPageNumbers = () => {
    // Show at most 5 page buttons around the current page
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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
          {/* Toolbar */}
          <div className="tbl-toolbar">
            <h5 className="card-title mb-0">
              All Students{" "}
              {count > 0 && (
                <span className="badge bg-primary ms-2">{count}</span>
              )}
            </h5>
            <div className="tbl-toolbar__right">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name or adm no…"
              />
              <Link
                to="/admin/students/new"
                className="btn btn-primary btn-sm"
              >
                <i className="bi bi-person-plus" /> Admit Student
              </Link>
            </div>
          </div>

          {error && <AlertMessage type="danger" message={error} />}

          {/* Table */}
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            emptyMessage="No students found. Try a different search."
          />

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
              {/* Info text */}
              <small className="text-muted">
                Showing{" "}
                <strong>{(page - 1) * pageSize + 1}</strong>–
                <strong>{Math.min(page * pageSize, count)}</strong>{" "}
                of <strong>{count}</strong> students
              </small>

              {/* Page buttons */}
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  {/* First */}
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      title="First page"
                    >
                      «
                    </button>
                  </li>

                  {/* Prev */}
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 1}
                    >
                      ‹
                    </button>
                  </li>

                  {/* Left ellipsis */}
                  {page > 3 && (
                    <li className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  )}

                  {/* Page numbers */}
                  {getPageNumbers().map((n) => (
                    <li
                      key={n}
                      className={`page-item ${n === page ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    </li>
                  ))}

                  {/* Right ellipsis */}
                  {page < totalPages - 2 && (
                    <li className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  )}

                  {/* Next */}
                  <li
                    className={`page-item ${page === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page === totalPages}
                    >
                      ›
                    </button>
                  </li>

                  {/* Last */}
                  <li
                    className={`page-item ${page === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      title="Last page"
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
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