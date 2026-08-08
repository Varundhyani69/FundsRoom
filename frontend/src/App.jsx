import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CustomerList from "./pages/customers/CustomerList";
import CustomerForm from "./pages/customers/CustomerForm";
import CustomerDetail from "./pages/customers/CustomerDetail";
import ProductList from "./pages/products/ProductList";
import ProductForm from "./pages/products/ProductForm";
import ProductDetail from "./pages/products/ProductDetail";
import StockMovements from "./pages/products/StockMovements";
import ChallanList from "./pages/challans/ChallanList";
import ChallanCreate from "./pages/challans/ChallanCreate";
import ChallanDetail from "./pages/challans/ChallanDetail";

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

        {/* Products & Inventory */}
        <Route path="/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
        <Route path="/products/new" element={<ProtectedRoute roles={["admin", "warehouse"]}><ProductForm /></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
        <Route path="/products/:id/edit" element={<ProtectedRoute roles={["admin", "warehouse"]}><ProductForm /></ProtectedRoute>} />
        <Route path="/stock-movements" element={<ProtectedRoute><StockMovements /></ProtectedRoute>} />

        {/* Sales Challans */}
        <Route path="/challans" element={<ProtectedRoute><ChallanList /></ProtectedRoute>} />
        <Route path="/challans/new" element={<ProtectedRoute roles={["admin", "sales"]}><ChallanCreate /></ProtectedRoute>} />
        <Route path="/challans/:id" element={<ProtectedRoute><ChallanDetail /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
