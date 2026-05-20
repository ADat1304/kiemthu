// src/pages/RevenueReport.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import { fetchOrders, fetchRevenue } from "../utils/api.js";
import { getAuth } from "../utils/auth.js";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

const toIsoDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

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

const formatCompact = (value) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return String(value);
};

const RevenueBarChart = ({ data, preset: chartPreset }) => {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(600);

    useEffect(() => {
        if (containerRef.current) {
            const updateWidth = () => {
                setContainerWidth(containerRef.current.offsetWidth);
            };
            updateWidth();
            window.addEventListener('resize', updateWidth);
            return () => window.removeEventListener('resize', updateWidth);
        }
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="revenue-chart-empty">
                <i className="bi bi-bar-chart-line" style={{ fontSize: 48, color: '#d1d5db' }} />
                <p style={{ color: '#9ca3af', marginTop: 12 }}>Chưa có dữ liệu trong khoảng thời gian này</p>
            </div>
        );
    }

    const maxValue = Math.max(...data.map((d) => d.revenue), 1);
    const niceMax = (() => {
        const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
        const normalized = maxValue / magnitude;
        const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
        return nice * magnitude;
    })();

    const svgHeight = chartPreset === 'month' ? 340 : 320;
    const margin = { top: 32, right: 20, bottom: chartPreset === 'month' ? 68 : 56 };
    const innerHeight = svgHeight - margin.top - margin.bottom;
    const yAxisWidth = 64; // Cố định chiều rộng trục tung

    // Bước nhảy tối thiểu cho mỗi cột để tránh cột bị quá hẹp
    const minStep = data.length <= 1 ? 200 : data.length <= 5 ? 140 : data.length <= 7 ? 100 : Math.max(64, Math.min(88, 600 / data.length));
    const minInnerWidth = data.length * minStep;

    // Chiều rộng vẽ đồ thị khả dụng thực tế trong container (trừ margin phải)
    const availableInnerWidth = Math.max(0, containerWidth - margin.right - 4);

    // Chiều rộng vẽ đồ thị thực tế: tự động co giãn hết cỡ nếu ít cột, nhưng vẫn cho phép cuộn ngang nếu nhiều cột
    const innerWidth = Math.max(minInnerWidth, availableInnerWidth);
    const step = innerWidth / Math.max(data.length, 1);

    const svgWidth = innerWidth + margin.right;
    const barWidth = data.length <= 1 ? 80 : data.length <= 5 ? 56 : data.length <= 7 ? 44 : Math.min(36, step * 0.55);
    const baselineY = margin.top + innerHeight;
    const tickCount = 5;
    const ticks = Array.from({ length: tickCount }, (_, i) => ((i + 1) / tickCount) * niceMax);

    const handleBarHover = (idx, e) => {
        setHoveredIdx(idx);
        if (e) {
            const rect = e.currentTarget.closest('.revenue-chart-scroll')?.getBoundingClientRect();
            if (rect) {
                setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }
        }
    };

    const hoveredDay = hoveredIdx !== null ? data[hoveredIdx] : null;

    return (
        <div className="revenue-chart-wrapper">
            <div className="d-flex" style={{ position: 'relative' }}>
                {/* TRỤC TUNG CỐ ĐỊNH BÊN TRÁI */}
                <div
                    className="revenue-y-axis"
                    style={{
                        width: `${yAxisWidth}px`,
                        flexShrink: 0,
                        background: 'var(--bg-card, #ffffff)',
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    <svg
                        width={yAxisWidth}
                        height={svgHeight}
                        style={{ display: 'block', overflow: 'visible' }}
                    >
                        {/* Đường trục tung cố định */}
                        <line
                            x1={yAxisWidth - 1}
                            y1={margin.top}
                            x2={yAxisWidth - 1}
                            y2={baselineY}
                            stroke="#cbd5e1"
                            strokeWidth="1.5"
                        />

                        {/* Các vạch chia và nhãn trên trục tung */}
                        {ticks.map((tickVal, i) => {
                            const y = margin.top + innerHeight * (1 - tickVal / niceMax);
                            return (
                                <g key={i}>
                                    {/* Vạch nhỏ chỉ vào đồ thị */}
                                    <line
                                        x1={yAxisWidth - 5}
                                        y1={y}
                                        x2={yAxisWidth - 1}
                                        y2={y}
                                        stroke="#cbd5e1"
                                        strokeWidth="1.2"
                                    />
                                    <text
                                        x={yAxisWidth - 8}
                                        y={y + 3}
                                        textAnchor="end"
                                        fontSize="10"
                                        fill="#9ca3af"
                                        fontFamily="'Be Vietnam Pro', sans-serif"
                                        fontWeight="500"
                                    >
                                        {formatCompact(Math.round(tickVal))}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* PHẦN ĐỒ THỊ CUỘN NGANG BÊN PHẢI */}
                <div
                    ref={containerRef}
                    className="revenue-chart-scroll flex-grow-1"
                    style={{
                        position: 'relative',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        ...(data.length <= 2 && { display: 'flex', justifyContent: 'center' }),
                    }}
                    onMouseLeave={() => setHoveredIdx(null)}
                >
                    <svg
                        width={svgWidth}
                        height={svgHeight}
                        className="revenue-chart-svg"
                        style={{ display: 'block', overflow: 'visible' }}
                    >
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34d399" />
                                <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                            <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6ee7b7" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                            </linearGradient>
                            <filter id="barShadow" x="-20%" y="-10%" width="140%" height="130%">
                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#059669" floodOpacity="0.25" />
                            </filter>
                            <filter id="barGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#34d399" floodOpacity="0.4" />
                            </filter>
                        </defs>

                        {/* Vùng đổ màu gradient phía dưới đường nối đỉnh cột */}
                        <path
                            d={(() => {
                                let path = `M ${step / 2} ${baselineY}`;
                                data.forEach((day, idx) => {
                                    const ratio = day.revenue / niceMax;
                                    const cx = idx * step + step / 2;
                                    const cy = baselineY - (day.revenue ? innerHeight * ratio : 0);
                                    path += ` L ${cx} ${cy}`;
                                });
                                const lastX = (data.length - 1) * step + step / 2;
                                path += ` L ${lastX} ${baselineY} Z`;
                                return path;
                            })()}
                            fill="url(#areaGradient)"
                        />

                        {/* Đường lưới ngang (Grid lines) */}
                        {ticks.map((tickVal, i) => {
                            const y = margin.top + innerHeight * (1 - tickVal / niceMax);
                            return (
                                <g key={i}>
                                    <line
                                        x1={0}
                                        y1={y}
                                        x2={innerWidth}
                                        y2={y}
                                        stroke="#e5e7eb"
                                        strokeWidth="1"
                                        strokeDasharray="6 4"
                                        opacity="0.7"
                                    />
                                </g>
                            );
                        })}

                        {/* Đường trục hoành (X-axis baseline) */}
                        <line
                            x1={0}
                            y1={baselineY}
                            x2={innerWidth + margin.right}
                            y2={baselineY}
                            stroke="#d1d5db"
                            strokeWidth="1.5"
                        />

                        {/* Vẽ các cột (Bars) */}
                        {data.map((day, idx) => {
                            const ratio = day.revenue / niceMax;
                            const barHeight = day.revenue ? innerHeight * ratio : 0;
                            const x = idx * step + (step - barWidth) / 2;
                            const y = baselineY - barHeight;
                            const centerX = idx * step + step / 2;
                            const isHovered = hoveredIdx === idx;
                            const animDelay = `${idx * 40}ms`;

                            return (
                                <g key={day.date}>
                                    {/* Cột sáng nền khi hover */}
                                    <rect
                                        x={idx * step}
                                        y={margin.top}
                                        width={step}
                                        height={innerHeight}
                                        fill={isHovered ? '#f0fdf4' : 'transparent'}
                                        opacity={isHovered ? 1 : 0}
                                        rx="6"
                                        style={{ transition: 'opacity 0.15s ease' }}
                                    />

                                    {/* Cột chính */}
                                    {day.revenue > 0 && (
                                        <rect
                                            x={x}
                                            y={y}
                                            width={barWidth}
                                            height={barHeight}
                                            rx="6"
                                            ry="6"
                                            fill={isHovered ? 'url(#barGradientHover)' : 'url(#barGradient)'}
                                            filter={isHovered ? 'url(#barGlow)' : 'url(#barShadow)'}
                                            className="revenue-bar"
                                            style={{
                                                animationDelay: animDelay,
                                                transformOrigin: `${centerX}px ${baselineY}px`,
                                                transition: 'fill 0.2s ease, filter 0.2s ease',
                                            }}
                                        />
                                    )}

                                    {/* Nhãn doanh thu trên đầu cột */}
                                    {day.revenue > 0 && (
                                        <text
                                            x={centerX}
                                            y={y - 10}
                                            textAnchor="middle"
                                            fontSize="11"
                                            fontWeight="600"
                                            fill={isHovered ? '#059669' : '#6b7280'}
                                            fontFamily="'Be Vietnam Pro', sans-serif"
                                            className="revenue-bar-label"
                                            style={{ animationDelay: animDelay, transition: 'fill 0.2s ease' }}
                                        >
                                            {formatCompact(day.revenue)}
                                        </text>
                                    )}

                                    {/* Chỉ báo chấm tròn khi doanh thu bằng 0 */}
                                    {day.revenue === 0 && (
                                        <circle
                                            cx={centerX}
                                            cy={baselineY - 3}
                                            r="3"
                                            fill="#d1d5db"
                                        />
                                    )}

                                    {/* Vùng nhận diện hover chuột */}
                                    <rect
                                        x={idx * step}
                                        y={margin.top}
                                        width={step}
                                        height={innerHeight + margin.bottom}
                                        fill="transparent"
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={(e) => handleBarHover(idx, e)}
                                        onMouseMove={(e) => handleBarHover(idx, e)}
                                    />

                                    {/* Nhãn trục hoành (ngày/tuần và số đơn) */}
                                    {(() => {
                                        const match = day.label.match(/^(Tuần \d+)\s*\((.+)\)$/);
                                        if (match) {
                                            return (
                                                <>
                                                    <text x={centerX} y={baselineY + 16} textAnchor="middle" fontSize="11"
                                                        fontWeight={isHovered ? '600' : '500'} fill={isHovered ? '#1f2937' : '#374151'}
                                                        fontFamily="'Be Vietnam Pro', sans-serif" style={{ transition: 'fill 0.2s ease' }}>
                                                        {match[1]}
                                                    </text>
                                                    <text x={centerX} y={baselineY + 30} textAnchor="middle" fontSize="9"
                                                        fill={isHovered ? '#059669' : '#9ca3af'} fontFamily="'Be Vietnam Pro', sans-serif"
                                                        style={{ transition: 'fill 0.2s ease' }}>
                                                        {match[2]}
                                                    </text>
                                                    <text x={centerX} y={baselineY + 44} textAnchor="middle" fontSize="9"
                                                        fill={isHovered ? '#059669' : '#9ca3af'} fontFamily="'Be Vietnam Pro', sans-serif"
                                                        style={{ transition: 'fill 0.2s ease' }}>
                                                        {day.orders} đơn
                                                    </text>
                                                </>
                                            );
                                        }
                                        return (
                                            <>
                                                <text x={centerX} y={baselineY + 18} textAnchor="middle" fontSize="11"
                                                    fontWeight={isHovered ? '600' : '400'} fill={isHovered ? '#1f2937' : '#6b7280'}
                                                    fontFamily="'Be Vietnam Pro', sans-serif" style={{ transition: 'fill 0.2s ease' }}>
                                                    {day.label}
                                                </text>
                                                <text x={centerX} y={baselineY + 34} textAnchor="middle" fontSize="9"
                                                    fill={isHovered ? '#059669' : '#9ca3af'} fontFamily="'Be Vietnam Pro', sans-serif"
                                                    style={{ transition: 'fill 0.2s ease' }}>
                                                    {day.orders} đơn
                                                </text>
                                            </>
                                        );
                                    })()}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Ô thông tin nhỏ (Tooltip) */}
                    {hoveredDay && (
                        <div
                            className="revenue-chart-tooltip"
                            style={{
                                left: Math.min(tooltipPos.x, (containerRef.current?.offsetWidth || svgWidth) - 200),
                                top: Math.max(tooltipPos.y - 90, 8),
                            }}
                        >
                            <div className="revenue-chart-tooltip-date">{hoveredDay.label}</div>
                            <div className="revenue-chart-tooltip-row">
                                <span className="revenue-chart-tooltip-dot" style={{ background: '#10b981' }} />
                                <span>Doanh thu</span>
                                <strong>{formatCurrency(hoveredDay.revenue)}</strong>
                            </div>
                            <div className="revenue-chart-tooltip-row">
                                <span className="revenue-chart-tooltip-dot" style={{ background: '#6366f1' }} />
                                <span>Số đơn</span>
                                <strong>{hoveredDay.orders}</strong>
                            </div>
                        </div>
                    )}
                </div>
            </div>
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

    // Auto-run report when preset or date range changes (after initial load)
    const hasLoadedOnce = useRef(false);
    useEffect(() => {
        if (!hasLoadedOnce.current) return; // skip first render, loadOrders handles it
        if (orders.length === 0) return;
        if (preset === "custom") return; // custom requires manual click
        handleRunReport();
    }, [preset, startDate, endDate]);

    // Mark that initial load is done
    useEffect(() => {
        if (orders.length > 0) hasLoadedOnce.current = true;
    }, [orders]);

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
            const weekdayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const dailyRows = dateList.map((dateKey) => {
                const stats = dayMap.get(dateKey) || { revenue: 0, orders: 0 };
                const d = new Date(dateKey + 'T00:00:00');
                const dayMonth = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
                const label = preset === "week"
                    ? `${weekdayNames[d.getDay()]} (${dayMonth})`
                    : preset === "today"
                        ? d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : dayMonth;
                return { date: dateKey, label, revenue: stats.revenue, orders: stats.orders };
            });

            const totalOrders = closedOrders.length;
            const revenueFromOrders = dailyRows.reduce((sum, item) => sum + item.revenue, 0);

            // Group by week for month preset
            let processedRows;
            if (preset === "month") {
                const weeks = [];
                let currentWeek = null;
                let currentMondayKey = null;

                dailyRows.forEach((row) => {
                    const d = new Date(row.date + 'T00:00:00');
                    const dayOfWeek = d.getDay();
                    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    const monday = new Date(d);
                    monday.setDate(d.getDate() - mondayOffset);
                    const mondayKey = toIsoDate(monday);

                    if (mondayKey !== currentMondayKey) {
                        currentMondayKey = mondayKey;
                        currentWeek = {
                            date: mondayKey,
                            label: '',
                            revenue: 0,
                            orders: 0,
                            _days: [],
                        };
                        weeks.push(currentWeek);
                    }

                    currentWeek.revenue += row.revenue;
                    currentWeek.orders += row.orders;
                    currentWeek._days.push(row);
                });

                weeks.forEach((week, i) => {
                    const first = week._days[0];
                    const last = week._days[week._days.length - 1];
                    const fDate = new Date(first.date + 'T00:00:00');
                    const lDate = new Date(last.date + 'T00:00:00');
                    const fLabel = fDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                    const lLabel = lDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                    week.label = `Tuần ${i + 1} (${fLabel}–${lLabel})`;
                });

                processedRows = weeks;
            } else {
                processedRows = dailyRows;
            }

            setReportRows(processedRows);
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
                                <RevenueBarChart data={reportRows} preset={preset} />
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
                                        {reportRows.length} {preset === "month" ? "tuần" : "ngày"}
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
                                                <th>{preset === "month" ? "Tuần" : preset === "week" ? "Thứ" : "Ngày"}</th>
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