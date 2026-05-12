import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearUser } from "../store/userSlice";
import { persistor } from "../store/store";
import { Button } from "./ui/button";
import { PenTool, LogOut, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/documents", label: "My Documents" },
  { to: "/upload", label: "Upload" },
];

const NavBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.user.user);
  const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    dispatch(clearUser());
    persistor.purge();
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-slate-900 text-slate-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-wide hover:text-slate-200 transition-colors">
          <PenTool className="h-5 w-5 text-indigo-400" />
          <span>ESign</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Desktop user / logout */}
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <span className="text-sm text-slate-400">
              {user.full_name || user.name || user.email}
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="text-slate-300 hover:text-white hover:bg-white/10 h-8 px-3"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-700 bg-slate-900 px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {NAV_LINKS.map(({ to, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="border-t border-slate-700 pt-3 mt-2 flex items-center justify-between">
            {user && (
              <span className="text-sm text-slate-400 truncate mr-4">
                {user.full_name || user.name || user.email}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setMobileOpen(false); logout(); }}
              className="text-slate-300 hover:text-white hover:bg-white/10 h-8 px-3"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
