// Updated StudentList.jsx - Clean & Simple (without stats chips)
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
      key: "admission_number", 
      render: (row) => (
        <Link to={`/admin/students/${row.id}`} className="student-link">
          {row.admission_number}
        </Link>
      ) 
    },
    { 
      header: "Student Name", 
      key: "full_name",
      render: (row) => (
        <div className="student-name-cell">
          <div className="student-avatar">
            {row.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="student-name">{row.full_name}</div>
            <div className="student-email">{row.email || "—"}</div>
          </div>
        </div>
      )
    },
    { header: "Class", key: "current_classroom_display", render: (row) => 
      row.current_classroom_display || <span className="text-muted">Not assigned</span>
    },
    { header: "Gender", key: "gender", render: (row) => 
      row.gender ? (
        <span className={`gender-badge ${row.gender.toLowerCase()}`}>
          <i className={`bi ${row.gender.toLowerCase() === 'male' ? 'bi-gender-male' : 'bi-gender-female'}`}></i>
          {row.gender.charAt(0).toUpperCase() + row.gender.slice(1)}
        </span>
      ) : "—"
    },
    { header: "Boarding", key: "boarding_status", render: (row) =>
      row.boarding_status ? (
        <span className={`boarding-badge ${row.boarding_status.toLowerCase()}`}>
          <i className={`bi ${row.boarding_status.toLowerCase() === 'boarding' ? 'bi-house-door-fill' : 'bi-house-door'}`}></i>
          {row.boarding_status}
        </span>
      ) : "—"
    },
    { header: "Status", key: "status", render: (row) => <StatusBadge status={row.status} /> },
    { header: "Admitted", key: "admission_date", render: (row) => formatDate(row.admission_date) },
    { 
      header: "Actions", 
      render: (row) => (
        <div className="action-buttons">
          <Link to={`/admin/students/${row.id}`} className="action-btn view-btn" title="View">
            <i className="bi bi-eye" />
          </Link>
          <Link to={`/admin/students/${row.id}/edit`} className="action-btn edit-btn" title="Edit">
            <i className="bi bi-pencil" />
          </Link>
          <button
            className="action-btn delete-btn"
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
      <style dangerouslySetInnerHTML={{ __html: `
        /* Student List Specific Styles */
        /* Search and Add Section */
        .header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .search-wrapper {
          position: relative;
          flex: 1;
          max-width: 360px;
        }
        
        .search-wrapper i {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 16px;
        }
        
        .search-input {
          width: 100%;
          padding: 10px 14px 10px 42px;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all var(--transition-fast);
        }
        
        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        /* Table Styles */
        .students-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .students-table thead th {
          text-align: left;
          padding: 16px;
          background: #f8fafc;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border);
        }
        
        .students-table tbody td {
          padding: 16px;
          font-size: 14px;
          border-bottom: 1px solid var(--border-light);
          vertical-align: middle;
        }
        
        .students-table tbody tr:hover {
          background: #fafbfc;
        }
        
        /* Student Name Cell */
        .student-name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .student-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--primary), #3b82f6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .student-name {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        
        .student-email {
          font-size: 11px;
          color: var(--text-muted);
        }
        
        .student-link {
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
          font-family: monospace;
          font-size: 13px;
        }
        
        .student-link:hover {
          text-decoration: underline;
        }
        
        /* Badges */
        .gender-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .gender-badge.male {
          background: #eff6ff;
          color: var(--primary);
        }
        
        .gender-badge.female {
          background: #fdf2f8;
          color: #ec4899;
        }
        
        .boarding-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .boarding-badge.boarding {
          background: #fef3c7;
          color: var(--warning);
        }
        
        .boarding-badge.day {
          background: #cffafe;
          color: var(--info);
        }
        
        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        
        .view-btn {
          background: #eff6ff;
          color: var(--primary);
        }
        
        .view-btn:hover {
          background: var(--primary);
          color: white;
          transform: translateY(-2px);
        }
        
        .edit-btn {
          background: #fef3c7;
          color: var(--warning);
        }
        
        .edit-btn:hover {
          background: var(--warning);
          color: white;
          transform: translateY(-2px);
        }
        
        .delete-btn {
          background: #fef2f2;
          color: var(--danger);
        }
        
        .delete-btn:hover {
          background: var(--danger);
          color: white;
          transform: translateY(-2px);
        }
        
        /* Add Button */
        .add-btn {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border: none;
          padding: 10px 24px;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all var(--transition-fast);
        }
        
        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          color: white;
        }
        
        /* Empty State */
        .empty-state-modern {
          text-align: center;
          padding: 60px 20px;
        }
        
        .empty-state-modern i {
          font-size: 64px;
          color: var(--border);
          margin-bottom: 16px;
        }
        
        .empty-state-modern h6 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        
        .empty-state-modern p {
          font-size: 14px;
          color: var(--text-muted);
        }
        
        /* Loading State */
        .loading-modern {
          text-align: center;
          padding: 60px 20px;
        }
        
        .spinner-modern {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Alert Customization */
        .alert-custom {
          border-radius: 12px;
          border: none;
          padding: 14px 20px;
          margin-bottom: 20px;
        }
        
        .alert-success {
          background: #ecfdf5;
          color: #065f46;
          border-left: 4px solid var(--success);
        }
        
        .alert-danger {
          background: #fef2f2;
          color: #991b1b;
          border-left: 4px solid var(--danger);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .header-actions {
            flex-direction: column;
          }
          
          .search-wrapper {
            max-width: 100%;
            width: 100%;
          }
          
          .add-btn {
            width: 100%;
            justify-content: center;
          }
          
          .action-buttons {
            flex-wrap: wrap;
          }
          
          .students-table {
            font-size: 12px;
          }
          
          .students-table thead th,
          .students-table tbody td {
            padding: 12px;
          }
          
          .student-name-cell {
            min-width: 150px;
          }
        }
      `}} />

      <div>
        {/* Page Title with Breadcrumb */}
        <PageTitle title="Students" breadcrumbs={[{ label: "Students" }]} />

        {/* Alert Messages */}
        {msg.text && (
          <div className={`alert-custom alert-${msg.type} d-flex align-items-center justify-content-between mb-4`}>
            <div className="d-flex align-items-center gap-2">
              <i className={`bi bi-${msg.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'}`}></i>
              <span>{msg.text}</span>
            </div>
            <button type="button" className="btn-close" onClick={() => setMsg({ type: "", text: "" })}></button>
          </div>
        )}

        {/* Main Card */}
        <div className="card">
          <div className="card-body">
            {/* Header with Search and Add Button */}
            <div className="header-actions">
              <div className="search-wrapper">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name or admission number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Link to="/admin/students/new" className="add-btn">
                <i className="bi bi-person-plus"></i> Admit Student
              </Link>
            </div>

            {/* Error State */}
            {error && (
              <div className="alert-custom alert-danger mb-4">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="loading-modern">
                <div className="spinner-modern"></div>
                <p className="text-muted">Loading students...</p>
              </div>
            )}

            {/* Table */}
            {!loading && students.length > 0 && (
              <div className="table-responsive">
                <table className="students-table">
                  <thead>
                    <tr>
                      {columns.map((col, idx) => (
                        <th key={idx}>{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        {columns.map((col, idx) => (
                          <td key={idx}>
                            {col.render ? col.render(student) : student[col.key] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty State */}
            {!loading && students.length === 0 && !error && (
              <div className="empty-state-modern">
                <i className="bi bi-people"></i>
                <h6>No students found</h6>
                <p>{search ? "Try a different search term" : "Click 'Admit Student' to add your first student"}</p>
                {search && (
                  <button className="btn btn-outline-primary mt-3" onClick={() => setSearch("")}>
                    <i className="bi bi-x-circle"></i> Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        show={!!deleteId}
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