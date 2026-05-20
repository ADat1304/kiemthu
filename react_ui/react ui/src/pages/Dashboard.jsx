// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
// [CẬP NHẬT] Import thêm fetchTopSellingProducts, bỏ fetchProducts
import { fetchDailyOrderStats, fetchTables, fetchTopSellingProducts } from "../utils/api.js";
import { getAuth } from "../utils/auth.js";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

// ... (Giữ nguyên component DailyRevenueBarChart) ...
const DailyRevenueBarChart = ({ data }) => {
    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const svgHeight = 260;
    const margin = { top: 24, right: 24, bottom: 40, left: 80 };
    const innerHeight = svgHeight - margin.top - margin.bottom;
    const innerWidth = Math.max(data.length * 72, 320);
    const svgWidth = innerWidth + margin.left + margin.right;
    const step = innerWidth / Math.max(data.length, 1);
    const barWidth = Math.min(30, step * 0.4);
    const baselineY = margin.top + innerHeight;
    const ticks = [0.25, 0.5, 0.75, 1];
    const fontFamily = "'Be Vietnam Pro', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    return (
        <div className="bg-light rounded p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold small">Biểu đồ doanh thu</span>
                <span className="text-muted small">7 ngày gần nhất</span>
            </div>
            <div className="position-relative" style={{ minHeight: svgHeight }}>
                <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                    <line x1={margin.left} y1={baselineY} x2={svgWidth - margin.right} y2={baselineY} stroke="#dee2e6" strokeWidth="1.5" />
                    <line x1={margin.left} y1={margin.top} x2={margin.left} y2={baselineY} stroke="#dee2e6" strokeWidth="1.5" />
                    {ticks.map((t) => {
                        const value = maxValue * t;
                        const y = margin.top + innerHeight * (1 - value / maxValue);
                        return (
                            <g key={t}>
                                <line x1={margin.left} y1={y} x2={svgWidth - margin.right} y2={y} stroke="#e9ecef" strokeWidth="1" strokeDasharray="4 4" />
                                <text x={margin.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#6c757d" style={{ fontFamily }}>{formatCurrency(Math.round(value))}</text>
                            </g>
                        );
                    })}
                    {data.map((day, idx) => {
                        const ratio = day.value / maxValue;
                        const barHeight = day.value ? innerHeight * ratio : 0;
                        const x = margin.left + idx * step + (step - barWidth) / 2;
                        const y = baselineY - barHeight;
                        const centerX = x + barWidth / 2;
                        return (
                            <g key={day.key}>
                                {day.value > 0 && <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" fill="#198754"><title>{`${day.label}: ${formatCurrency(day.value)}`}</title></rect>}
                                {day.value > 0 && <text x={centerX} y={y - 6} textAnchor="middle" fontSize="11" fill="#495057" style={{ fontFamily }}>{formatCurrency(day.value)}</text>}
                                <text x={centerX} y={baselineY + 16} textAnchor="middle" fontSize="11" fill="#343a40" style={{ fontFamily }}>{day.label}</text>
                            </g>
                        );
                    })}
                </svg>
                {data.every((d) => d.value === 0) && <div className="text-center text-muted small mt-3">Chưa có doanh thu trong 7 ngày qua</div>}
            </div>
        </div>
    );
};

export default function DashboardPage() {
    const auth = getAuth();
    const token = useMemo(() => auth?.token, [auth]);
    const [tables, setTables] = useState([]);
    const [loadingTables, setLoadingTables] = useState(false);

    const [dailyStats, setDailyStats] = useState([]);
    const [loadingDailyStats, setLoadingDailyStats] = useState(false);
    const [dailyStatsError, setDailyStatsError] = useState("");

    const [todayStats, setTodayStats] = useState({ value: 0, count: 0 });

    // [CẬP NHẬT] State cho Top Selling
    const [topProducts, setTopProducts] = useState([]);
    const [loadingTopProducts, setLoadingTopProducts] = useState(false);

    const loadTables = async () => {
        setLoadingTables(true);
        try {
            const data = await fetchTables(token);
            setTables(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTables(false);
        }
    };

    const loadDailyStats = async () => {
        setLoadingDailyStats(true);
        setDailyStatsError("");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Tạo mảng 7 ngày gần nhất
        const dates = Array.from({ length: 7 }, (_, idx) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - idx));
            return date;
        });

        try {
            const stats = await Promise.all(
                dates.map(async (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const iso = `${year}-${month}-${day}`;
                    // Gọi API lấy doanh thu từng ngày
                    const response = await fetchDailyOrderStats(iso, token);
                    return {
                        key: iso,
                        label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
                        value: Number(response?.totalAmount ?? 0),
                        count: Number(response?.orderCount ?? 0),
                    };
                })
            );
            setDailyStats(stats);
            // Lấy stats của ngày cuối cùng (hôm nay) để hiển thị lên thẻ
            const latest = stats[stats.length - 1] || { value: 0, count: 0 };
            setTodayStats({ value: latest.value, count: latest.count });
        } catch (err) {
            setDailyStatsError("Không thể tải thống kê doanh thu");
            setDailyStats([]);
        } finally {
            setLoadingDailyStats(false);
        }
    };

    // [CẬP NHẬT] Hàm load top products từ Server
    const loadTopProducts = async () => {
        setLoadingTopProducts(true);
        try {
            const data = await fetchTopSellingProducts(5, token); // Lấy top 5
            setTopProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi tải top sản phẩm:", err);
        } finally {
            setLoadingTopProducts(false);
        }
    };

    useEffect(() => {
        if(token) {
            loadTables();
            loadDailyStats();
            loadTopProducts(); // Gọi hàm mới
        }
    }, [token]);

    const totalRevenue = todayStats.value;
    const todaysOrderCount = todayStats.count;
    const busyTables = tables.filter((table) => table.status === 1).length;

    const getBadgeClassByStatus = (status) => status === 1 ? "bg-secondary-subtle text-secondary" : status === 0 ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning";
    const roleLabel = (Array.isArray(auth?.user?.roles) && auth.user.roles.length ? auth.user.roles.join(", ") : auth?.user?.role) || "N/A";

    return (
        <div>
            <PageHeader
                title="Tổng quan"
                subtitle="Tình hình kinh doanh hôm nay"
                right={<button className="btn btn-success btn-sm">Xuất báo cáo</button>}
            />

            <div className="alert alert-success d-flex align-items-center gap-3 shadow-sm border-0 mb-4" role="alert" style={{backgroundColor: '#d1e7dd', color: '#0f5132'}}>
                <span className="bi bi-check-circle-fill" style={{fontSize: '1.5rem'}}></span>
                <div>
                    <h6 className="alert-heading fw-bold mb-0">Đăng nhập thành công!</h6>
                    <small>
                        Chào mừng <strong>{auth?.user?.fullname}</strong> quay trở lại. Vai trò: <span className="badge bg-success">{roleLabel}</span>
                    </small>
                </div>
            </div>

            <div className="row g-3 mb-3">
                <div className="col-md-4">
                    <StatCard label="Doanh thu hôm nay" value={loadingDailyStats ? "..." : formatCurrency(totalRevenue)} sub={dailyStatsError || (!loadingDailyStats && `${todaysOrderCount} hóa đơn`)} />
                </div>
                <div className="col-md-4">
                    <StatCard label="Số hóa đơn hôm nay" value={loadingDailyStats ? "..." : `${todaysOrderCount} đơn`} sub={dailyStatsError || "Tổng số đơn đã thanh toán"} />
                </div>
                <div className="col-md-4">
                    <StatCard label="Bàn đang phục vụ" value={loadingTables ? "..." : `${busyTables} / ${tables.length}`} sub={loadingTables ? "..." : `${Math.round((busyTables / (tables.length || 1)) * 100)}% công suất`} />
                </div>
            </div>

            <div className="row g-3">
                {/* Biểu đồ bên trái */}
                <div className="col-md-8">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            {loadingDailyStats ? <div className="text-muted small text-center py-5">Đang tải biểu đồ...</div> : <DailyRevenueBarChart data={dailyStats} />}
                        </div>
                    </div>
                </div>

                {/* Cột bên phải: Top Sản Phẩm & Trạng Thái Bàn */}
                <div className="col-md-4">
                    {/* [CẬP NHẬT] Hiển thị Top Products từ Server */}
                    <div className="card shadow-sm border-0 mb-3">
                        <div className="card-body">
                            <h6 className="mb-3 border-bottom pb-2">🔥 Top bán chạy</h6>
                            {loadingTopProducts ? <div className="text-muted small">Đang tải...</div> : (
                                topProducts.length === 0 ? <div className="text-muted small">Chưa có dữ liệu bán hàng</div> :
                                <ul className="list-group list-group-flush small">
                                    {topProducts.map((p, idx) => (
                                        <li className="list-group-item d-flex justify-content-between px-0 align-items-center" key={p.productId || idx}>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className={`badge rounded-pill ${idx === 0 ? 'bg-warning text-dark' : 'bg-light text-secondary border'}`}>{idx + 1}</span>
                                                <span className="fw-semibold text-truncate" style={{maxWidth: '140px'}} title={p.productName}>{p.productName}</span>
                                            </div>
                                            <span className="text-success fw-bold">{Number(p.totalSold)} đã bán</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0">Trạng thái bàn</h6>
                                <button className="btn btn-outline-secondary btn-sm" onClick={loadTables} disabled={loadingTables}><i className="bi bi-arrow-clockwise"></i></button>
                            </div>
                            {loadingTables ? <div className="text-muted small">Đang tải...</div> : (
                                <div className="d-flex flex-wrap gap-2">
                                    {tables.map((t) => (
                                        <span key={t.tableId || t.tableNumber} className={`badge rounded-pill px-3 py-2 ${getBadgeClassByStatus(t.status)}`}>
                                            {t.tableNumber || "?"}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}