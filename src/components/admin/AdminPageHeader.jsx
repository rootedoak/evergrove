export default function AdminPageHeader({ eyebrow, title, description, actions }) {
    return (
        <div className="admin-page-header">
            <div>
                {eyebrow && (
                    <p className="admin-section-label">
                        {eyebrow}
                    </p>
                )}

                <h1>{title}</h1>

                {description && (
                    <p>{description}</p>
                )}
            </div>

            {actions && (
                <div className="admin-page-header-actions">
                    {actions}
                </div>
            )}
        </div>
    )
}