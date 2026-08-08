import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CustomerList from "./pages/customers/CustomerList";
import CustomerForm from "./pages/customers/CustomerForm";
import CustomerDetail from "./pages/customers/CustomerDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Customer CRM */}
        <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
        <Route path="/customers/new" element={<ProtectedRoute roles={["admin", "sales"]}><CustomerForm /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
        <Route path="/customers/:id/edit" element={<ProtectedRoute roles={["admin", "sales"]}><CustomerForm /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
