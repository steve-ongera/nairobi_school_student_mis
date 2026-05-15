// components/common/PageTitle.jsx
import React from "react";
import { Link } from "react-router-dom";

export function PageTitle({ title, breadcrumbs = [] }) {
  return (
    <div className="pagetitle">
      <h1>{title}</h1>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          {breadcrumbs.map((crumb, i) => (
            <li
              key={i}
              className={`breadcrumb-item${i === breadcrumbs.length - 1 ? " active" : ""}`}
            >
              {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}