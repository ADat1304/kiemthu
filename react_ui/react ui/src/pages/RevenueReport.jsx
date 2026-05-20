// src/pages/RevenueReport.jsx
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import { fetchOrders, fetchRevenue } from "../utils/api.js";
import { getAuth } from "../utils/auth.js";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

const toIsoDate = (date) => date.toISOString().split("T")[0];

const getTodayRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { start: toIsoDate(today), end: toIsoDate(today) };
};

const getCurrentWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const mondayOffset = day === 0 ? 6 : day - 1;
    const start = new Date(today);
    start.setDate(today.getDate() - mondayOffset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(0, 0, 0, 0);
    return { start: toIsoDate(start), end: toIsoDate(end) };
};

const getCurrentMonthRange = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(0, 0, 0, 0);
    return { start: toIsoDate(start), end: toIsoDate(end) };
};

const buildDateRange = (start, end) => {
    const days = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    while (cursor <= endDate) {
        days.push(toIsoDate(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return days;
};

const RevenueBarChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="text-center text-muted small py-4">Chưa có dữ liệu trong khoảng thời gian này</div>;
    }

    const maxValue = Math.max(...data.map((d) => d.revenue), 1);
    const svgHeight = 280;
    const margin = { top: 24, right: 24, bottom: 42, left: 80 };
    const innerHeight = svgHeight - margin.top - margin.bottom;
    const innerWidth = Math.max(data.length * 76, 360);
    const svgWidth = innerWidth + margin.left + margin.right;
    const step = innerWidth / Math.max(data.length, 1);
    const barWidth = Math.min(34, step * 0.5);
    const baselineY = margin.top + innerHeight;
    const ticks = [0.25, 0.5, 0.75, 1];
    const fontFamily = "'Be Vietnam Pro', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    return (
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
                            <text x={margin.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#6c757d" style={{ fontFamily }}>
                                {formatCurrency(Math.round(value))}
                            </text>
                        </g>
                    );
                })}
                {data.map((day, idx) => {
                    const ratio = day.revenue / maxValue;
                    const barHeight = day.revenue ? innerHeight * ratio : 0;
                    const x = margin.left + idx * step + (step - barWidth) / 2;
                    const y = baselineY - barHeight;
                    const centerX = x + barWidth / 2;
                    return (
                        <g key={day.date}>
                            {day.revenue > 0 && (
                                <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" fill="#198754">
                                    <title>{`${day.label}: ${formatCurrency(day.revenue)} (${day.orders} đơn)`}</title>
                                </rect>
                            )}
                            {day.revenue > 0 && (
                                <text x={centerX} y={y - 6} textAnchor="middle" fontSize="11" fill="#495057" style={{ fontFamily }}>
                                    {formatCurrency(day.revenue)}
                                </text>
                            )}
                            <text x={centerX} y={baselineY + 16} textAnchor="middle" fontSize="11" fill="#343a40" style={{ fontFamily }}>
                                {day.label}
                            </text>
                            <text x={centerX} y={baselineY + 30} textAnchor="middle" fontSize="10" fill="#6c757d" style={{ fontFamily }}>
                                {day.orders} đơn
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default function RevenueReportPage() {
    const token = useMemo(() => getAuth()?.token, []);
    const todayRange = useMemo(() => getTodayRange(), []);

    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [ordersError, setOrdersError] = useState("");

    const [preset, setPreset] = useState("today");
    const [startDate, setStartDate] = useState(todayRange.start);
    const [endDate, setEndDate] = useState(todayRange.end);

    const [reportRows, setReportRows] = useState([]);
    const [summary, setSummary] = useState({ revenue: 0, count: 0, average: 0 });
    const [apiRevenue, setApiRevenue] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportError, setReportError] = useState("");
    const [lastUpdated, setLastUpdated] = useState("");

    const applyPresetRange = (key) => {
        setPreset(key);
        if (key === "custom") return;
        const range =
            key === "week"
                ? getCurrentWeekRange()
                : key === "month"
                    ? getCurrentMonthRange()
                    : getTodayRange();
        setStartDate(range.start);
        setEndDate(range.end);
    };

    const loadOrders = async () => {
        if (!token) return;
        setLoadingOrders(true);
        setOrdersError("");
        try {
            const data = await fetchOrders(token);
            const list = Array.isArray(data) ? data : [];
            setOrders(list);
            await handleRunReport(list); // Hiển thị báo cáo mặc định theo ngày hiện tại
        } catch (err) {
            console.error(err);
            setOrdersError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [token]);

    const buildRangeLabel = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startText = start.toLocaleDateString("vi-VN");
        const endText = end.toLocaleDateString("vi-VN");
        return startDate === endDate ? `Ngày ${startText}` : `Từ ${startText} - ${endText}`;
    };

    const handleRunReport = async (ordersSnapshot = orders) => {
        if (!startDate || !endDate) {
            setReportError("Vui lòng chọn đầy đủ 'Ngày bắt đầu' và 'Ngày kết thúc'.");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const normalizedStart = new Date(start);
        normalizedStart.setHours(0, 0, 0, 0);
        const normalizedEnd = new Date(end);
        normalizedEnd.setHours(23, 59, 59, 999);

        if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime())) {
            setReportError("Thời gian chọn không hợp lệ.");
            return;
        }

        if (normalizedStart > normalizedEnd) {
            setReportError("Thời gian chọn không hợp lệ: 'Ngày bắt đầu' lớn hơn 'Ngày kết thúc'.");
            return;
        }

        setReportError("");
        setLoadingReport(true);

        try {
            const closedOrders = (ordersSnapshot || []).filter((order) => {
                const status = String(order.status || "").toUpperCase();
                if (status !== "CLOSE") return false;
                const date = new Date(order.orderDate);
                if (Number.isNaN(date.getTime())) return false;
                return date >= normalizedStart && date <= normalizedEnd;
            });

            const dayMap = new Map();
            closedOrders.forEach((order) => {
                const dateKey = toIsoDate(new Date(order.orderDate));
                const existing = dayMap.get(dateKey) || { revenue: 0, orders: 0 };
                existing.revenue += Number(order.totalAmount || 0);
                existing.orders += 1;
                dayMap.set(dateKey, existing);
            });

            const dateList = buildDateRange(startDate, endDate);
            const dailyRows = dateList.map((dateKey) => {
                const stats = dayMap.get(dateKey) || { revenue: 0, orders: 0 };
                const label = new Date(dateKey).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                });
                return { date: dateKey, label, revenue: stats.revenue, orders: stats.orders };
            });

            const totalOrders = closedOrders.length;
            const revenueFromOrders = dailyRows.reduce((sum, item) => sum + item.revenue, 0);

            setReportRows(dailyRows);
            setSummary({
                revenue: revenueFromOrders,
                count: totalOrders,
                average: totalOrders ? revenueFromOrders / totalOrders : 0,
            });
            setLastUpdated(new Date().toLocaleString("vi-VN"));

            try {
                const officialRevenue = await fetchRevenue(startDate, endDate, token);
                setApiRevenue(Number(officialRevenue ?? 0));
            } catch (apiErr) {
                console.error("Không thể tải doanh thu tổng", apiErr);
                setApiRevenue(null);
            }
        } catch (err) {
            console.error(err);
            setReportError("Không thể tạo báo cáo, vui lòng thử lại.");
        } finally {
            setLoadingReport(false);
        }
    };

    const displayedRevenue = apiRevenue ?? summary.revenue;

    return (
        <div>
            <PageHeader
                title="Báo cáo doanh thu"
                subtitle="Xem tổng quan kinh doanh theo ngày, tuần, tháng hoặc khoảng thời gian tùy chọn"
                right={
                    <button className="btn btn-outline-success btn-sm" onClick={loadOrders} disabled={loadingOrders}>
                        <i className="bi bi-arrow-repeat me-1" />
                        Tải mới dữ liệu
                    </button>
                }
            />

            <div className="card shadow-sm border-0 mb-3">
                <div className="card-body">
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        <button
                            className={`btn btn-sm ${preset === "today" ? "btn-success" : "btn-outline-secondary"}`}
                            onClick={() => applyPresetRange("today")}
                        >
                            Hôm nay
                        </button>
                        <button
                            className={`btn btn-sm ${preset === "week" ? "btn-success" : "btn-outline-secondary"}`}
                            onClick={() => applyPresetRange("week")}
                        >
                            Tuần này
                        </button>
                        <button
                            className={`btn btn-sm ${preset === "month" ? "btn-success" : "btn-outline-secondary"}`}
                            onClick={() => applyPresetRange("month")}
                        >
                            Tháng này
                        </button>
                        <button
                            className={`btn btn-sm ${preset === "custom" ? "btn-success" : "btn-outline-secondary"}`}
                            onClick={() => applyPresetRange("custom")}
                        >
                            Tùy chọn
                        </button>
                    </div>

                    <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                            <label className="form-label small text-muted">Ngày bắt đầu</label>
                            <input
                                type="date"
                                className="form-control"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPreset("custom");
                                }}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small text-muted">Ngày kết thúc</label>
                            <input
                                type="date"
                                className="form-control"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPreset("custom");
                                }}
                            />
                        </div>
                        <div className="col-md-4 d-flex align-items-end gap-2">
                            <button className="btn btn-success flex-grow-1" onClick={() => handleRunReport()}>
                                <i className="bi bi-funnel me-1" />
                                Xem báo cáo
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    const range = getTodayRange();
                                    setStartDate(range.start);
                                    setEndDate(range.end);
                                    setPreset("today");
                                    handleRunReport();
                                }}
                                title="Đặt lại về hôm nay"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                    </div>
                    {(reportError || ordersError) && (
                        <div className="alert alert-warning small mt-3 mb-0">
                            <i className="bi bi-exclamation-triangle-fill me-2" />
                            {reportError || ordersError}
                        </div>
                    )}
                    {!reportError && !ordersError && (
                        <div className="text-muted small mt-2">
                            Khoảng thời gian áp dụng: <strong>{buildRangeLabel()}</strong>. Chỉ tính các hóa đơn đã
                            đóng (CLOSE).
                        </div>
                    )}
                </div>
            </div>

            <div className="row g-3 mb-3">
                <div className="col-md-4">
                    <StatCard
                        label="Tổng doanh thu"
                        value={loadingReport ? "..." : formatCurrency(displayedRevenue)}
                        sub={apiRevenue === null ? "Tính từ dữ liệu đơn hàng" : "Theo dữ liệu hệ thống"}
                    />
                </div>
                <div className="col-md-4">
                    <StatCard
                        label="Số hóa đơn"
                        value={loadingReport ? "..." : `${summary.count} đơn`}
                        sub="Đơn đã thanh toán trong khoảng thời gian"
                    />
                </div>
                <div className="col-md-4">
                    <StatCard
                        label="Giá trị trung bình/đơn"
                        value={loadingReport ? "..." : formatCurrency(summary.average)}
                        sub={summary.count ? "Tổng doanh thu chia cho số đơn" : "Chưa có dữ liệu trong khoảng thời gian"}
                    />
                </div>
            </div>

            <div className="row g-3">
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h6 className="mb-0">Biểu đồ doanh thu</h6>
                                    <small className="text-muted">{buildRangeLabel()}</small>
                                </div>
                                {lastUpdated && <span className="badge bg-light text-muted">Cập nhật: {lastUpdated}</span>}
                            </div>
                            {loadingReport ? (
                                <div className="text-center text-muted py-5">Đang tạo biểu đồ doanh thu...</div>
                            ) : (
                                <RevenueBarChart data={reportRows} />
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0">Bảng chi tiết</h6>
                                {reportRows.length > 0 && (
                                    <span className="badge text-bg-success-subtle text-success">
                                        {reportRows.length} ngày
                                    </span>
                                )}
                            </div>
                            {loadingReport ? (
                                <div className="text-center text-muted py-4 flex-grow-1">Đang tải dữ liệu...</div>
                            ) : reportRows.length === 0 ? (
                                <div className="text-center text-muted py-4 flex-grow-1">
                                    Không tìm thấy dữ liệu phù hợp
                                </div>
                            ) : (
                                <div className="table-responsive" style={{ maxHeight: 360 }}>
                                    <table className="table table-sm align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Ngày</th>
                                                <th className="text-end">Doanh thu</th>
                                                <th className="text-end">Số đơn</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportRows.map((row) => (
                                                <tr key={row.date}>
                                                    <td className="fw-semibold">{row.label}</td>
                                                    <td className="text-end text-success">{formatCurrency(row.revenue)}</td>
                                                    <td className="text-end">
                                                        <span className="badge bg-light text-dark">{row.orders}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="table-light">
                                            <tr>
                                                <th>Tổng</th>
                                                <th className="text-end">{formatCurrency(displayedRevenue)}</th>
                                                <th className="text-end">{summary.count} đơn</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}