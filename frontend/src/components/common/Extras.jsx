import { useRef } from "react";

export function Modal({ id, title, size = "md", onClose, footer, children }) {
  return (
    <div className="modal fade" id={id} tabIndex={-1}>
      <div className={`modal-dialog modal-${size}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={onClose} />
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function Tabs({ tabs = [], defaultTab }) {
  const activeId = defaultTab || tabs[0]?.id;
  return (
    <>
      <ul className="nav nav-tabs nav-tabs-bordered mb-3">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <button
              className={`nav-link ${tab.id === activeId ? "active" : ""}`}
              data-bs-toggle="tab"
              data-bs-target={`#tab-${tab.id}`}
            >
              {tab.icon && <i className={`bi ${tab.icon} me-1`} />}
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="tab-content pt-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-pane fade ${tab.id === activeId ? "show active" : ""}`}
            id={`tab-${tab.id}`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </>
  );
}

export function FileUpload({ onFile, accept = "*", label = "Choose File", hint }) {
  const inputRef = useRef();
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onFile(file);
  };
  return (
    <div
      onClick={() => inputRef.current.click()}
      style={{
        border: "2px dashed #aab7cf", borderRadius: 8, padding: "30px 20px",
        textAlign: "center", cursor: "pointer", background: "#f6f9ff",
        transition: "border-color 0.2s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.borderColor = "#4154f1")}
      onMouseOut={(e) => (e.currentTarget.style.borderColor = "#aab7cf")}
    >
      <i className="bi bi-cloud-upload" style={{ fontSize: 36, color: "#4154f1" }} />
      <p className="mt-2 mb-1 fw-600" style={{ color: "#012970" }}>{label}</p>
      {hint && <small className="text-muted">{hint}</small>}
      <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }} onChange={handleChange} />
    </div>
  );
}

export function PrintButton({ label = "Print", className = "btn btn-outline-secondary btn-sm" }) {
  return (
    <button className={className} onClick={() => window.print()}>
      <i className="bi bi-printer me-1" />{label}
    </button>
  );
}

export function ExportCSV({ data = [], filename = "export.csv", columns = [], label = "Export CSV" }) {
  const download = () => {
    const headers = columns.map((c) => c.label).join(",");
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = row[c.key] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button className="btn btn-outline-success btn-sm" onClick={download}>
      <i className="bi bi-filetype-csv me-1" />{label}
    </button>
  );
}