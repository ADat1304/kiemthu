// src/layout/MainLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fb" }}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Backdrop cho mobile */}
            {isSidebarOpen && (
                <div 
                    className="sidebar-overlay d-md-none" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
                <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                <main className="flex-grow-1 p-2 p-md-3" style={{ overflowX: "hidden" }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

