// src/components/StatCard.jsx
export default function StatCard({ label, value, sub }) {
    return (
        <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
                <div className="text-muted small mb-1">{label}</div>
                <div className="h4 mb-1">{value}</div>
                {sub && <div className="small text-success">{sub}</div>}
            </div>
        </div>
    );
}
