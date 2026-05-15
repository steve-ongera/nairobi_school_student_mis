import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="copyright">
        &copy; {new Date().getFullYear()} <strong>SchoolMIS Kenya</strong>. All rights reserved.
      </div>
      <div className="credits">Powered by Django REST Framework &amp; React</div>
    </footer>
  );
}

export default function Layout() {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}