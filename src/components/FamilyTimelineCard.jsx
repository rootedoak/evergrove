import { buildFamilyTimeline } from "../utils/familyTimeline"

function formatTimelineDate(dateString) {
    if (!dateString) return ""

    return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
    })
}

function getEventTimestamp(event) {
    return new Date(`${event.date}T00:00:00`).getTime()
}

function sortTimelineEvents(a, b) {
    return getEventTimestamp(a) - getEventTimestamp(b)
}

function groupTimelineEvents(timeline) {
    const parentEvents = []
    const childEventsByParentId = {}
    const standardEvents = []

    timeline.forEach(event => {
        if (event.parent_activity_id) {
            if (!childEventsByParentId[event.parent_activity_id]) {
                childEventsByParentId[event.parent_activity_id] = []
            }

            childEventsByParentId[event.parent_activity_id].push(event)
            return
        }

        if (event.activity_id && childEventsByParentId[event.activity_id]) {
            parentEvents.push(event)
            return
        }

        standardEvents.push(event)
    })

    timeline.forEach(event => {
        if (!event.activity_id || event.parent_activity_id) return

        const children = childEventsByParentId[event.activity_id] || []

        if (children.length > 0) {
            const alreadyAdded = parentEvents.some(
                parentEvent => parentEvent.activity_id === event.activity_id
            )

            if (!alreadyAdded) {
                parentEvents.push(event)
            }
        }
    })

    const groups = parentEvents.map(parentEvent => {
        const children = childEventsByParentId[parentEvent.activity_id] || []

        return {
            id: `timeline-group-${parentEvent.activity_id}`,
            date: parentEvent.date,
            parentEvent,
            events: [parentEvent, ...children].sort(sortTimelineEvents)
        }
    })

    const groupedParentIds = new Set(
        groups.map(group => group.parentEvent.activity_id)
    )

    const filteredStandardEvents = standardEvents.filter(event => {
        if (!event.activity_id) return true
        return !groupedParentIds.has(event.activity_id)
    })

    return [...groups, ...filteredStandardEvents]
        .sort((a, b) => {
            const aDate = a.parentEvent ? a.date : a.date
            const bDate = b.parentEvent ? b.date : b.date

            return new Date(`${aDate}T00:00:00`) - new Date(`${bDate}T00:00:00`)
        })
        .slice(0, 15)
}

export default function FamilyTimelineCard({
    activities = [],
    tasks,
    schoolItems = [],
    familyMembers = [],
    trips = []
}) {
    const timeline = buildFamilyTimeline(
        activities,
        tasks,
        schoolItems,
        familyMembers,
        trips
    )

    const groupedTimeline = groupTimelineEvents(timeline)

    return (
        <section className="card">
            <h3>Family Timeline</h3>

            {groupedTimeline.length === 0 ? (
                <p>No upcoming events.</p>
            ) : (
                <div className="stack">
                    {groupedTimeline.map(item => {
                        if (item.parentEvent) {
                            return (
                                <div key={item.id} className="mini-row">
                                    <span className="mini-avatar">
                                        {item.parentEvent.icon}
                                    </span>

                                    <div>
                                        <strong>
                                            {item.parentEvent.title.replace(" starts", "")}
                                        </strong>

                                        {item.parentEvent.subtitle && (
                                            <p>{item.parentEvent.subtitle}</p>
                                        )}

                                        <small>
                                            {formatTimelineDate(item.parentEvent.date)}
                                        </small>

                                        <div
                                            className="stack"
                                            style={{ marginTop: "0.75rem" }}
                                        >
                                            {item.events.map(event => (
                                                <div
                                                    key={event.id}
                                                    className="mini-row"
                                                >
                                                    <span className="mini-avatar">
                                                        {event.icon}
                                                    </span>

                                                    <div>
                                                        <strong>
                                                            {event.title}
                                                        </strong>

                                                        {event.subtitle && (
                                                            <p>{event.subtitle}</p>
                                                        )}

                                                        <small>
                                                            {formatTimelineDate(event.date)}
                                                        </small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div key={item.id} className="mini-row">
                                <span className="mini-avatar">
                                    {item.icon}
                                </span>

                                <div>
                                    <strong>{item.title}</strong>

                                    {item.subtitle && (
                                        <p>{item.subtitle}</p>
                                    )}

                                    <small>{formatTimelineDate(item.date)}</small>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}