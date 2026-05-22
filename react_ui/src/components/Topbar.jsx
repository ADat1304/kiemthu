// src/components/Topbar.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getAuth } from "../utils/auth.js";
export default function Topbar({ onToggleSidebar }) {
    const navigate = useNavigate();

    const auth = useMemo(() => getAuth(), []);
    const displayName = auth?.user?.fullname || auth?.user?.username || "Quản lý";
    const displayRole =
        (Array.isArray(auth?.user?.roles) && auth.user.roles.length
            ? auth.user.roles.join(", ")
            : auth?.user?.role) || "Chưa xác định";

    const handleLogout = () => {
        clearAuth();
        navigate("/login", { replace: true });
    };

    return (
        <header className="border-bottom bg-white px-2 px-md-3 py-2 d-flex align-items-center justify-content-between flex-shrink-0">
            <div className="d-flex align-items-center gap-2">
                {/* Nút Hamburger chỉ hiển thị trên di động */}
                <button
                    className="btn btn-light d-md-none border p-1 d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36 }}
                    onClick={onToggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <i className="bi bi-list" style={{ fontSize: "1.35rem" }}></i>
                </button>
                <div className="fw-semibold text-truncate" style={{ maxWidth: 160 }} title={`Xin chào, ${displayName}`}>
                    Xin chào, {displayName} 👋
                </div>
            </div>
            <div className="d-flex align-items-center gap-2 gap-md-3">

                <div className="position-relative">
                    <span className="bi bi-bell"></span>
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"></span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div
                        className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: 32, height: 32, minWidth: 32 }}
                    >
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="me-2 d-none d-sm-block">
                        <div className="small fw-semibold">{displayName}</div>
                        <div className="small text-muted">{displayRole}</div>
                    </div>
                    <button className="btn btn-outline-secondary btn-sm px-2 py-1" onClick={handleLogout}>
                        Đăng xuất
                    </button>
                </div>
            </div>
        </header>
    );
}

