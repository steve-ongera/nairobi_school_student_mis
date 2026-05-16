// src/components/layout/Layout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="copyright">
        <i className="bi bi-c-circle me-1" style={{ fontSize: 12 }}></i>
        {new Date().getFullYear()} <strong>SchoolMIS Kenya</strong>. All rights reserved.
      </div>
      <div className="credits">
        <span>Powered by Django REST Framework &amp; React</span>
        <span className="mx-2">•</span>
        <span>v3.1.0</span>
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main">
        <div className="main-content">
          <Outlet />
        </div>
      </main>
      <Footer />
      
      {/* Back to top button */}
      <button 
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        id="backToTop"
      >
        <i className="bi bi-arrow-up-short"></i>
      </button>
      
      <script dangerouslySetInnerHTML={{
        __html: `
          window.addEventListener('scroll', function() {
            const btn = document.getElementById('backToTop');
            if (window.scrollY > 300) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          });
        `
      }} />
    </>
  );
}