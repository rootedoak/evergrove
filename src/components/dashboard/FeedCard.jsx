import SectionCard from "../ui/SectionCard"
import Avatar from "../ui/Avatar"

export default function FeedCard({
    feedEvents = [],
    loading = false,
    onViewAll,
}) {
    const visibleEvents = Array.isArray(feedEvents)
        ? feedEvents.slice(0, 4)
        : []

    return (
        <SectionCard
            title="Household"
            action={
                visibleEvents.length > 0 && (
                    <button
                        type="button"
                        className="eg-text-button"
                        onClick={onViewAll}
                    >
                        View all
                    </button>
                )
            }
        >

            {loading ? (
                <p className="eg-empty-text">Loading household activity...</p>
            ) : visibleEvents.length === 0 ? (
                <p className="eg-empty-text">No household updates yet.</p>
            ) : (
                <div className="eg-feed-list">
                    {visibleEvents.map(event => (
                        <FeedRow key={event.id} event={event} />
                    ))}
                </div>
            )}
        </SectionCard>
    )
}

function FeedRow({ event }) {
    const actor = getActorName(event)
    const avatarUrl = getAvatarUrl(event)
    const sentence = getFeedSentence(event, actor)
    const timestamp = getRelativeTime(event.created_at || event.inserted_at || event.updated_at)

    return (
        <div className="eg-feed-row">
            <Avatar
                member={{
                    name: actor,
                    avatar_url: avatarUrl
                }}
                size="sm"
            />

            <div className="eg-feed-content">
                <p>{sentence}</p>

                {timestamp && (
                    <small>{timestamp}</small>
                )}
            </div>
        </div>
    )
}

function getActorName(event) {
    return (
        event.actor?.name ||
        event.actor_name ||
        event.created_by_name ||
        event.family_member_name ||
        event.family_members?.name ||
        event.created_by_member?.name ||
        "Someone"
    )
}

function getAvatarUrl(event) {
    return (
        event.actor?.avatar_url ||
        event.actor_avatar_url ||
        event.avatar_url ||
        event.family_members?.avatar_url ||
        event.created_by_member?.avatar_url ||
        null
    )
}

function getInitials(name) {
    if (!name || name === "Someone") return "?"

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase()
}

function getFeedSentence(event, actor) {
    const type = String(event.event_type || event.type || "").toLowerCase()
    const title =
        event.title ||
        event.message ||
        event.content ||
        event.metadata?.title ||
        "Evergrove"

    if (type.includes("announcement")) return `${actor} posted an announcement`
    if (type.includes("task_completed")) return `${actor} completed ${title}`
    if (type.includes("task")) return `${actor} added ${title}`
    if (type.includes("meal")) return `${actor} planned ${title}`
    if (type.includes("trip")) return `${actor} added ${title}`
    if (type.includes("school")) return `${actor} added ${title}`
    if (type.includes("calendar")) return `${actor} added ${title}`

    return `${actor} updated ${title}`
}

function getRelativeTime(value) {
    if (!value) return ""

    const date = new Date(value)
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / 60000)

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
    })
}