import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../utils/api";
import { PageTitle, AlertMessage } from "../../components/common";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ old_password: "", new_password: "", new_password_confirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.new_password_confirm) {
      setMsg({ type: "danger", text: "New passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      await changePassword(form);
      setMsg({ type: "success", text: "Password changed successfully. Please log in again." });
      setForm({ old_password: "", new_password: "", new_password_confirm: "" });
    } catch (err) {
      const d = err.response?.data;
      setMsg({
        type: "danger",
        text: d?.old_password?.[0] || d?.new_password?.[0] || d?.detail || "Failed to change password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="Change Password" breadcrumbs={[{ label: "Change Password" }]} />
      <div className="row justify-content-center">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <div className="text-center mb-4">
                <i className="bi bi-lock-fill" style={{ fontSize: 48, color: "#4154f1" }} />
                <h5 className="card-title mt-2">Update Your Password</h5>
              </div>
              <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />
              <form onSubmit={handleSubmit}>
                {[
                  { label: "Current Password", key: "old_password" },
                  { label: "New Password", key: "new_password" },
                  { label: "Confirm New Password", key: "new_password_confirm" },
                ].map((field) => (
                  <div className="mb-3" key={field.key}>
                    <label className="form-label fw-600">{field.label}</label>
                    <div className="input-group">
                      <input
                        type={show ? "text" : "password"}
                        className="form-control"
                        value={form[field.key]}
                        onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        required
                      />
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setShow((s) => !s)} tabIndex={-1}>
                        <i className={`bi bi-eye${show ? "-slash" : ""}`} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="d-flex gap-2 mt-2">
                  <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                    Update Password
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}