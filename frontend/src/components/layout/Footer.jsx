// components/layout/Footer.jsx
import React from "react";

export function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="copyright">
        &copy; {new Date().getFullYear()}{" "}
        <strong>
          <span>School MIS</span>
        </strong>
        . Kenyan High School Management Information System.
      </div>
    </footer>
  );
}