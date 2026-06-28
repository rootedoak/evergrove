import StatusBadge from "./StatusBadge"

export default function SectionCard({
    title,
    subtitle,
    count,
    action,
    children,
    className = "",
}) {
    return (
        <section className={`eg-card ${className}`}>
            <div className="eg-row-between">
                <div>
                    <h2 className="eg-section-title">{title}</h2>

                    {subtitle && (
                        <p className="eg-section-subtitle">{subtitle}</p>
                    )}
                </div>

                {action || typeof count === "number" ? (
                    action || (
                        <StatusBadge tone={count > 0 ? "primary" : "neutral"}>
                            {count}
                        </StatusBadge>
                    )
                ) : null}
            </div>

            {children && (
                <div className="eg-section-content">
                    {children}
                </div>
            )}
        </section>
    )
}