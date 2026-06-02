import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import useActivities from "../hooks/useActivities"
import useSchoolItems from "../hooks/useSchoolItems"
import useFamilyMembers from "../hooks/useFamilyMembers"
import useTrips from "../hooks/useTrips"
import useActivitySessions from "../hooks/useActivitySessions"
import usePreferences from "../hooks/usePreferences"
import useCalendarEvents from "../hooks/useCalendarEvents"

import {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent
} from "../services/calendarEventService"

import { createTask } from "../services/taskService"
import { createActivity } from "../services/activityService"
import { deleteActivity } from "../services/activityService"
import { deleteActivitySession } from "../services/activitySessionService"
import { createSchoolItem } from "../services/schoolService"
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
    calendarEvents,
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

        const startDate = createLocalDate(trip.start_date)
        const endDate = createLocalDate(
            trip.end_date || trip.start_date
        )

        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            events.push({
                id: `trip-${trip.id}-${currentDate.toISOString()}`,
                type: "trip",
                sourceType: "trip",
                sourceId: trip.id,
                canDelete: true,
                date: formatDateParts(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    currentDate.getDate()
                ),
                icon: "🚗",
                title: trip.name,
                subtitle:
                    attendees ||
                    trip.destination ||
                    "Trip",
                location: trip.destination || "",
                sortTime: 99999
            })

            currentDate.setDate(
                currentDate.getDate() + 1
            )
        }
    })

    calendarEvents.forEach(event => {
        if (!event.start_date) return

        const startDate = createLocalDate(event.start_date)
        const endDate = createLocalDate(
            event.end_date || event.start_date
        )

        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            events.push({
                id: `calendar-event-${event.id}-${currentDate.toISOString()}`,
                type: "calendar_event",
                sourceType: "calendar_event",
                sourceId: event.id,
                canDelete: true,
                date: formatDateParts(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    currentDate.getDate()
                ),
                icon: "📌",
                title: event.title,
                subtitle: event.event_type || "Calendar Event",
                location: event.location || "",
                sortTime: getMinutesFromTime(event.start_time)
            })

            currentDate.setDate(currentDate.getDate() + 1)
        }
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

    const [showCalendarEventForm, setShowCalendarEventForm] = useState(false)
    const [savingCalendarEvent, setSavingCalendarEvent] = useState(false)
    const [editingCalendarEventId, setEditingCalendarEventId] = useState(null)

    const [calendarEventForm, setCalendarEventForm] = useState({
        title: "",
        event_type: "Important Date",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        location: "",
        notes: ""
    })

    const [showTaskForm, setShowTaskForm] = useState(false)
    const [savingTask, setSavingTask] = useState(false)

    const [taskForm, setTaskForm] = useState({
        title: "",
        description: ""
    })

    const { activities, loading: activitiesLoading } = useActivities()
    const { activitySessions, loading: sessionsLoading } = useActivitySessions()

    const [showActivityForm, setShowActivityForm] = useState(false)
    const [savingActivity, setSavingActivity] = useState(false)

    const [activityForm, setActivityForm] = useState({
        name: "",
        family_member_id: "",
        location: "",
        start_time: "",
        end_time: ""
    })

    const [showSchoolItemForm, setShowSchoolItemForm] = useState(false)
    const [savingSchoolItem, setSavingSchoolItem] = useState(false)

    const [schoolItemForm, setSchoolItemForm] = useState({
        title: "",
        family_member_id: "",
        category: "School",
        notes: ""
    })

    const { schoolItems } = useSchoolItems()
    const { familyMembers } = useFamilyMembers()
    const { trips } = useTrips()
    const { preferences, loading: preferencesLoading } = usePreferences()

    const {
        calendarEvents,
        loading: calendarEventsLoading,
        refreshCalendarEvents
    } = useCalendarEvents()

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
                calendarEvents,
                visibleDate,
                showActivitySessions
            }),
        [
            activities,
            activitySessions,
            schoolItems,
            familyMembers,
            trips,
            calendarEvents,
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

        if (event.type === "calendar_event") {
            setShowCalendarEventForm(true)
            setShowTaskForm(false)
            setShowActivityForm(false)
            setShowSchoolItemForm(false)

            const existingEvent = calendarEvents.find(
                calendarEvent => calendarEvent.id === event.sourceId
            )

            if (existingEvent) {
                setEditingCalendarEventId(existingEvent.id)
                setCalendarEventForm({
                    title: existingEvent.title || "",
                    event_type: existingEvent.event_type || "Important Date",
                    start_date: existingEvent.start_date || selectedDate,
                    end_date: existingEvent.end_date || "",
                    start_time: existingEvent.start_time || "",
                    end_time: existingEvent.end_time || "",
                    location: existingEvent.location || "",
                    notes: existingEvent.notes || ""
                })
            }

            return
        }

        if (event.type === "birthday") {
            navigate("/family")
        }
    }

    function updateCalendarEventForm(field, value) {
        setCalendarEventForm(current => ({
            ...current,
            [field]: value
        }))
    }

    function resetCalendarEventForm(date = selectedDate) {
        setEditingCalendarEventId(null)

        setCalendarEventForm({
            title: "",
            event_type: "Important Date",
            start_date: date || "",
            end_date: "",
            start_time: "",
            end_time: "",
            location: "",
            notes: ""
        })
    }

    async function handleCreateCalendarEvent(event) {
        event.preventDefault()
        setSavingCalendarEvent(true)

        try {
            const payload = {
                title: calendarEventForm.title.trim(),
                event_type: calendarEventForm.event_type,
                start_date: calendarEventForm.start_date || selectedDate,
                end_date: calendarEventForm.end_date || null,
                start_time: calendarEventForm.start_time || null,
                end_time: calendarEventForm.end_time || null,
                location: calendarEventForm.location.trim() || null,
                notes: calendarEventForm.notes.trim() || null
            }

            if (editingCalendarEventId) {
                await updateCalendarEvent(editingCalendarEventId, payload)
            } else {
                await createCalendarEvent(payload)
            }

            await refreshCalendarEvents()
            resetCalendarEventForm()
            setShowCalendarEventForm(false)
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not create calendar event.")
        } finally {
            setSavingCalendarEvent(false)
        }
    }

    function resetTaskForm() {
        setTaskForm({
            title: "",
            description: ""
        })
    }

    async function handleCreateTask(event) {
        event.preventDefault()
        setSavingTask(true)

        try {
            await createTask({
                title: taskForm.title.trim(),
                description: taskForm.description.trim() || null,
                due_date: selectedDate,
                status: "open"
            })

            resetTaskForm()
            setShowTaskForm(false)
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not create task.")
        } finally {
            setSavingTask(false)
        }
    }

    function resetActivityForm() {
        setActivityForm({
            name: "",
            family_member_id: "",
            location: "",
            start_time: "",
            end_time: ""
        })
    }

    async function handleCreateActivity(event) {
        event.preventDefault()
        setSavingActivity(true)

        try {
            await createActivity({
                name: activityForm.name.trim(),
                family_member_id:
                    activityForm.family_member_id || null,
                location:
                    activityForm.location.trim() || null,
                start_date: selectedDate,
                end_date: selectedDate,
                start_time:
                    activityForm.start_time || null,
                end_time:
                    activityForm.end_time || null
            })

            resetActivityForm()
            setShowActivityForm(false)

            window.location.reload()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not create activity.")
        } finally {
            setSavingActivity(false)
        }
    }

    function resetSchoolItemForm() {
        setSchoolItemForm({
            title: "",
            family_member_id: "",
            category: "School",
            notes: ""
        })
    }

    async function handleCreateSchoolItem(event) {
        event.preventDefault()
        setSavingSchoolItem(true)

        try {
            await createSchoolItem({
                title: schoolItemForm.title.trim(),
                family_member_id:
                    schoolItemForm.family_member_id || null,
                category: schoolItemForm.category,
                due_date: selectedDate,
                notes: schoolItemForm.notes.trim() || null
            })

            resetSchoolItemForm()
            setShowSchoolItemForm(false)
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not create school item.")
        } finally {
            setSavingSchoolItem(false)
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

            if (event.sourceType === "calendar_event") {
                await deleteCalendarEvent(event.sourceId)
                await refreshCalendarEvents()
            }

            setSelectedDate(null)
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not delete this calendar item.")
        }
    }

    const loading =
        activitiesLoading ||
        sessionsLoading ||
        preferencesLoading ||
        calendarEventsLoading

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
            </header>

            <section className="card calendar-card">
                <div className="calendar-toolbar">
                    <div>
                        <p className="card-kicker">Month View</p>
                        <h3>{formatMonthTitle(visibleDate)}</h3>
                    </div>

                    <div className="calendar-controls">
                        <button
                            type="button"
                            className="calendar-nav-button"
                            onClick={goToPreviousMonth}
                            aria-label="Previous month"
                        >
                            ‹
                        </button>

                        <button
                            type="button"
                            className="calendar-today-button"
                            onClick={goToCurrentMonth}
                        >
                            Today
                        </button>

                        <button
                            type="button"
                            className="calendar-nav-button"
                            onClick={goToNextMonth}
                            aria-label="Next month"
                        >
                            ›
                        </button>
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
                                    onClick={() => {
                                        setSelectedDate(day.dateString)
                                        setShowCalendarEventForm(false)
                                        setShowTaskForm(false)
                                        resetCalendarEventForm(day.dateString)
                                        resetTaskForm()
                                    }}
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

                        {showCalendarEventForm && (
                            <form
                                className="card form-card"
                                onSubmit={handleCreateCalendarEvent}
                                style={{ marginBottom: "1rem" }}
                            >
                                <h4>Add Calendar Event</h4>

                                <div className="form-grid">
                                    <label>
                                        Title
                                        <input
                                            required
                                            value={calendarEventForm.title}
                                            onChange={event =>
                                                updateCalendarEventForm(
                                                    "title",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Type
                                        <select
                                            value={calendarEventForm.event_type}
                                            onChange={event =>
                                                updateCalendarEventForm(
                                                    "event_type",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option>Important Date</option>
                                            <option>Visitor</option>
                                            <option>Family Event</option>
                                            <option>Holiday</option>
                                            <option>Reminder</option>
                                            <option>Other</option>
                                        </select>
                                    </label>

                                    <label>
                                        Start Date
                                        <input
                                            type="date"
                                            value={calendarEventForm.start_date}
                                            onChange={event =>
                                                updateCalendarEventForm(
                                                    "start_date",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        End Date
                                        <input
                                            type="date"
                                            value={calendarEventForm.end_date}
                                            onChange={event =>
                                                updateCalendarEventForm(
                                                    "end_date",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Start Time
                                        <input
                                            type="time"
                                            value={calendarEventForm.start_time}
                                            onChange={event =>
                                                updateCalendarEventForm(
                                                    "start_time",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        End Time
                                        <input
                                            type="time"
                                            value={calendarEventForm.end_time}
                                            onChange={event =>
                                                updateCalendarEventForm(
                                                    "end_time",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label className="full-width">
                                        Location
                                        <input
                                            value={calendarEventForm.location}
                                            onChange={event =>
                                                updateCalendarEventForm(
                                                    "location",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label className="full-width">
                                        Notes
                                        <textarea
                                            rows="3"
                                            value={calendarEventForm.notes}
                                            onChange={event =>
                                                updateCalendarEventForm(
                                                    "notes",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <button
                                        className="primary-button full-width"
                                        type="submit"
                                        disabled={savingCalendarEvent}
                                    >
                                        {savingCalendarEvent
                                            ? "Saving..."
                                            : editingCalendarEventId
                                                ? "Update Calendar Event"
                                                : "Save Calendar Event"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {showTaskForm && (
                            <form
                                className="card form-card"
                                onSubmit={handleCreateTask}
                                style={{ marginBottom: "1rem" }}
                            >
                                <h4>Add Task</h4>

                                <div className="form-grid">
                                    <label className="full-width">
                                        Task
                                        <input
                                            required
                                            value={taskForm.title}
                                            onChange={event =>
                                                setTaskForm({
                                                    ...taskForm,
                                                    title: event.target.value
                                                })
                                            }
                                            placeholder="Buy snacks, call hotel, submit form..."
                                        />
                                    </label>

                                    <label className="full-width">
                                        Notes
                                        <textarea
                                            rows="3"
                                            value={taskForm.description}
                                            onChange={event =>
                                                setTaskForm({
                                                    ...taskForm,
                                                    description: event.target.value
                                                })
                                            }
                                        />
                                    </label>

                                    <button
                                        className="primary-button full-width"
                                        type="submit"
                                        disabled={savingTask}
                                    >
                                        {savingTask ? "Saving..." : "Save Task"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {showActivityForm && (
                            <form
                                className="card form-card"
                                onSubmit={handleCreateActivity}
                                style={{ marginBottom: "1rem" }}
                            >
                                <h4>Add Activity</h4>

                                <div className="form-grid">
                                    <label>
                                        Activity
                                        <input
                                            required
                                            value={activityForm.name}
                                            onChange={event =>
                                                setActivityForm({
                                                    ...activityForm,
                                                    name: event.target.value
                                                })
                                            }
                                        />
                                    </label>

                                    <label>
                                        Family Member
                                        <select
                                            value={activityForm.family_member_id}
                                            onChange={event =>
                                                setActivityForm({
                                                    ...activityForm,
                                                    family_member_id:
                                                        event.target.value
                                                })
                                            }
                                        >
                                            <option value="">
                                                Select Family Member
                                            </option>

                                            {familyMembers.map(member => (
                                                <option
                                                    key={member.id}
                                                    value={member.id}
                                                >
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Start Time
                                        <input
                                            type="time"
                                            value={activityForm.start_time}
                                            onChange={event =>
                                                setActivityForm({
                                                    ...activityForm,
                                                    start_time:
                                                        event.target.value
                                                })
                                            }
                                        />
                                    </label>

                                    <label>
                                        End Time
                                        <input
                                            type="time"
                                            value={activityForm.end_time}
                                            onChange={event =>
                                                setActivityForm({
                                                    ...activityForm,
                                                    end_time:
                                                        event.target.value
                                                })
                                            }
                                        />
                                    </label>

                                    <label className="full-width">
                                        Location
                                        <input
                                            value={activityForm.location}
                                            onChange={event =>
                                                setActivityForm({
                                                    ...activityForm,
                                                    location:
                                                        event.target.value
                                                })
                                            }
                                        />
                                    </label>

                                    <button
                                        className="primary-button full-width"
                                        type="submit"
                                        disabled={savingActivity}
                                    >
                                        {savingActivity
                                            ? "Saving..."
                                            : "Save Activity"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {showSchoolItemForm && (
                            <form
                                className="card form-card"
                                onSubmit={handleCreateSchoolItem}
                                style={{ marginBottom: "1rem" }}
                            >
                                <h4>Add School Item</h4>

                                <div className="form-grid">
                                    <label>
                                        Title
                                        <input
                                            required
                                            value={schoolItemForm.title}
                                            onChange={event =>
                                                setSchoolItemForm({
                                                    ...schoolItemForm,
                                                    title: event.target.value
                                                })
                                            }
                                            placeholder="Field trip form, picture day, project due..."
                                        />
                                    </label>

                                    <label>
                                        Family Member
                                        <select
                                            value={schoolItemForm.family_member_id}
                                            onChange={event =>
                                                setSchoolItemForm({
                                                    ...schoolItemForm,
                                                    family_member_id: event.target.value
                                                })
                                            }
                                        >
                                            <option value="">No family member selected</option>

                                            {familyMembers.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.avatar_emoji ? `${member.avatar_emoji} ` : ""}
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Category
                                        <select
                                            value={schoolItemForm.category}
                                            onChange={event =>
                                                setSchoolItemForm({
                                                    ...schoolItemForm,
                                                    category: event.target.value
                                                })
                                            }
                                        >
                                            <option>School</option>
                                            <option>Form</option>
                                            <option>Deadline</option>
                                            <option>Event</option>
                                            <option>Reminder</option>
                                            <option>Other</option>
                                        </select>
                                    </label>

                                    <label className="full-width">
                                        Notes
                                        <textarea
                                            rows="3"
                                            value={schoolItemForm.notes}
                                            onChange={event =>
                                                setSchoolItemForm({
                                                    ...schoolItemForm,
                                                    notes: event.target.value
                                                })
                                            }
                                        />
                                    </label>

                                    <button
                                        className="primary-button full-width"
                                        type="submit"
                                        disabled={savingSchoolItem}
                                    >
                                        {savingSchoolItem ? "Saving..." : "Save School Item"}
                                    </button>
                                </div>
                            </form>
                        )}

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

                    <div
                        className="calendar-detail-add-actions"
                        onClick={event => event.stopPropagation()}
                    >
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => {
                                setShowCalendarEventForm(current => !current)
                                setShowTaskForm(false)
                                resetCalendarEventForm(selectedDate)
                                resetTaskForm()
                            }}
                        >
                            {showCalendarEventForm ? "Cancel Event" : "+ Calendar Event"}
                        </button>

                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => {
                                setShowTaskForm(current => !current)
                                setShowCalendarEventForm(false)
                                resetTaskForm()
                            }}
                        >
                            {showTaskForm ? "Cancel Task" : "+ Task"}
                        </button>

                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => {
                                setShowActivityForm(current => !current)

                                setShowCalendarEventForm(false)
                                setShowTaskForm(false)

                                resetActivityForm()
                            }}
                        >
                            {showActivityForm
                                ? "Cancel Activity"
                                : "+ Activity"}
                        </button>

                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => {
                                setShowSchoolItemForm(current => !current)

                                setShowCalendarEventForm(false)
                                setShowTaskForm(false)
                                setShowActivityForm(false)

                                resetSchoolItemForm()
                            }}
                        >
                            {showSchoolItemForm
                                ? "Cancel School Item"
                                : "+ School Item"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}