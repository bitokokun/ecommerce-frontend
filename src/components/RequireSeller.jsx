import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RequireSeller({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login?next=/sell" replace />;
  if (user.role !== "seller" && user.role !== "admin") {
    return (
      <div className="container" style={{ padding: "60px 20px", textAlign: "center" }}>
        <p className="error-banner" style={{ display: "inline-block" }}>
          This account isn't registered to sell. Create a seller account to list products.
        </p>
      </div>
    );
  }
  return children;
}
