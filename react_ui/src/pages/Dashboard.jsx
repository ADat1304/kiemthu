import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
// [CẬP NHẬT] Import thêm fetchTopSellingProducts, bỏ fetchProducts
import { fetchDailyOrderStats, fetchTables, fetchTopSellingProducts } from "../utils/api.js";
import { getAuth } from "../utils/auth.js";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

const formatCompact = (value) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return String(value);
};

// ... (Giữ nguyên component DailyRevenueBarChart) ...
const DailyRevenueBarChart = ({ data }) => {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const niceMax = (() => {
        const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
        const normalized = maxValue / magnitude;
        const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
        return nice * magnitude;
    })();

    const svgWidth = 600;
    const svgHeight = 280;
    const margin = { top: 32, right: 24, bottom: 44, left: 72 };
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;
    const step = innerWidth / Math.max(data.length, 1);
    const barWidth = Math.min(32, step * 0.45);
    const baselineY = margin.top + innerHeight;
    const tickCount = 4;
    const ticks = Array.from({ length: tickCount }, (_, i) => ((i + 1) / tickCount) * niceMax);

    const handleBarHover = (idx, e) => {
        setHoveredIdx(idx);
        if (e && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    const hoveredDay = hoveredIdx !== null ? data[hoveredIdx] : null;

    return (
        <div ref={containerRef} className="revenue-chart-wrapper" style={{ position: 'relative', width: '100%' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <span className="fw-bold text-dark h6 mb-0 d-block">Biểu đồ doanh thu</span>
                    <small className="text-muted">7 ngày gần nhất</small>
                </div>
            </div>
            <div className="position-relative" onMouseLeave={() => setHoveredIdx(null)}>
                <svg
                    width="100%"
                    height={svgHeight}
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="revenue-chart-svg"
                >
                    <defs>
                        <linearGradient id="dashBarGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="dashBarGradientHover" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                        <linearGradient id="dashAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="dashBarShadow" x="-20%" y="-10%" width="140%" height="130%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#059669" floodOpacity="0.2" />
                        </filter>
                        <filter id="dashBarGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#34d399" floodOpacity="0.3" />
                        </filter>
                    </defs>

                    {/* Area fill behind bars */}
                    <path
                        d={(() => {
                            let path = `M ${margin.left + step / 2} ${baselineY}`;
                            data.forEach((day, idx) => {
                                const ratio = day.value / niceMax;
                                const cx = margin.left + idx * step + step / 2;
                                const cy = baselineY - (day.value ? innerHeight * ratio : 0);
                                path += ` L ${cx} ${cy}`;
                            });
                            const lastX = margin.left + (data.length - 1) * step + step / 2;
                            path += ` L ${lastX} ${baselineY} Z`;
                            return path;
                        })()}
                        fill="url(#dashAreaGradient)"
                    />

                    {/* Grid lines */}
                    {ticks.map((tickVal, i) => {
                        const y = margin.top + innerHeight * (1 - tickVal / niceMax);
                        return (
                            <g key={i}>
                                <line
                                    x1={margin.left}
                                    y1={y}
                                    x2={svgWidth - margin.right}
                                    y2={y}
                                    stroke="#e2e8f0"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={margin.left - 10}
                                    y={y + 3}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#94a3b8"
                                    fontFamily="var(--font-main)"
                                    fontWeight="500"
                                >
                                    {formatCompact(Math.round(tickVal))}
                                </text>
                            </g>
                        );
                    })}

                    {/* Baseline (X-axis) */}
                    <line
                        x1={margin.left}
                        y1={baselineY}
                        x2={svgWidth - margin.right}
                        y2={baselineY}
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                    />
                    {/* Y-axis line */}
                    <line
                        x1={margin.left}
                        y1={margin.top}
                        x2={margin.left}
                        y2={baselineY}
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                    />

                    {/* Columns */}
                    {data.map((day, idx) => {
                        const ratio = day.value / niceMax;
                        const barHeight = day.value ? innerHeight * ratio : 0;
                        const x = margin.left + idx * step + (step - barWidth) / 2;
                        const y = baselineY - barHeight;
                        const centerX = margin.left + idx * step + step / 2;
                        const isHovered = hoveredIdx === idx;

                        return (
                            <g key={day.key}>
                                {/* Hover highlight column */}
                                <rect
                                    x={margin.left + idx * step}
                                    y={margin.top}
                                    width={step}
                                    height={innerHeight}
                                    fill={isHovered ? '#ecfdf5' : 'transparent'}
                                    opacity={isHovered ? 1 : 0}
                                    rx="6"
                                    style={{ transition: 'opacity 0.15s ease' }}
                                />

                                {/* Bar */}
                                {day.value > 0 && (
                                    <rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={barHeight}
                                        rx="6"
                                        fill={isHovered ? 'url(#dashBarGradientHover)' : 'url(#dashBarGradient)'}
                                        filter={isHovered ? 'url(#dashBarGlow)' : 'url(#dashBarShadow)'}
                                        className="revenue-bar"
                                        style={{
                                            transformOrigin: `${centerX}px ${baselineY}px`,
                                            transition: 'fill 0.2s ease, filter 0.2s ease',
                                        }}
                                    />
                                )}

                                {/* Dot if 0 */}
                                {day.value === 0 && (
                                    <circle
                                        cx={centerX}
                                        cy={baselineY - 3}
                                        r="3.5"
                                        fill="#cbd5e1"
                                    />
                                )}

                                {/* X label */}
                                <text
                                    x={centerX}
                                    y={baselineY + 20}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fontWeight={isHovered ? '600' : '500'}
                                    fill={isHovered ? '#059669' : '#475569'}
                                    fontFamily="var(--font-main)"
                                    style={{ transition: 'fill 0.2s ease' }}
                                >
                                    {day.label}
                                </text>

                                {/* Hit area for hover */}
                                <rect
                                    x={margin.left + idx * step}
                                    y={margin.top}
                                    width={step}
                                    height={innerHeight + margin.bottom}
                                    fill="transparent"
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={(e) => handleBarHover(idx, e)}
                                    onMouseMove={(e) => handleBarHover(idx, e)}
                                />
                            </g>
                        );
                    })}
                </svg>
                {data.every((d) => d.value === 0) && <div className="text-center text-muted small py-4">Chưa có doanh thu trong 7 ngày qua</div>}
            </div>

            {/* Floating tooltip */}
            {hoveredDay && (
                <div
                    className="revenue-chart-tooltip"
                    style={{
                        left: Math.min(tooltipPos.x, (containerRef.current?.offsetWidth || svgWidth) - 190),
                        top: Math.max(tooltipPos.y - 100, 8),
                    }}
                >
                    <div className="revenue-chart-tooltip-date">Ngày {hoveredDay.label}</div>
                    <div className="revenue-chart-tooltip-row">
                        <span className="revenue-chart-tooltip-dot" style={{ background: '#10b981' }} />
                        <span>Doanh thu</span>
                        <strong>{formatCurrency(hoveredDay.value)}</strong>
                    </div>
                    <div className="revenue-chart-tooltip-row">
                        <span className="revenue-chart-tooltip-dot" style={{ background: '#6366f1' }} />
                        <span>Số đơn</span>
                        <strong>{hoveredDay.count} đơn</strong>
                    </div>
                </div>
            )}
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