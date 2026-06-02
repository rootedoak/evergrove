import { buildFamilyTimeline } from "../utils/familyTimeline"

function getDateOnly(value) {
    if (!value) return ""
    return String(value).slice(0, 10)
}

function createLocalDate(dateString) {
    const cleanDate = getDateOnly(dateString)
    const [year, month, day] = cleanDate.split("-").map(Number)

    return new Date(year, month - 1, day)
}

function formatTimelineDate(dateString) {
    if (!dateString) return ""

    return createLocalDate(dateString).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    })
}

export default function FamilyTimelineCard({
    activities = [],
    tasks = [],
    schoolItems = [],
    familyMembers = [],
    trips = [],
    activitySessions = [],
    calendarEvents = [],
    timelineDays = 90
}) {
    const timeline = buildFamilyTimeline(
        activities,
        tasks,
        schoolItems,
        familyMembers,
        trips,
        timelineDays,
        activitySessions,
        calendarEvents
    ).slice(0, 15)

    return (
        <section className="card">
            <h3>Family Timeline</h3>

            {timeline.length === 0 ? (
                <p>No upcoming events.</p>
            ) : (
                <div className="stack">
                    {timeline.map(event => (
                        <div key={event.id} className="mini-row">
                            <span className="mini-avatar">
                                {event.icon}
                            </span>

                            <div>
                                <strong>{event.title}</strong>

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
            )}
        </section>
    )
}