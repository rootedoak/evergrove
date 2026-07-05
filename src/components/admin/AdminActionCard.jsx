export default function AdminActionCard({ title, description }) {
    return (
        <div className="admin-action-card">
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    )
}