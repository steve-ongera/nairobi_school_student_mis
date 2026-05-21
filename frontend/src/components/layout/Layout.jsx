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
    // Handle responsive behavior without Bootstrap
    const handleResize = () => {
      if (window.innerWidth > 992) {
        // Close mobile menu when resizing to desktop
        const mobileMenu = document.querySelector('.mobile-menu-dropdown');
        if (mobileMenu && mobileMenu.classList.contains('open')) {
          mobileMenu.classList.remove('open');
        }
        
        // Close mobile search overlay
        const mobileSearch = document.querySelector('.mobile-search-overlay');
        if (mobileSearch) {
          mobileSearch.style.display = 'none';
        }
      } else {
        // On mobile, ensure search overlay is hidden by default
        const mobileSearch = document.querySelector('.mobile-search-overlay');
        if (mobileSearch && !mobileSearch.classList.contains('show')) {
          mobileSearch.style.display = 'none';
        }
      }
    };

    // Handle scroll for back to top button
    const handleScroll = () => {
      const btn = document.getElementById('backToTop');
      if (btn) {
        if (window.scrollY > 300) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    };

    // Manual dropdown toggles
    const setupDropdowns = () => {
      // Handle profile dropdown
      const profileToggle = document.querySelector('.nav-profile');
      const notificationsToggle = document.querySelector('.header-icon-btn[data-bs-toggle="dropdown"]');
      
      if (profileToggle) {
        profileToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const dropdown = profileToggle.closest('.dropdown');
          const menu = dropdown?.querySelector('.dropdown-menu');
          if (menu) {
            // Close other dropdowns
            document.querySelectorAll('.dropdown-menu.show').forEach(m => {
              if (m !== menu) m.classList.remove('show');
            });
            menu.classList.toggle('show');
          }
        });
      }
      
      if (notificationsToggle) {
        notificationsToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const dropdown = notificationsToggle.closest('.dropdown');
          const menu = dropdown?.querySelector('.dropdown-menu');
          if (menu) {
            document.querySelectorAll('.dropdown-menu.show').forEach(m => {
              if (m !== menu) m.classList.remove('show');
            });
            menu.classList.toggle('show');
          }
        });
      }
      
      // Close dropdowns when clicking outside
      document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
          menu.classList.remove('show');
        });
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    // Setup dropdowns after a short delay to ensure DOM is ready
    setTimeout(setupDropdowns, 100);
    
    // Initial calls
    handleScroll();
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
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