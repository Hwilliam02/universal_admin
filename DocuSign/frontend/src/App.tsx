import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import SignPage from "./pages/SignPage";
import FieldEditorPage from "./pages/FieldEditorPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import RequireAuth from "./components/RequireAuth";
import DocumentsPage from "./pages/DocumentsPage";
import NavBar from "./components/NavBar";
import AuthGuard from "./components/AuthGuard";
import { Toaster } from "./components/ui/toaster";

const App: React.FC = () => {
  const location = useLocation();
  const isSignPage = location.pathname.startsWith("/sign/");

  /* If the user is on a public signing link and tries to navigate elsewhere,
     the sign page layout keeps them sandboxed — no navbar, no other routes. */
  if (isSignPage) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <main className="py-8">
          <Routes>
            <Route path="/sign/:token" element={<SignPage />} />
            {/* Any other path redirects back to the sign page */}
            <Route path="*" element={<Navigate to={location.pathname} replace />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />

          <Route
            path="/documents"
            element={
              <RequireAuth>
                <DocumentsPage />
              </RequireAuth>
            }
          />

          <Route
            path="/upload"
            element={
              <RequireAuth>
                <UploadPage />
              </RequireAuth>
            }
          />

          <Route
            path="/field-editor"
            element={
              <RequireAuth>
                <FieldEditorPage />
              </RequireAuth>
            }
          />

          <Route
            path="*"
            element={
              <div className="text-center py-16">
                <h2 className="text-2xl font-semibold text-slate-700">404 — Page not found</h2>
              </div>
            }
          />
        </Routes>
      </main>
      <Toaster />
    </div>
    </AuthGuard>
  );
};

export default App;