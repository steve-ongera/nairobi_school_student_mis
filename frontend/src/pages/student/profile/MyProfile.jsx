import { useState } from "react";
import { getMyStudentProfile, updateMe, changePassword } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { formatDate } from "../../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage } from "../../../components/common";

export default function MyProfile() {
  const { data: student, loading, error } = useFetch(() => getMyStudentProfile());
  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.new_password_confirm) {
      setPwMsg({ type: "danger", text: "New passwords do not match." });
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(pwForm);
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setPwForm({ old_password: "", new_password: "", new_password_confirm: "" });
    } catch (err) {
      const d = err.response?.data;
      setPwMsg({
        type: "danger",
        text:
          d?.old_password?.[0] ||
          d?.new_password?.[0] ||
          d?.detail ||
          "Failed to change password.",
      });
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="danger" message={error} />;
  if (!student) return null;

  const rows = [
    { label: "Admission Number", value: student.admission_number },
    { label: "Full Name", value: student.full_name },
    { label: "Email", value: student.email },
    { label: "Date of Birth", value: formatDate(student.date_of_birth) },
    { label: "Gender", value: student.gender },
    { label: "Nationality", value: student.nationality },
    { label: "Blood Group", value: student.blood_group || "—" },
    { label: "Boarding Status", value: student.boarding_status },
    { label: "Dormitory", value: student.dormitory || "—" },
    { label: "Bed Number", value: student.bed_number || "—" },
    { label: "KCPE Index No", value: student.kcpe_index_number || "—" },
    { label: "KCPE Marks", value: student.kcpe_marks ?? "—" },
    { label: "Current Class", value: student.current_classroom?.stream_display || "—" },
    { label: "Admission Date", value: formatDate(student.admission_date) },
  ];

  return (
    <>
      <PageTitle title="My Profile" breadcrumbs={[{ label: "Profile" }]} />

      <div className="row">
        {/* Profile card */}
        <div className="col-xl-4">
          <div className="card profile">
            <div className="card-body profile-card pt-4 d-flex flex-column align-items-center text-center">
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#4154f1,#012970)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                {(student.full_name || "S").charAt(0)}
              </div>
              <h2>{student.full_name}</h2>
              <h3 style={{ color: "#899bbd", fontSize: 15 }}>
                {student.admission_number}
              </h3>
              <div className="mt-2">
                <span className="badge bg-primary me-1">
                  {student.current_classroom?.stream_display || "Unassigned"}
                </span>
                <span className="badge bg-secondary text-capitalize">
                  {student.boarding_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-8">
          {/* Profile details */}
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Profile Details</h5>
              <div className="row profile-overview">
                {rows.map((row) => (
                  <div className="col-md-6" key={row.label}>
                    <div className="row mb-2">
                      <div className="col-6 label text-capitalize">{row.label}</div>
                      <div className="col-6 text-capitalize">{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Change Password</h5>
              <AlertMessage
                type={pwMsg.type}
                message={pwMsg.text}
                onClose={() => setPwMsg({ type: "", text: "" })}
              />
              <form onSubmit={handlePasswordChange} style={{ maxWidth: 400 }}>
                {[
                  { label: "Current Password", key: "old_password" },
                  { label: "New Password", key: "new_password" },
                  { label: "Confirm New Password", key: "new_password_confirm" },
                ].map((field) => (
                  <div className="mb-3" key={field.key}>
                    <label className="form-label fw-600">{field.label}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={pwForm[field.key]}
                      onChange={(e) =>
                        setPwForm((f) => ({ ...f, [field.key]: e.target.value }))
                      }
                      required
                    />
                  </div>
                ))}
                <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                  {pwLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Updating…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lock me-2" />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}