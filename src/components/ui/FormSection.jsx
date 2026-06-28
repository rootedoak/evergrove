export default function FormSection({
    title,
    children,
}) {
    return (
        <div className="eg-form-section">
            {title && (
                <h3>{title}</h3>
            )}

            <div className="eg-form-stack">
                {children}
            </div>
        </div>
    )
}