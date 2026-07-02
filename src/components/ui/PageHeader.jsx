export default function PageHeader({
    eyebrow,
    title,
    subtitle,
    action
}) {
    return (
        <header className="eg-page-header">
            <div className="eg-page-header-content">
                {eyebrow && (
                    <p className="eg-page-eyebrow">{eyebrow}</p>
                )}

                <h1>{title}</h1>

                {subtitle && (
                    <p className="eg-page-subtitle">{subtitle}</p>
                )}
            </div>

            {action && (
                <div className="eg-page-header-action">
                    {action}
                </div>
            )}
        </header>
    )
}