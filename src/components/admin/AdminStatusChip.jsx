export default function AdminStatusChip({ status = "neutral", children }) {
    return (
        <span className={`admin-status-chip ${status}`}>
            {children}
        </span>
    )
}