import { useState } from "react"

export default function HouseholdFeedCard({
    feedEvents = [],
    loading = false,
}) {
    const [showAll, setShowAll] = useState(false)

    const visibleFeedEvents = showAll
        ? feedEvents
        : feedEvents.slice(0, 5)

    function getActorName(event) {
        return event.actor?.name || "Someone"
    }

    function getMetaText(event) {
        const actorName = getActorName(event)

        switch (event.event_type) {
            case "announcement_posted":
                return `${actorName} posted`

            case "task_completed":
                return `${actorName} completed`

            case "task_created":
                return `${actorName} created a task`

            case "activity_created":
                return `${actorName} added an activity`

            case "trip_created":
                return `${actorName} added a trip`

            case "meal_planned":
                return `${actorName} planned a meal`

            case "school_item_created":
                return `${actorName} added a school item`

            default:
                return actorName
        }
    }

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

        const now = new Date()
        const date = new Date(dateString)

        const seconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000
        )

        if (seconds < 60) return "Now"

        const minutes = Math.floor(seconds / 60)

        if (minutes < 60) return `${minutes}m`

        const hours = Math.floor(minutes / 60)

        if (hours < 24) return `${hours}h`

        const days = Math.floor(hours / 24)

        if (days === 1) return "1d"

        if (days < 7) return `${days}d`

        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        })
    }

    return (
        <section className="dashboard-card household-feed-card">
            <div className="card-header">
                <div>
                    <h2>Household Activity</h2>
                    <p>Recent updates from your household.</p>
                </div>
            </div>

            {loading ? (
                <p className="muted-text">Loading feed...</p>
            ) : feedEvents.length === 0 ? (
                <p className="muted-text">No activity yet.</p>
            ) : (
                <>
                    <div className="feed-list">
                        {visibleFeedEvents.map((event) => (
                            <article key={event.id} className="feed-row">
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

                                    <div className="feed-meta">
                                        {getMetaText(event)}
                                        {event.description
                                            ? ` • ${event.description}`
                                            : ""}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {feedEvents.length > 5 && (
                        <button
                            type="button"
                            className="feed-view-all-button"
                            onClick={() => setShowAll((current) => !current)}
                        >
                            {showAll ? "Show less" : "View all activity"}
                        </button>
                    )}
                </>
            )}
        </section>
    )
}