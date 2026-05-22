// src/components/layout/Layout.jsx (Pure CSS solution - no Bootstrap JS needed)
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="copyright">
        <i className="bi bi-c-circle me-1" style={{ fontSize: 12 }}></i>
        {new Date().getFullYear()} <strong>SchoolMIS Kenya</strong>. All rights reserved.
      </div>
    </footer>
  );
}

export default function Layout() {
  useEffect(() => {
    // Handle scroll for back to top button
    const handleScroll = () => {
      const btn = document.getElementById('backToTop');
      if (btn) {
        if (window.scrollY > 300) {
          btn.classList.add('is-visible');
        } else {
          btn.classList.remove('is-visible');
        }
      }
    };

    // Handle sidebar toggle (desktop collapse / mobile open)
    const setupSidebarToggle = () => {
      const toggleBtn = document.querySelector('.sidebar-toggle');
      const backdrop  = document.querySelector('.sidebar-backdrop');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          if (window.innerWidth >= 1200) {
            // Desktop: collapse/expand icon rail
            document.body.classList.toggle('sidebar-collapsed');
          } else {
            // Mobile: slide sidebar in/out
            const sidebar = document.querySelector('.sidebar');
            const isOpen  = sidebar?.classList.contains('is-open');
            sidebar?.classList.toggle('is-open', !isOpen);
            backdrop?.classList.toggle('is-visible', !isOpen);
          }
        });
      }

      if (backdrop) {
        backdrop.addEventListener('click', () => {
          document.querySelector('.sidebar')?.classList.remove('is-open');
          backdrop.classList.remove('is-visible');
        });
      }
    };

    // Close mobile sidebar on resize to desktop
    const handleResize = () => {
      if (window.innerWidth >= 1200) {
        document.querySelector('.sidebar')?.classList.remove('is-open');
        document.querySelector('.sidebar-backdrop')?.classList.remove('is-visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    setTimeout(setupSidebarToggle, 100);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
        aria-label="Back to top"
      >
        <i className="bi bi-arrow-up-short"></i>
      </button>
    </>
  );
}