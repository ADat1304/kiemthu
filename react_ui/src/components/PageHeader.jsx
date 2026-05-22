// src/components/PageHeader.jsx
export default function PageHeader({ title, subtitle, right }) {
    return (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
            <div>
                <h4 className="mb-1">{title}</h4>
                {subtitle && <small className="text-muted">{subtitle}</small>}
            </div>
            {right && <div className="flex-shrink-0">{right}</div>}
        </div>
    );
}
