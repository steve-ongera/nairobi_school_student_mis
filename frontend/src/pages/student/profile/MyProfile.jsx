// Updated MyProfile.jsx - Clean & Modern
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
    { label: "Admission Number", value: student.admission_number, icon: "bi-upc-scan" },
    { label: "Full Name", value: student.full_name, icon: "bi-person" },
    { label: "Email", value: student.email, icon: "bi-envelope" },
    { label: "Date of Birth", value: formatDate(student.date_of_birth), icon: "bi-calendar" },
    { label: "Gender", value: student.gender, icon: "bi-gender-ambiguous" },
    { label: "Nationality", value: student.nationality, icon: "bi-flag" },
    { label: "Blood Group", value: student.blood_group || "—", icon: "bi-droplet" },
    { label: "Boarding Status", value: student.boarding_status, icon: "bi-house-door" },
    { label: "Dormitory", value: student.dormitory || "—", icon: "bi-building" },
    { label: "Bed Number", value: student.bed_number || "—", icon: "bi-bed" },
    { label: "KCPE Index No", value: student.kcpe_index_number || "—", icon: "bi-hash" },
    { label: "KCPE Marks", value: student.kcpe_marks ?? "—", icon: "bi-trophy" },
    { label: "Current Class", value: student.current_classroom?.stream_display || "—", icon: "bi-building" },
    { label: "Admission Date", value: formatDate(student.admission_date), icon: "bi-calendar-plus" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* MyProfile Modern Styles */
        .profile-container {
          animation: fadeInUp 0.4s ease;
        }
        
        /* Profile Card */
        .profile-card-modern {
          background: var(--bg-card);
          border-radius: 20px;
          border: 1px solid var(--border);
          padding: 32px 24px;
          text-align: center;
          transition: all var(--transition-base);
        }
        
        .profile-card-modern:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        
        .profile-avatar-large {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
          font-weight: 700;
          margin: 0 auto 20px;
          box-shadow: var(--shadow-md);
          border: 4px solid white;
          outline: 1px solid var(--border);
        }
        
        .profile-name-large {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        
        .profile-adm {
          font-size: 14px;
          color: var(--text-muted);
          font-family: monospace;
          margin-bottom: 16px;
        }
        
        .profile-class-badge {
          background: var(--primary-light);
          color: var(--primary);
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-right: 8px;
        }
        
        .profile-status-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        
        .profile-status-badge.boarding {
          background: #fef3c7;
          color: var(--warning);
        }
        
        .profile-status-badge.day {
          background: #cffafe;
          color: var(--info);
        }
        
        /* Info Card */
        .info-card-modern {
          background: var(--bg-card);
          border-radius: 20px;
          border: 1px solid var(--border);
          overflow: hidden;
          margin-bottom: 28px;
        }
        
        .info-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border);
          background: #fafbfc;
        }
        
        .info-header h5 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .info-header h5 i {
          color: var(--primary);
          font-size: 20px;
        }
        
        .info-grid {
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        .info-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-light);
        }
        
        .info-row-icon {
          width: 32px;
          height: 32px;
          background: var(--primary-light);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .info-row-content {
          flex: 1;
        }
        
        .info-row-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        
        .info-row-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }
        
        /* Password Card */
        .password-card {
          background: var(--bg-card);
          border-radius: 20px;
          border: 1px solid var(--border);
          overflow: hidden;
        }
        
        .password-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border);
          background: #fafbfc;
        }
        
        .password-header h5 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .password-body {
          padding: 24px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label-custom {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
          display: block;
        }
        
        .form-input-custom {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all var(--transition-fast);
        }
        
        .form-input-custom:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        .btn-update {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border: none;
          padding: 10px 28px;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all var(--transition-fast);
        }
        
        .btn-update:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .btn-update:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 16px;
          }
          
          .profile-card-modern {
            padding: 24px 20px;
          }
          
          .profile-avatar-large {
            width: 90px;
            height: 90px;
            font-size: 34px;
          }
          
          .password-body {
            padding: 16px;
          }
          
          .info-header,
          .password-header {
            padding: 14px 20px;
          }
        }
      `}} />

      <div className="profile-container">
        {/* Page Title with Breadcrumb */}
        <PageTitle title="My Profile" breadcrumbs={[{ label: "Profile" }]} />

        <div className="row g-4">
          {/* Left Column - Profile Card */}
          <div className="col-xl-4">
            <div className="profile-card-modern">
              <div className="profile-avatar-large">
                {(student.full_name || "S").charAt(0).toUpperCase()}
              </div>
              <h2 className="profile-name-large">{student.full_name}</h2>
              <div className="profile-adm">
                <i className="bi bi-upc-scan me-1"></i>
                {student.admission_number}
              </div>
              <div className="mt-3">
                <span className="profile-class-badge">
                  <i className="bi bi-building"></i>
                  {student.current_classroom?.stream_display || "Unassigned"}
                </span>
                <span className={`profile-status-badge ${student.boarding_status === 'boarding' ? 'boarding' : 'day'}`}>
                  <i className={`bi ${student.boarding_status === 'boarding' ? 'bi-house-door-fill' : 'bi-house-door'}`}></i>
                  {student.boarding_status?.charAt(0).toUpperCase() + student.boarding_status?.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Details & Password */}
          <div className="col-xl-8">
            {/* Profile Details Card */}
            <div className="info-card-modern">
              <div className="info-header">
                <h5>
                  <i className="bi bi-person-circle"></i>
                  Profile Details
                </h5>
              </div>
              <div className="info-grid">
                {rows.map((row) => (
                  <div className="info-row" key={row.label}>
                    <div className="info-row-icon">
                      <i className={row.icon}></i>
                    </div>
                    <div className="info-row-content">
                      <div className="info-row-label">{row.label}</div>
                      <div className="info-row-value">{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Change Password Card */}
            <div className="password-card">
              <div className="password-header">
                <h5>
                  <i className="bi bi-shield-lock"></i>
                  Change Password
                </h5>
              </div>
              <div className="password-body">
                <AlertMessage
                  type={pwMsg.type}
                  message={pwMsg.text}
                  onClose={() => setPwMsg({ type: "", text: "" })}
                />
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label className="form-label-custom">Current Password</label>
                    <input
                      type="password"
                      className="form-input-custom"
                      value={pwForm.old_password}
                      onChange={(e) =>
                        setPwForm((f) => ({ ...f, old_password: e.target.value }))
                      }
                      required
                      placeholder="Enter your current password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label-custom">New Password</label>
                    <input
                      type="password"
                      className="form-input-custom"
                      value={pwForm.new_password}
                      onChange={(e) =>
                        setPwForm((f) => ({ ...f, new_password: e.target.value }))
                      }
                      required
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label-custom">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-input-custom"
                      value={pwForm.new_password_confirm}
                      onChange={(e) =>
                        setPwForm((f) => ({ ...f, new_password_confirm: e.target.value }))
                      }
                      required
                      placeholder="Confirm your new password"
                    />
                  </div>
                  <button type="submit" className="btn-update" disabled={pwLoading}>
                    {pwLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i>
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}