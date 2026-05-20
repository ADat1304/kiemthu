// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layout/MainLayout.jsx";
import RequireAuth from "./layout/RequireAuth.jsx";

import DashboardPage from "./pages/Dashboard.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import EmployeesPage from "./pages/EmployeesPage.jsx";
import RevenueReportPage from "./pages/RevenueReport.jsx";
export default function App() {
    return (
        <Routes>
            {/* Trang login không dùng sidebar */}
            <Route path="/login" element={<LoginPage />} />

            {/* Các trang còn lại dùng chung MainLayout (Sidebar + Topbar) */}
            <Route element={<RequireAuth />}>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/sales" element={<SalesPage />} />
                    <Route path="/statistics" element={<RevenueReportPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/employees" element={<EmployeesPage />} />
                    {/* sau này thêm: statistics, invoices, employees... */}
                </Route>
            </Route>

            {/* fallback: nếu route không khớp thì chuyển về dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}
