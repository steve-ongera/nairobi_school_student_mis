import { useState } from "react";
import { PageTitle, AlertMessage } from "../../../components/common";

const STORAGE_KEY = "school_settings";

const defaults = {
  school_name: "Kenya High School",
  school_address: "P.O. Box 1234, Nairobi, Kenya",
  school_phone: "+254 700 000 000",
  school_email: "admin@school.ac.ke",
  motto: "Excellence Through Discipline",
  county: "Nairobi",
  sub_county: "",
};

export default function SchoolSettings() {
  const [form, setForm] = useState(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
    catch { return defaults; }
  });
  const [msg, setMsg] = useState({ type: "", text: "" });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setMsg({ type: "success", text: "School settings saved." });
  };

  const Field = ({ label, name, type = "text" }) => (
    <div className="col-md-6 mb-3">
      <label className="form-label fw-600">{label}</label>
      <input
        type={type}
        className="form-control"
        value={form[name]}
        onChange={(e) => set(name, e.target.value)}
      />
    </div>
  );

  return (
    <>
      <PageTitle title="School Settings" breadcrumbs={[{ label: "Settings" }, { label: "School" }]} />
      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">School Information</h5>
          <form onSubmit={handleSave}>
            <div className="row">
              <Field label="School Name" name="school_name" />
              <Field label="Email Address" name="school_email" type="email" />
              <Field label="Phone Number" name="school_phone" type="tel" />
              <Field label="Motto" name="motto" />
              <Field label="County" name="county" />
              <Field label="Sub-County" name="sub_county" />
              <div className="col-12 mb-3">
                <label className="form-label fw-600">Physical Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.school_address}
                  onChange={(e) => set("school_address", e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-save me-2" />Save Settings
            </button>
          </form>
        </div>
      </div>
    </>
  );
}