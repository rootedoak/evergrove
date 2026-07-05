export default function AdminCard({ eyebrow, title, children, actions }) {
    return (
        <section className="admin-card">
            {(eyebrow || title || actions) && (
                <div className="admin-card-header">
                    <div>
                        {eyebrow && (
                            <p className="admin-section-label">
                                {eyebrow}
                            </p>
                        )}

                        {title && <h2>{title}</h2>}
                    </div>

                    {actions && (
                        <div className="admin-card-actions">
                            {actions}
                        </div>
                    )}
                </div>
            )}

            {children}
        </section>
    )
}