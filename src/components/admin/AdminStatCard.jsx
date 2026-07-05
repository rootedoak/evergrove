export default function AdminStatCard({ label, value, helper }) {
    return (
        <div className="admin-stat-card">
            <p>{label}</p>
            <strong>{value}</strong>

            {helper && (
                <span className="admin-stat-helper">
                    {helper}
                </span>
            )}
        </div>
    )
}