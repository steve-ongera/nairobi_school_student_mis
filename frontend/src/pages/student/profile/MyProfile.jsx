// Updated MyProfile.jsx - Clean & Modern with Full Responsiveness
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
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.new_password_confirm) {
      setPwMsg({ type: "danger", text: "New passwords do not match." });
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwMsg({ type: "danger", text: "Password must be at least 6 characters long." });
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(pwForm);
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setPwForm({ old_password: "", new_password: "", new_password_confirm: "" });
      setTimeout(() => setPwMsg({ type: "", text: "" }), 3000);
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

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="danger" message={error} />;
  if (!student) return null;

  const rows = [
    { label: "Admission Number", value: student.admission_number, icon: "bi-upc-scan" },
    { label: "Full Name", value: student.full_name, icon: "bi-person" },
    { label: "Email", value: student.email, icon: "bi-envelope" },
    { label: "Date of Birth", value: formatDate(student.date_of_birth), icon: "bi-calendar" },
    { label: "Gender", value: student.gender?.charAt(0).toUpperCase() + student.gender?.slice(1), icon: "bi-gender-ambiguous" },
    { label: "Nationality", value: student.nationality, icon: "bi-flag" },
    { label: "Blood Group", value: student.blood_group || "—", icon: "bi-droplet" },
    { label: "Boarding Status", value: student.boarding_status?.charAt(0).toUpperCase() + student.boarding_status?.slice(1), icon: "bi-house-door" },
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
          height: 100%;
        }
        
        .profile-card-modern:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        
        .profile-avatar-large {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          margin: 0 auto 20px;
          box-shadow: var(--shadow-md);
          border: 4px solid white;
          outline: 1px solid var(--border);
          transition: transform var(--transition-fast);
        }
        
        .profile-card-modern:hover .profile-avatar-large {
          transform: scale(1.05);
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
          background: var(--primary-light);
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
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
          margin-bottom: 8px;
        }
        
        .profile-status-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
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
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
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
          font-size: 22px;
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
          transition: all var(--transition-fast);
        }
        
        .info-row:hover {
          background: var(--primary-light);
          padding-left: 8px;
          border-radius: 8px;
        }
        
        .info-row-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--primary-light) 0%, rgba(37,99,235,0.1) 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          font-size: 16px;
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
          word-break: break-word;
        }
        
        /* Password Card */
        .password-card {
          background: var(--bg-card);
          border-radius: 20px;
          border: 1px solid var(--border);
          overflow: hidden;
        }
        
        .password-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
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
        
        .password-header h5 i {
          color: var(--primary);
          font-size: 22px;
        }
        
        .password-body {
          padding: 24px;
        }
        
        .form-group {
          margin-bottom: 24px;
        }
        
        .form-label-custom {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .form-label-custom i {
          color: var(--primary);
          font-size: 14px;
        }
        
        .password-input-wrapper {
          position: relative;
        }
        
        .form-input-custom {
          width: 100%;
          padding: 12px 16px;
          padding-right: 45px;
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
        
        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 16px;
          padding: 5px;
          transition: color var(--transition-fast);
        }
        
        .password-toggle:hover {
          color: var(--primary);
        }
        
        .btn-update {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border: none;
          padding: 12px 32px;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all var(--transition-fast);
          cursor: pointer;
        }
        
        .btn-update:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .btn-update:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .btn-update:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Password strength indicator */
        .password-strength {
          margin-top: 8px;
          height: 4px;
          border-radius: 2px;
          background: var(--border);
          overflow: hidden;
        }
        
        .password-strength-bar {
          height: 100%;
          width: 0%;
          transition: width 0.3s ease;
          border-radius: 2px;
        }
        
        /* Responsive Styles */
        @media (max-width: 1200px) {
          .info-grid {
            gap: 16px;
          }
        }
        
        @media (max-width: 992px) {
          .profile-avatar-large {
            width: 100px;
            height: 100px;
            font-size: 40px;
          }
          
          .profile-name-large {
            font-size: 22px;
          }
        }
        
        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 20px;
          }
          
          .profile-card-modern {
            padding: 24px 20px;
            margin-bottom: 20px;
          }
          
          .profile-avatar-large {
            width: 90px;
            height: 90px;
            font-size: 36px;
          }
          
          .profile-name-large {
            font-size: 20px;
          }
          
          .password-body {
            padding: 20px;
          }
          
          .info-header,
          .password-header {
            padding: 16px 20px;
          }
          
          .info-header h5,
          .password-header h5 {
            font-size: 16px;
          }
          
          .btn-update {
            width: 100%;
            justify-content: center;
          }
        }
        
        @media (max-width: 576px) {
          .profile-card-modern {
            padding: 20px 16px;
          }
          
          .profile-avatar-large {
            width: 80px;
            height: 80px;
            font-size: 32px;
            margin-bottom: 16px;
          }
          
          .profile-name-large {
            font-size: 18px;
          }
          
          .profile-adm {
            font-size: 12px;
          }
          
          .profile-class-badge,
          .profile-status-badge {
            font-size: 11px;
            padding: 4px 12px;
          }
          
          .info-grid {
            padding: 16px;
            gap: 10px;
          }
          
          .info-row {
            padding: 6px 0;
          }
          
          .info-row-icon {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
          
          .info-row-label {
            font-size: 10px;
          }
          
          .info-row-value {
            font-size: 13px;
          }
          
          .password-body {
            padding: 16px;
          }
          
          .form-group {
            margin-bottom: 18px;
          }
          
          .form-input-custom {
            padding: 10px 14px;
            padding-right: 40px;
            font-size: 13px;
          }
          
          .btn-update {
            padding: 10px 24px;
            font-size: 13px;
          }
        }
        
        /* Animation */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Loading state */
        .profile-skeleton {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
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
                    <label className="form-label-custom">
                      <i className="bi bi-lock"></i>
                      Current Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword.old ? "text" : "password"}
                        className="form-input-custom"
                        value={pwForm.old_password}
                        onChange={(e) =>
                          setPwForm((f) => ({ ...f, old_password: e.target.value }))
                        }
                        required
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('old')}
                      >
                        <i className={`bi ${showPassword.old ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label-custom">
                      <i className="bi bi-key"></i>
                      New Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        className="form-input-custom"
                        value={pwForm.new_password}
                        onChange={(e) =>
                          setPwForm((f) => ({ ...f, new_password: e.target.value }))
                        }
                        required
                        placeholder="Enter new password (min. 6 characters)"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        <i className={`bi ${showPassword.new ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                    {pwForm.new_password && (
                      <div className="password-strength">
                        <div 
                          className="password-strength-bar"
                          style={{ 
                            width: `${Math.min((pwForm.new_password.length / 20) * 100, 100)}%`,
                            background: pwForm.new_password.length < 6 ? 'var(--danger)' : 
                                       pwForm.new_password.length < 10 ? 'var(--warning)' : 
                                       'var(--success)'
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label-custom">
                      <i className="bi bi-check-circle"></i>
                      Confirm New Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        className="form-input-custom"
                        value={pwForm.new_password_confirm}
                        onChange={(e) =>
                          setPwForm((f) => ({ ...f, new_password_confirm: e.target.value }))
                        }
                        required
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        <i className={`bi ${showPassword.confirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
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