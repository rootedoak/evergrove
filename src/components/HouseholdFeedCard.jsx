import useReactions from "../hooks/useReactions"
import ReactionBar from "./ReactionBar"

export default function HouseholdFeedCard({
    feedEvents = [],
    loading = false,
}) {
    const feedEventIds = feedEvents.map((event) => event.id)

    const {
        toggleReaction,
        getReactionSummary,
    } = useReactions("feed_event", feedEventIds)

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

        if (seconds < 60) {
            return "Just now"
        }

        const minutes = Math.floor(seconds / 60)

        if (minutes < 60) {
            return `${minutes} min ago`
        }

        const hours = Math.floor(minutes / 60)

        if (hours < 24) {
            return `${hours} hr ago`
        }

        const days = Math.floor(hours / 24)

        if (days === 1) {
            return "Yesterday"
        }

        if (days < 7) {
            return `${days} days ago`
        }

        return date.toLocaleDateString(undefined, {
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
                <p className="muted-text">Loading feed...</p>
            ) : feedEvents.length === 0 ? (
                <p className="muted-text">No activity yet.</p>
            ) : (
                <div className="feed-list">
                    {feedEvents.map((event) => (
                        <article key={event.id} className="feed-item">
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

                                <ReactionBar
                                    targetId={event.id}
                                    summary={getReactionSummary(event.id)}
                                    onToggle={toggleReaction}
                                />
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}