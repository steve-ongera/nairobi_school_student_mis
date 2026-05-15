import { useState } from "react";
import { getMe, updateMe } from "../../utils/api";
import { useFetch } from "../../hooks";
import { formatDate } from "../../utils/formatters";
import { PageTitle, AlertMessage, LoadingSpinner } from "../../components/common";

export default function ProfilePage() {
  const { data: user, loading, error, refetch } = useFetch(() => getMe());
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const startEdit = () => {
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || "",
    });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMe(form);
      setMsg({ type: "success", text: "Profile updated." });
      setEditing(false);
      refetch();
    } catch {
      setMsg({ type: "danger", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="danger" message={error} />;
  if (!user) return null;

  const initials = user.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <PageTitle title="My Profile" breadcrumbs={[{ label: "Profile" }]} />
      <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg({ type: "", text: "" })} />

      <div className="row">
        <div className="col-xl-4">
          <div className="card profile">
            <div className="card-body profile-card pt-4 d-flex flex-column align-items-center text-center">
              <div
                style={{
                  width: 90, height: 90, borderRadius: "50%",
                  background: "linear-gradient(135deg,#4154f1,#012970)",
                  color: "#fff", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 36, fontWeight: 700, marginBottom: 16,
                }}
              >
                {initials}
              </div>
              <h2>{user.full_name}</h2>
              <h3 style={{ fontSize: 15, color: "#899bbd" }}>{user.email}</h3>
              <span className="badge bg-primary text-capitalize mt-1">{user.role}</span>
              <small className="text-muted mt-2">Joined {formatDate(user.date_joined)}</small>
            </div>
          </div>
        </div>

        <div className="col-xl-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title d-flex justify-content-between align-items-center">
                Profile Details
                {!editing && (
                  <button className="btn btn-sm btn-outline-primary" onClick={startEdit}>
                    <i className="bi bi-pencil me-1" />Edit
                  </button>
                )}
              </h5>

              {!editing ? (
                <div className="row profile-overview">
                  {[
                    { label: "First Name", value: user.first_name },
                    { label: "Last Name", value: user.last_name },
                    { label: "Email", value: user.email },
                    { label: "Phone", value: user.phone || "—" },
                    { label: "Role", value: user.role },
                    { label: "Status", value: user.is_active ? "Active" : "Inactive" },
                  ].map((row) => (
                    <div className="col-md-6" key={row.label}>
                      <div className="row mb-3">
                        <div className="col-5 label">{row.label}</div>
                        <div className="col-7 text-capitalize">{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    {[
                      { label: "First Name", key: "first_name" },
                      { label: "Last Name", key: "last_name" },
                      { label: "Phone", key: "phone", type: "tel" },
                    ].map((field) => (
                      <div key={field.key} className="col-md-6">
                        <label className="form-label fw-600">{field.label}</label>
                        <input
                          type={field.type || "text"}
                          className="form-control"
                          value={form[field.key]}
                          onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                      Save Changes
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}