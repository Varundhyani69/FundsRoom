import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roles }) {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token) return <Navigate to="/login" replace />;

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
