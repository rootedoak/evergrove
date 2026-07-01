import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { markFeedEventRead } from "../services/feedService"

import Avatar from "./ui/Avatar"

export default function HouseholdFeedCard({
    feedEvents = [],
    loading = false,
    readCounts = {},
}) {
    const [showAll, setShowAll] = useState(false)
    const [feedFilter, setFeedFilter] = useState("all")
    const navigate = useNavigate()

    const filteredFeedEvents = feedEvents.filter(matchesFeedFilter)

    const visibleFeedEvents = showAll
        ? filteredFeedEvents
        : filteredFeedEvents.slice(0, 5)

    useEffect(() => {
        async function markVisibleItemsRead() {
            if (!Array.isArray(visibleFeedEvents) || visibleFeedEvents.length === 0) {
                return
            }

            try {
                await Promise.all(
                    visibleFeedEvents.map(event =>
                        markFeedEventRead(event.id)
                    )
                )
            } catch (error) {
                console.error("Could not mark feed items read:", error)
            }
        }

        markVisibleItemsRead()
    }, [visibleFeedEvents])

    const filterOptions = [
        { key: "all", label: "All" },
        { key: "tasks", label: "Tasks" },
        { key: "meals", label: "Meals" },
        { key: "trips", label: "Trips" },
        { key: "school", label: "School" },
        { key: "announcements", label: "Announcements" }
    ]

    function matchesFeedFilter(event) {
        if (feedFilter === "all") return true

        if (feedFilter === "tasks") {
            return event.event_type === "task_created" ||
                event.event_type === "task_completed"
        }

        if (feedFilter === "meals") {
            return event.event_type === "meal_planned"
        }

        if (feedFilter === "trips") {
            return event.event_type === "trip_created"
        }

        if (feedFilter === "school") {
            return event.event_type === "school_item_created"
        }

        if (feedFilter === "announcements") {
            return event.event_type === "announcement_posted"
        }

        return true
    }

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

    function getDestination(event) {
        const type = event.event_type
        const metadata = event.metadata || {}

        if (type === "task_completed" || type === "task_created") {
            const taskId =
                metadata.task_id ||
                metadata.taskId ||
                event.reference_id ||
                event.related_id

            if (!taskId) return null

            return {
                path: "/tasks",
                state: {
                    taskId,
                    mode: type === "task_completed" ? "view" : "edit"
                }
            }
        }

        if (type === "meal_planned") {
            const mealPlanId =
                metadata.meal_plan_id ||
                metadata.mealPlanId ||
                event.reference_id ||
                event.related_id

            if (!mealPlanId) return null

            return {
                path: "/meals",
                state: {
                    mealPlanId
                }
            }
        }

        if (type === "calendar_event_created" || type === "calendar_event") {
            const calendarEventId =
                metadata.calendar_event_id ||
                metadata.calendarEventId ||
                event.related_id

            if (!calendarEventId) return null

            return {
                path: "/calendar",
                state: {
                    calendarEventId
                }
            }
        }

        if (type === "school_item_created") {
            const schoolItemId =
                metadata.school_item_id ||
                metadata.schoolItemId ||
                event.related_id

            if (!schoolItemId) return null

            return {
                path: "/school",
                state: {
                    schoolItemId
                }
            }
        }

        if (type === "trip_created") {
            const tripId =
                metadata.trip_id ||
                metadata.tripId ||
                event.related_id

            if (!tripId) return null

            return {
                path: "/trips",
                state: {
                    tripId
                }
            }
        }

        return null
    }

    function handleOpenEvent(event) {
        const destination = getDestination(event)

        if (!destination) return

        navigate(destination.path, {
            state: destination.state
        })
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

                <div className="feed-filter-row">
                    {filterOptions.map(option => (
                        <button
                            key={option.key}
                            type="button"
                            className={feedFilter === option.key ? "active" : ""}
                            onClick={() => {
                                setFeedFilter(option.key)
                                setShowAll(false)
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <div>
                    <h2>Household Activity</h2>
                    <p>Recent updates from your household.</p>
                </div>
            </div>

            {loading ? (
                <p className="muted-text">Loading feed...</p>
            ) : filteredFeedEvents.length === 0 ? (
                <p className="muted-text">No activity yet.</p>
            ) : (
                <>
                    <div className="feed-list">
                        {visibleFeedEvents.map(event => {
                            const destination = getDestination(event)
                            const RowElement = destination ? "button" : "article"

                            return (
                                <RowElement
                                    key={event.id}
                                    className={`feed-row ${destination ? "feed-row-clickable" : ""}`}
                                    type={destination ? "button" : undefined}
                                    onClick={destination ? () => handleOpenEvent(event) : undefined}
                                >
                                    <Avatar
                                        member={event.actor}
                                        size="sm"
                                        className="feed-avatar"
                                    />

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

                                        <div className="feed-seen-by">
                                            👀 Seen by {readCounts[event.id] || 0}
                                        </div>

                                    </div>
                                </RowElement>
                            )
                        })}
                    </div>

                    {filteredFeedEvents.length > 5 && (
                        <button
                            type="button"
                            className="feed-view-all-button"
                            onClick={() => setShowAll(current => !current)}
                        >
                            {showAll ? "Show less" : "View all activity"}
                        </button>
                    )}
                </>
            )}
        </section>
    )
}