// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";

export default function Sidebar({ isOpen, onClose }) {
    const menuItemClass = ({ isActive }) =>
        "nav-link d-flex align-items-center px-3 py-2 " +
        (isActive ? "active bg-white text-success fw-semibold shadow-sm" : "text-white-50");

    const handleLinkClick = () => {
        if (onClose) {
            onClose();
        }
    };

    return (
        <aside
            className={`d-flex flex-column flex-shrink-0 sidebar-wrapper ${isOpen ? "show" : ""}`}
            style={{
                width: 230,
                minWidth: 230,
                backgroundColor: "#046c4e",
                minHeight: "100vh"
            }}
        >
            <div className="p-3 border-bottom border-success-subtle d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ width: 40, height: 40, backgroundColor: "#03a66a" }}
                    >
                        CF
                    </div>
                    <div className="text-white">
                        <div className="fw-semibold">Café Manager</div>
                        <small className="text-white-50">Admin dashboard</small>
                    </div>
                </div>
                {/* Nút đóng sidebar chỉ trên Mobile */}
                <button
                    className="btn btn-link text-white d-md-none p-0 border-0"
                    onClick={onClose}
                    aria-label="Close sidebar"
                >
                    <i className="bi bi-x-lg" style={{ fontSize: "1.2rem" }}></i>
                </button>
            </div>

            <nav className="nav flex-column mt-3">
                <span className="text-uppercase text-white-50 small px-3 mb-2">
                    Main
                </span>
                <NavLink to="/dashboard" className={menuItemClass} onClick={handleLinkClick}>
                    <span className="me-2 bi bi-house-door" /> Trang chủ
                </NavLink>
                <NavLink to="/sales" className={menuItemClass} onClick={handleLinkClick}>
                    <span className="me-2 bi bi-cash-stack" /> Bán hàng
                </NavLink>
                <NavLink to="/statistics" className={menuItemClass} onClick={handleLinkClick}>
                    <span className="me-2 bi bi-graph-up" /> Báo cáo doanh thu
                </NavLink>
                <NavLink to="/products" className={menuItemClass} onClick={handleLinkClick}>
                    <span className="me-2 bi bi-cup-hot" /> Sản phẩm / Menu
                </NavLink>
                <NavLink to="/employees" className={menuItemClass} onClick={handleLinkClick}>
                    <span className="me-2 bi bi-people" /> Nhân viên
                </NavLink>
            </nav>
        </aside>
    );
}

