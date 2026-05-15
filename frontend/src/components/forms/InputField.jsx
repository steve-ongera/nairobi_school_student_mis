// components/forms/InputField.jsx
import React from "react";

export function InputField({ label, name, value, onChange, type = "text", required, error, placeholder, helpText, disabled }) {
  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={name} className="form-label fw-semibold" style={{ color: "rgba(1,41,112,0.7)", fontSize: 13 }}>
          {label}{required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={`form-control${error ? " is-invalid" : ""}`}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
      {helpText && !error && <div className="form-text text-muted">{helpText}</div>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}

export function SelectField({ label, name, value, onChange, options = [], required, error, placeholder = "Select…", disabled }) {
  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={name} className="form-label fw-semibold" style={{ color: "rgba(1,41,112,0.7)", fontSize: 13 }}>
          {label}{required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`form-select${error ? " is-invalid" : ""}`}
        required={required}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}

export function DateField({ label, name, value, onChange, required, error, disabled }) {
  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={name} className="form-label fw-semibold" style={{ color: "rgba(1,41,112,0.7)", fontSize: 13 }}>
          {label}{required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type="date"
        value={value}
        onChange={onChange}
        className={`form-control${error ? " is-invalid" : ""}`}
        required={required}
        disabled={disabled}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}

export function TextareaField({ label, name, value, onChange, required, error, placeholder, rows = 3, disabled }) {
  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={name} className="form-label fw-semibold" style={{ color: "rgba(1,41,112,0.7)", fontSize: 13 }}>
          {label}{required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`form-control${error ? " is-invalid" : ""}`}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}