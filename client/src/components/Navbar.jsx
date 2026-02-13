import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  const NavLinks = () => (
    <>
      {user.role === "EMPLOYEE" && (
        <>
          <Link
            to="/employee/dashboard"
            className="block py-2 px-4 hover:bg-blue-700 rounded hover:text-blue-200"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/employee/work"
            className="block py-2 px-4 hover:bg-blue-700 rounded hover:text-blue-200"
            onClick={() => setIsOpen(false)}
          >
            My Work
          </Link>
        </>
      )}

      {user.role === "HR" && (
        <>
          <Link
            to="/hr/dashboard"
            className="block py-2 px-4 hover:bg-blue-700 rounded hover:text-blue-200"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/hr/clients"
            className="block py-2 px-4 hover:bg-blue-700 rounded hover:text-blue-200"
            onClick={() => setIsOpen(false)}
          >
            Clients
          </Link>
          <Link
            to="/hr/tasks"
            className="block py-2 px-4 hover:bg-blue-700 rounded hover:text-blue-200"
            onClick={() => setIsOpen(false)}
          >
            Tasks
          </Link>
          <Link
            to="/hr/queries"
            className="block py-2 px-4 hover:bg-blue-700 rounded hover:text-blue-200"
            onClick={() => setIsOpen(false)}
          >
            Queries
          </Link>
          <Link
            to="/hr/review"
            className="block py-2 px-4 hover:bg-blue-700 rounded hover:text-blue-200"
            onClick={() => setIsOpen(false)}
          >
            Day-End Review
          </Link>
          <Link
            to="/hr/billing"
            className="block py-2 px-4 hover:bg-blue-700 rounded hover:text-blue-200"
            onClick={() => setIsOpen(false)}
          >
            Billing
          </Link>
          <Link
            to="/hr/payments"
            className="block py-2 px-4 hover:bg-blue-700 rounded hover:text-blue-200"
            onClick={() => setIsOpen(false)}
          >
            Payments
          </Link>
          <Link
            to="/hr/ledger"
            className="block py-2 px-4 hover:bg-blue-700 rounded hover:text-blue-200"
            onClick={() => setIsOpen(false)}
          >
            Ledger
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold mr-8">
              Office Admin
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              <NavLinks />
            </div>
          </div>

          {/* Desktop User Profile */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm">
              {user.name} ({user.role})
            </span>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition duration-200"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="outline-none mobile-menu-button p-2 hover:bg-blue-700 rounded"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${isOpen ? "block" : "hidden"} md:hidden pb-4 px-2`}>
        <div className="flex flex-col space-y-1">
          <NavLinks />
          <div className="border-t border-blue-500 my-2 pt-2">
            <div className="px-4 py-2 text-sm text-blue-100">
              {user.name} ({user.role})
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-blue-700 rounded hover:text-blue-200 transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
