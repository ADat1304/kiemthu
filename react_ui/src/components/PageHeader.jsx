// src/components/PageHeader.jsx
export default function PageHeader({ title, subtitle, right }) {
    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h4 className="mb-1">{title}</h4>
                {subtitle && <small className="text-muted">{subtitle}</small>}
            </div>
            {right}
        </div>
    );
}
