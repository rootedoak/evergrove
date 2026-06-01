import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import useActivities from "../hooks/useActivities"
import useSchoolItems from "../hooks/useSchoolItems"
import useFamilyMembers from "../hooks/useFamilyMembers"
import useTrips from "../hooks/useTrips"
import useActivitySessions from "../hooks/useActivitySessions"
import usePreferences from "../hooks/usePreferences"

import { deleteActivity } from "../services/activityService"
import { deleteActivitySession } from "../services/activitySessionService"
import { deleteSchoolItem } from "../services/schoolService"
import { deleteTrip } from "../services/tripService"

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

function createLocalDate(dateString) {
    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day)
}

function formatMonthTitle(date) {
    return date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric"
    })
}

function formatFullDate(dateString) {
    return createLocalDate(dateString).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
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
    if (startTime && endTime) return `${formatTime(startTime)}-${formatTime(endTime)}`
    if (startTime) return formatTime(startTime)
    return ""
}

function getMinutesFromTime(timeString) {
    if (!timeString) return 99999

    const [hours, minutes] = timeString.split(":").map(Number)
    return hours * 60 + minutes
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

function getCalendarDays(visibleDate, weekStartsOn = "Sunday") {
    const year = visibleDate.getFullYear()
    const month = visibleDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)

    const weekStartOffset = weekStartsOn === "Monday" ? 1 : 0
    const dayOffset = (firstDay.getDay() - weekStartOffset + 7) % 7

    startDate.setDate(firstDay.getDate() - dayOffset)

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
    visibleDate,
    showActivitySessions
}) {
    const events = []

    const activityIdsWithSessions = new Set(
        activitySessions
            .map(session => session.activity_id)
            .filter(Boolean)
    )

    if (showActivitySessions) {
        activitySessions.forEach(session => {
            if (!session.session_date) return

            const activity = session.activities
            const member = activity?.family_members
            const timeRange = formatTimeRange(
                session.start_time,
                session.end_time
            )

            events.push({
                id: `session-${session.id}`,
                type: "session",
                sourceType: "session",
                sourceId: session.id,
                canDelete: true,
                date: getDateOnly(session.session_date),
                icon: member?.avatar_emoji || "📅",
                title: activity?.name || "Activity session",
                subtitle: [
                    timeRange,
                    member?.name,
                    session.location
                ]
                    .filter(Boolean)
                    .join(" • "),
                timeLabel: timeRange,
                location: session.location || "",
                sortTime: getMinutesFromTime(session.start_time)
            })
        })
    }

    activities.forEach(activity => {
        const member = activity.family_members
        const hasSessions = activityIdsWithSessions.has(activity.id)

        if (activity.registration_open_date) {
            events.push({
                id: `activity-${activity.id}-registration-open`,
                type: "activity",
                sourceType: "activity",
                sourceId: activity.id,
                canDelete: true,
                date: getDateOnly(activity.registration_open_date),
                icon: "📣",
                title: `${activity.name} registration opens`,
                subtitle: member?.name || "",
                sortTime: 99999
            })
        }

        if (activity.registration_close_date) {
            events.push({
                id: `activity-${activity.id}-registration-close`,
                type: "activity",
                sourceType: "activity",
                sourceId: activity.id,
                canDelete: true,
                date: getDateOnly(activity.registration_close_date),
                icon: "⏳",
                title: `${activity.name} registration closes`,
                subtitle: member?.name || "",
                sortTime: 99999
            })
        }

        if (!hasSessions && activity.start_date) {
            const timeRange = formatTimeRange(
                activity.start_time,
                activity.end_time
            )

            events.push({
                id: `activity-${activity.id}-start`,
                type: "activity",
                sourceType: "activity",
                sourceId: activity.id,
                canDelete: true,
                date: getDateOnly(activity.start_date),
                icon: member?.avatar_emoji || "📅",
                title: `${activity.name} starts`,
                subtitle: [timeRange, member?.name]
                    .filter(Boolean)
                    .join(" • "),
                timeLabel: timeRange,
                location: activity.location || "",
                sortTime: getMinutesFromTime(activity.start_time)
            })
        }

        if (
            !hasSessions &&
            activity.end_date &&
            activity.end_date !== activity.start_date
        ) {
            events.push({
                id: `activity-${activity.id}-end`,
                type: "activity",
                sourceType: "activity",
                sourceId: activity.id,
                canDelete: true,
                date: getDateOnly(activity.end_date),
                icon: "🏁",
                title: `${activity.name} ends`,
                subtitle: member?.name || "",
                sortTime: 99999
            })
        }
    })

    schoolItems.forEach(item => {
        if (!item.due_date) return

        events.push({
            id: `school-${item.id}`,
            type: "school",
            sourceType: "school",
            sourceId: item.id,
            canDelete: true,
            date: getDateOnly(item.due_date),
            icon: item.family_members?.avatar_emoji || "🎒",
            title: item.title,
            subtitle: item.family_members?.name || item.category || "School",
            sortTime: 99999
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
            sourceType: "trip",
            sourceId: trip.id,
            canDelete: true,
            date: getDateOnly(trip.start_date),
            icon: "🚗",
            title: trip.name,
            subtitle: attendees || trip.destination || "Trip",
            location: trip.destination || "",
            sortTime: 99999
        })
    })

    familyMembers.forEach(member => {
        const date = getBirthdayDateForMonth(member, visibleDate)
        if (!date) return

        events.push({
            id: `birthday-${member.id}`,
            type: "birthday",
            sourceType: "birthday",
            sourceId: member.id,
            canDelete: false,
            date,
            icon: "🎂",
            title: `${member.name}'s birthday`,
            subtitle: "Birthday",
            sortTime: 99999
        })
    })

    return events.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)

        if ((a.sortTime || 99999) !== (b.sortTime || 99999)) {
            return (a.sortTime || 99999) - (b.sortTime || 99999)
        }

        return a.title.localeCompare(b.title)
    })
}

export default function Calendar() {
    const navigate = useNavigate()
    const [visibleDate, setVisibleDate] = useState(() => new Date())
    const [selectedDate, setSelectedDate] = useState(null)

    const { activities, loading: activitiesLoading } = useActivities()
    const { activitySessions, loading: sessionsLoading } = useActivitySessions()
    const { schoolItems } = useSchoolItems()
    const { familyMembers } = useFamilyMembers()
    const { trips } = useTrips()
    const { preferences, loading: preferencesLoading } = usePreferences()

    const weekStartsOn = preferences?.week_starts_on || "Sunday"
    const showActivitySessions = preferences?.show_activity_sessions !== false

    const calendarDays = useMemo(
        () => getCalendarDays(visibleDate, weekStartsOn),
        [visibleDate, weekStartsOn]
    )

    const events = useMemo(
        () =>
            buildCalendarEvents({
                activities,
                activitySessions,
                schoolItems,
                familyMembers,
                trips,
                visibleDate,
                showActivitySessions
            }),
        [
            activities,
            activitySessions,
            schoolItems,
            familyMembers,
            trips,
            visibleDate,
            showActivitySessions
        ]
    )

    const eventsByDate = useMemo(() => {
        return events.reduce((grouped, event) => {
            if (!grouped[event.date]) grouped[event.date] = []
            grouped[event.date].push(event)
            return grouped
        }, {})
    }, [events])

    const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : []

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

    function handleViewEvent(event) {
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

    async function handleDeleteCalendarEvent(event) {
        const confirmed = window.confirm(
            `Delete "${event.title}"? This cannot be undone.`
        )

        if (!confirmed) return

        try {
            if (event.sourceType === "session") {
                await deleteActivitySession(event.sourceId)
            }

            if (event.sourceType === "activity") {
                await deleteActivity(event.sourceId)
            }

            if (event.sourceType === "school") {
                await deleteSchoolItem(event.sourceId)
            }

            if (event.sourceType === "trip") {
                await deleteTrip(event.sourceId)
            }

            setSelectedDate(null)
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not delete this calendar item.")
        }
    }

    const loading = activitiesLoading || sessionsLoading || preferencesLoading
    const todayString = getTodayString()

    const weekdayLabels =
        weekStartsOn === "Monday"
            ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    return (
        <div className="calendar-page">
            <header className="calendar-header">
                <div>
                    <p className="dashboard-household-name">
                        {preferences?.household_name || "My Household"}
                    </p>

                    <h2>Family Calendar</h2>

                    <div className="calendar-destinations">
                        <Link className="calendar-destination-card" to="/activities">
                            <span>🏀</span>

                            <div>
                                <strong>Activities</strong>
                                <p>Sports, lessons, clubs, and sessions.</p>
                            </div>
                        </Link>

                        <Link className="calendar-destination-card" to="/trips">
                            <span>🚗</span>

                            <div>
                                <strong>Trips</strong>
                                <p>Travel plans, packing, and checklists.</p>
                            </div>
                        </Link>

                        <Link className="calendar-destination-card" to="/school">
                            <span>🎒</span>

                            <div>
                                <strong>School</strong>
                                <p>School dates, forms, and deadlines.</p>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="card-actions">
                    <button type="button" className="secondary-button" onClick={goToPreviousMonth}>
                        Previous
                    </button>

                    <button type="button" className="secondary-button" onClick={goToCurrentMonth}>
                        Today
                    </button>

                    <button type="button" className="secondary-button" onClick={goToNextMonth}>
                        Next
                    </button>
                </div>
            </header>

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
                        {weekdayLabels.map(day => (
                            <div className="calendar-weekday" key={day}>
                                {day}
                            </div>
                        ))}

                        {calendarDays.map(day => {
                            const dayEvents = eventsByDate[day.dateString] || []
                            const isToday = day.dateString === todayString

                            return (
                                <button
                                    className={`calendar-day calendar-day-button ${day.isCurrentMonth ? "" : "calendar-day-muted"
                                        } ${isToday ? "calendar-day-today" : ""}`}
                                    key={day.dateString}
                                    type="button"
                                    onClick={() => setSelectedDate(day.dateString)}
                                >
                                    <div className="calendar-day-number">
                                        {day.date.getDate()}
                                    </div>

                                    <div className="calendar-events">
                                        {dayEvents.slice(0, 4).map(event => (
                                            <div
                                                className="calendar-event"
                                                key={event.id}
                                                title={[event.title, event.subtitle]
                                                    .filter(Boolean)
                                                    .join(" • ")}
                                            >
                                                <span>{event.icon}</span>
                                                <strong>{event.title}</strong>
                                            </div>
                                        ))}

                                        {dayEvents.length > 4 && (
                                            <small>
                                                +{dayEvents.length - 4} more
                                            </small>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </section>

            {selectedDate && (
                <div
                    className="calendar-modal-backdrop"
                    role="presentation"
                    onClick={() => setSelectedDate(null)}
                >
                    <section
                        className="calendar-detail-sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Calendar day details"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="calendar-detail-header">
                            <div>
                                <p className="card-kicker">Calendar Details</p>
                                <h3>{formatFullDate(selectedDate)}</h3>
                            </div>

                            <button
                                className="secondary-button"
                                type="button"
                                onClick={() => setSelectedDate(null)}
                            >
                                Close
                            </button>
                        </div>

                        {selectedEvents.length === 0 ? (
                            <p className="dashboard-empty">
                                Nothing scheduled for this day.
                            </p>
                        ) : (
                            <div className="calendar-detail-list">
                                {selectedEvents.map(event => (
                                    <div className="calendar-detail-row" key={event.id}>
                                        <span className="calendar-detail-icon">
                                            {event.icon}
                                        </span>

                                        <div>
                                            <strong>{event.title}</strong>

                                            {event.subtitle && <p>{event.subtitle}</p>}

                                            {event.location && <small>{event.location}</small>}
                                        </div>

                                        <div className="calendar-detail-actions">
                                            <button
                                                className="secondary-button"
                                                type="button"
                                                onClick={() => handleViewEvent(event)}
                                            >
                                                Manage
                                            </button>

                                            {event.canDelete && (
                                                <button
                                                    className="danger-button"
                                                    type="button"
                                                    onClick={() => handleDeleteCalendarEvent(event)}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="calendar-detail-add-actions">
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() =>
                                navigate(`/tasks?dueDate=${selectedDate}`)
                            }
                        >
                            + Task
                        </button>

                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() =>
                                navigate(`/activities?startDate=${selectedDate}`)
                            }
                        >
                            + Activity
                        </button>

                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() =>
                                navigate(`/school?dueDate=${selectedDate}`)
                            }
                        >
                            + School Item
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}