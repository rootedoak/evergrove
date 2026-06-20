export default function HouseholdFeedCard({
    feedEvents = [],
    loading = false,
}) {
    function getIcon(eventType) {
        switch (eventType) {
            case "announcement_posted":
                return "📢"

            case "task_completed":
                return "✅"

            case "task_created":
                return "📝"

            case "activity_created":
                return "🏃"

            case "trip_created":
                return "✈️"

            case "meal_planned":
                return "🍽️"

            case "school_item_created":
                return "🎓"

            default:
                return "•"
        }
    }

    function formatDate(dateString) {
        if (!dateString) return ""

        return new Date(dateString).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        })
    }

    return (
        <section className="dashboard-card household-feed-card">
            <div className="card-header">
                <div>
                    <h2>Household Feed</h2>
                    <p>Recent family activity.</p>
                </div>
            </div>

            {loading ? (
                <p className="muted-text">
                    Loading feed...
                </p>
            ) : feedEvents.length === 0 ? (
                <p className="muted-text">
                    No activity yet.
                </p>
            ) : (
                <div className="feed-list">
                    {feedEvents.map((event) => (
                        <article
                            key={event.id}
                            className="feed-item"
                        >
                            <div className="feed-icon">
                                {getIcon(event.event_type)}
                            </div>

                            <div className="feed-content">
                                <div className="feed-title-row">
                                    <strong>{event.title}</strong>

                                    <span className="feed-date">
                                        {formatDate(event.created_at)}
                                    </span>
                                </div>

                                {event.description && (
                                    <p>{event.description}</p>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}