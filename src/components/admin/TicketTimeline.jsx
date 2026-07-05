import AdminEmptyState from "./AdminEmptyState"

export default function TicketTimeline({ history = [], loading }) {
    if (loading) {
        return (
            <AdminEmptyState>
                Loading timeline...
            </AdminEmptyState>
        )
    }

    if (!history.length) {
        return (
            <AdminEmptyState>
                No timeline events yet.
            </AdminEmptyState>
        )
    }

    return (
        <div className="admin-ticket-timeline">
            {history.map(event => (
                <div
                    key={event.id}
                    className="admin-ticket-timeline-item"
                >
                    <div className="admin-ticket-timeline-dot" />

                    <div>
                        <strong>{event.title}</strong>

                        {event.description && (
                            <p>{event.description}</p>
                        )}

                        <span>
                            {formatDateTime(event.created_at)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}

function formatDateTime(value) {
    if (!value) return "—"

    return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    })
}