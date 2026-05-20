// src/layout/MainLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

export default function MainLayout() {
    return (
        <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fb" }}>
            <Sidebar />

            <div className="flex-grow-1 d-flex flex-column">
                <Topbar />

                <main className="flex-grow-1 p-3">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
