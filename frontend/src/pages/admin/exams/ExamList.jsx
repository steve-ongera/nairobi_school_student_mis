import { useState } from "react";
import { Link } from "react-router-dom";
import { getExams, publishExam } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import { PageTitle, DataTable, AlertMessage, StatusBadge } from "../../../components/common";

export default function ExamList() {
  const [msg, setMsg] = useState({ type: "", text: "" });
  const { data: exams, loading, error, refetch } = useFetch(() => getExams());

  const handlePublish = async (id, name) => {
    if (!window.confirm(`Publish results for "${name}"? Students will be able to see them.`)) return;
    try {
      await publishExam(id);
      setMsg({ type: "success", text: `"${name}" results published.` });
      refetch();
    } catch {
      setMsg({ type: "danger", text: "Failed to publish exam." });
    }
  };

  const EXAM_TYPE_LABELS = {
    cat: "CAT",
    midterm: "Mid-Term",
    endterm: "End-Term",
    mock: "Mock",
    opener: "Opener",
  };

  const columns = [
    { header: "Name", key: "name", render: (e) =>
      <Link to={`/admin/exams/${e.id}/results`} className="fw-600">{e.name}</Link> },
    { header: "Type", key: "exam_type", render: (e) =>
      <span className="badge bg-primary">{EXAM_TYPE_LABELS[e.exam_type] || e.exam_type}</span> },
    { header: "Term", key: "term_display" },
    { header: "Forms", render: (e) =>
      e.applicable_forms?.map((f) => (
        <span key={f.id} className="badge bg-info me-1">{f.name}</span>
      )) || "—" },
    { header: "Results", render: (e) =>
      <span className="badge bg-secondary">{e.result_count} entries</span> },
    { header: "Published", render: (e) =>
      <span className={`badge bg-${e.is_published ? "success" : "warning"}`}>
        {e.is_published ? "Published" : "Draft"}
      </span> },
    { header: "Actions", render: (e) => (
      <div className="d-flex gap-1">
        <Link to={`/admin/exams/${e.id}/results`} className="btn btn-sm btn-outline-primary">
          <i className="bi bi-bar-chart" />
        </Link>
        <Link to={`/admin/exams/${e.id}/edit`} className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-pencil" />
        </Link>
        {!e.is_published && (
          <button
            className="btn btn-sm btn-success"
            onClick={() => handlePublish(e.id, e.name)}
            title="Publish Results"
          >
            <i className="bi bi-send-check" />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <>
      <PageTitle title="Exams" breadcrumbs={[{ label: "Exams" }]} />

      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">All Exams</h5>
            <Link to="/admin/exams/new" className="btn btn-primary">
              <i className="bi bi-journal-plus me-1" /> Create Exam
            </Link>
          </div>
          {error && <AlertMessage type="danger" message={error} />}
          <DataTable columns={columns} data={exams} loading={loading} emptyMessage="No exams found." />
        </div>
      </div>
    </>
  );
}