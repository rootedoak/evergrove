export default function AdminBadge({ badge }) {
    return (
        <span
            className={`admin-badge admin-badge-${badge.variant}`}
        >
            {badge.label}
        </span>
    )
}