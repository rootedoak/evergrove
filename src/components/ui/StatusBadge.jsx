export default function StatusBadge({
    children,
    tone = "neutral",
}) {
    return (
        <span className={`eg-status-badge ${tone}`}>
            {children}
        </span>
    )
}