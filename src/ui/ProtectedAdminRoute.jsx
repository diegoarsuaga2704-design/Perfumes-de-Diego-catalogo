import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Wrapper para proteger rutas de admin.
 *
 * Reglas:
 *  - Si está cargando la sesión, muestra spinner.
 *  - Si no hay user, redirige a /admin/login.
 *  - Si hay user pero no es admin, redirige a / (home) — caso extremo.
 *  - Si todo bien, renderiza children.
 */
export default function ProtectedAdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
