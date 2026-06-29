export default function InfoTile({
    icon,
    title,
    value,
    subtitle,
    action,
    onClick
}) {
    return (
        <button
            type="button"
            className="eg-info-tile"
            onClick={onClick}
        >
            <div className="eg-info-icon">
                {icon}
            </div>

            <div className="eg-info-content">
                <p className="eg-info-title">
                    {title}
                </p>

                <h3 className="eg-info-value">
                    {value}
                </h3>

                {subtitle && (
                    <p className="eg-info-subtitle">
                        {subtitle}
                    </p>
                )}
            </div>

            {action && (
                <span className="eg-info-action">
                    {action}
                </span>
            )}
        </button>
    )
}