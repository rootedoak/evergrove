import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import useActivities from "../hooks/useActivities"
import useSchoolItems from "../hooks/useSchoolItems"
import useFamilyMembers from "../hooks/useFamilyMembers"
import useTrips from "../hooks/useTrips"
import useActivitySessions from "../hooks/useActivitySessions"

function getDateOnly(value) {
    if (!value) return ""
    return String(value).slice(0, 10)
}

function formatDateParts(year, month, day) {
    return [
        year,
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-")
}

function formatMonthTitle(date) {
    return date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric"
    })
}

function formatTime(timeString) {
    if (!timeString) return ""

    const [hours, minutes] = timeString.split(":")
    const date = new Date()
    date.setHours(Number(hours), Number(minutes), 0, 0)

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    })
}

function formatTimeRange(startTime, endTime) {
    if (startTime && endTime) {
        return `${formatTime(startTime)}-${formatTime(endTime)}`
    }

    if (startTime) return formatTime(startTime)

    return ""
}

function getTodayString() {
    const today = new Date()

    return formatDateParts(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
    )
}

function getBirthdayDateForMonth(member, visibleDate) {
    if (!member.birthdate) return null

    const [, month, day] = getDateOnly(member.birthdate)
        .split("-")
        .map(Number)

    return formatDateParts(
        visibleDate.getFullYear(),
        month,
        day
    )
}

function getCalendarDays(visibleDate) {
    const year = visibleDate.getFullYear()
    const month = visibleDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(firstDay.getDate() - firstDay.getDay())

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + index)

        return {
            date,
            dateString: formatDateParts(
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate()
            ),
            isCurrentMonth: date.getMonth() === month
        }
    })
}

function buildCalendarEvents({
    activities,
    activitySessions,
    schoolItems,
    familyMembers,
    trips,
    visibleDate
}) {
    const events = []

    activitySessions.forEach(session => {
        if (!session.session_date) return

        const activity = session.activities
        const member = activity?.family_members
        const timeRange = formatTimeRange(session.start_time, session.end_time)

        events.push({
            id: `session-${session.id}`,
            type: "session",
            date: getDateOnly(session.session_date),
            icon: member?.avatar_emoji || "📅",
            title: activity?.name || "Activity session",
            subtitle: [member?.name, timeRange, session.location]
                .filter(Boolean)
                .join(" • ")
        })
    })

    activities.forEach(activity => {
        const member = activity.family_members

        if (activity.registration_open_date) {
            events.push({
                id: `activity-${activity.id}-registration-open`,
                type: "activity",
                date: getDateOnly(activity.registration_open_date),
                icon: "📣",
                title: `${activity.name} registration opens`,
                subtitle: member?.name || ""
            })
        }

        if (activity.registration_close_date) {
            events.push({
                id: `activity-${activity.id}-registration-close`,
                type: "activity",
                date: getDateOnly(activity.registration_close_date),
                icon: "⏳",
                title: `${activity.name} registration closes`,
                subtitle: member?.name || ""
            })
        }

        if (activity.start_date) {
            events.push({
                id: `activity-${activity.id}-start`,
                type: "activity",
                date: getDateOnly(activity.start_date),
                icon: member?.avatar_emoji || "📅",
                title: `${activity.name} starts`,
                subtitle: member?.name || ""
            })
        }
    })

    schoolItems.forEach(item => {
        if (!item.due_date) return

        events.push({
            id: `school-${item.id}`,
            type: "school",
            date: getDateOnly(item.due_date),
            icon: item.family_members?.avatar_emoji || "🎒",
            title: item.title,
            subtitle: item.family_members?.name || item.category || "School"
        })
    })

    trips.forEach(trip => {
        if (!trip.start_date) return

        const attendees = trip.trip_family_members
            ?.map(attendee => attendee.family_members?.name)
            .filter(Boolean)
            .join(", ")

        events.push({
            id: `trip-${trip.id}`,
            type: "trip",
            date: getDateOnly(trip.start_date),
            icon: "🚗",
            title: trip.name,
            subtitle: attendees || trip.destination || "Trip"
        })
    })

    familyMembers.forEach(member => {
        const date = getBirthdayDateForMonth(member, visibleDate)
        if (!date) return

        events.push({
            id: `birthday-${member.id}`,
            type: "birthday",
            date,
            icon: "🎂",
            title: `${member.name}'s birthday`,
            subtitle: "Birthday"
        })
    })

    return events
}

export default function Calendar() {
    const navigate = useNavigate()
    const [visibleDate, setVisibleDate] = useState(() => new Date())

    const { activities, loading: activitiesLoading } = useActivities()
    const { activitySessions, loading: sessionsLoading } = useActivitySessions()
    const { schoolItems } = useSchoolItems()
    const { familyMembers } = useFamilyMembers()
    const { trips } = useTrips()

    const calendarDays = useMemo(
        () => getCalendarDays(visibleDate),
        [visibleDate]
    )

    const events = useMemo(
        () =>
            buildCalendarEvents({
                activities,
                activitySessions,
                schoolItems,
                familyMembers,
                trips,
                visibleDate
            }),
        [
            activities,
            activitySessions,
            schoolItems,
            familyMembers,
            trips,
            visibleDate
        ]
    )

    const eventsByDate = useMemo(() => {
        return events.reduce((grouped, event) => {
            if (!grouped[event.date]) {
                grouped[event.date] = []
            }

            grouped[event.date].push(event)
            return grouped
        }, {})
    }, [events])

    function goToPreviousMonth() {
        setVisibleDate(current => {
            const next = new Date(current)
            next.setMonth(next.getMonth() - 1)
            return next
        })
    }

    function goToNextMonth() {
        setVisibleDate(current => {
            const next = new Date(current)
            next.setMonth(next.getMonth() + 1)
            return next
        })
    }

    function goToCurrentMonth() {
        setVisibleDate(new Date())
    }

    function handleEventClick(event) {
        if (event.type === "activity" || event.type === "session") {
            navigate("/activities")
            return
        }

        if (event.type === "trip") {
            navigate("/trips")
            return
        }

        if (event.type === "school") {
            navigate("/school")
            return
        }

        if (event.type === "birthday") {
            navigate("/family")
        }
    }

    const loading = activitiesLoading || sessionsLoading
    const todayString = getTodayString()

    return (
        <div className="calendar-page">
            <section className="hero-card">
                <div className="section-header">
                    <div>
                        <p className="eyebrow">Calendar</p>
                        <h2>Family Calendar</h2>
                        <p>
                            A monthly view of activities, sessions, trips,
                            birthdays, school items, and registration windows.
                        </p>
                    </div>

                    <div className="card-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={goToPreviousMonth}
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={goToCurrentMonth}
                        >
                            Today
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={goToNextMonth}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            <section className="card calendar-card">
                <div className="card-header-row">
                    <div>
                        <p className="card-kicker">Month View</p>
                        <h3>{formatMonthTitle(visibleDate)}</h3>
                    </div>
                </div>

                {loading ? (
                    <p>Loading calendar...</p>
                ) : (
                    <div className="calendar-grid">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                            <div className="calendar-weekday" key={day}>
                                {day}
                            </div>
                        ))}

                        {calendarDays.map(day => {
                            const dayEvents = eventsByDate[day.dateString] || []
                            const isToday = day.dateString === todayString

                            return (
                                <div
                                    className={`calendar-day ${day.isCurrentMonth ? "" : "calendar-day-muted"
                                        } ${isToday ? "calendar-day-today" : ""}`}
                                    key={day.dateString}
                                >
                                    <div className="calendar-day-number">
                                        {day.date.getDate()}
                                    </div>

                                    <div className="calendar-events">
                                        {dayEvents.slice(0, 4).map(event => (
                                            <button
                                                className="calendar-event"
                                                key={event.id}
                                                type="button"
                                                title={[event.title, event.subtitle]
                                                    .filter(Boolean)
                                                    .join(" • ")}
                                                onClick={() => handleEventClick(event)}
                                            >
                                                <span>{event.icon}</span>
                                                <strong>{event.title}</strong>
                                            </button>
                                        ))}

                                        {dayEvents.length > 4 && (
                                            <small>
                                                +{dayEvents.length - 4} more
                                            </small>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}