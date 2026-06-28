import AppPage from "../components/ui/AppPage"
import CalendarHeader from "../components/calendar/CalendarHeader"
import CalendarAgenda from "../components/calendar/CalendarAgenda"
import CalendarMonth from "../components/calendar/CalendarMonth"
import CalendarEventDetailSheet from "../components/calendar/CalendarEventDetailSheet"

import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import useActivities from "../hooks/useActivities"
import useSchoolItems from "../hooks/useSchoolItems"
import useFamilyMembers from "../hooks/useFamilyMembers"
import useTrips from "../hooks/useTrips"
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

function getRecurringDateForYear(dateString, year) {
    if (!dateString) return null

    const [, month, day] = getDateOnly(dateString)
        .split("-")
        .map(Number)

    return formatDateParts(year, month, day)
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
    schoolItems,
    familyMembers,
    trips,
    calendarEvents,
    visibleDate,
}) {
    const events = []

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
            sortTime: 99999,
            start_time: event.start_time,
            end_time: event.end_time,
            notes: event.notes || ""
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

        const yearsToRender = event.repeats_yearly
            ? [visibleDate.getFullYear() - 1, visibleDate.getFullYear(), visibleDate.getFullYear() + 1]
            : [null]

        yearsToRender.forEach(year => {
            const startDateString = event.repeats_yearly
                ? getRecurringDateForYear(event.start_date, year)
                : event.start_date

            const endDateString = event.repeats_yearly && event.end_date
                ? getRecurringDateForYear(event.end_date, year)
                : event.end_date || startDateString

            const startDate = createLocalDate(startDateString)
            const endDate = createLocalDate(endDateString)

            const currentDate = new Date(startDate)

            while (currentDate <= endDate) {
                events.push({
                    id: `calendar-event-${event.id}-${year || "single"}-${currentDate.toISOString()}`,
                    type: "calendar_event",
                    sourceType: "calendar_event",
                    sourceId: event.id,
                    canDelete: true,
                    date: formatDateParts(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        currentDate.getDate()
                    ),
                    icon: event.repeats_yearly ? "🔁" : "📌",
                    title: event.title,
                    subtitle: event.event_type || "Calendar Event",
                    location: event.location || "",
                    sortTime: getMinutesFromTime(event.start_time),
                    start_time: event.start_time,
                    end_time: event.end_time,
                    notes: event.notes || ""
                })

                currentDate.setDate(currentDate.getDate() + 1)
            }
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

function formatAgendaDateLabel(dateString) {
    const today = getTodayString()

    const tomorrowDate = createLocalDate(today)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)

    const tomorrow = formatDateParts(
        tomorrowDate.getFullYear(),
        tomorrowDate.getMonth() + 1,
        tomorrowDate.getDate()
    )

    if (dateString === today) return "Today"
    if (dateString === tomorrow) return "Tomorrow"

    return createLocalDate(dateString).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    })
}

function addSessionInterval(dateString, frequency) {
    const date = createLocalDate(dateString)

    if (frequency === "daily") {
        date.setDate(date.getDate() + 1)
    }

    if (frequency === "weekly") {
        date.setDate(date.getDate() + 7)
    }

    if (frequency === "monthly") {
        date.setMonth(date.getMonth() + 1)
    }

    return formatDateParts(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}

function buildActivitySessionEvents(baseEvent) {
    const frequency = baseEvent.session_frequency
    const startDate = baseEvent.start_date
    const untilDate = baseEvent.session_until

    if (
        baseEvent.event_type !== "Activity" ||
        !frequency ||
        frequency === "none" ||
        !startDate ||
        !untilDate
    ) {
        return [baseEvent]
    }

    const events = []
    let currentDate = startDate

    while (currentDate <= untilDate) {
        events.push({
            ...baseEvent,
            start_date: currentDate,
            end_date: currentDate
        })

        currentDate = addSessionInterval(currentDate, frequency)
    }

    return events
}



export default function Calendar() {
    const navigate = useNavigate()
    const location = useLocation()

    const [showAddMenu, setShowAddMenu] = useState(false)

    const [visibleDate, setVisibleDate] = useState(() => new Date())
    const [selectedDate, setSelectedDate] = useState(null)

    const [calendarView, setCalendarView] = useState("agenda")

    const [selectedEvent, setSelectedEvent] = useState(null)

    const [showCalendarEventForm, setShowCalendarEventForm] = useState(false)
    const [savingCalendarEvent, setSavingCalendarEvent] = useState(false)
    const [editingCalendarEventId, setEditingCalendarEventId] = useState(null)

    const [calendarEventForm, setCalendarEventForm] = useState({
        title: "",
        event_type: "Family Event",
        start_date: "",
        end_date: "",
        repeats_yearly: false,
        session_frequency: "none",
        session_until: "",
        start_time: "",
        end_time: "",
        location: "",
        notes: ""
    })

    const [showTaskForm, setShowTaskForm] = useState(false)
    const [savingTask, setSavingTask] = useState(false)

    const [taskForm, setTaskForm] = useState({
        title: "",
        description: "",
        due_date: "",
        family_member_id: "",
        activity_id: "",
        status: "open",
        visibility: "household"
    })

    const { activities, loading: activitiesLoading } = useActivities()

    const [showActivityForm, setShowActivityForm] = useState(false)
    const [savingActivity, setSavingActivity] = useState(false)

    const [activityForm, setActivityForm] = useState({
        name: "",
        family_member_id: "",
        location: "",
        start_date: "",
        end_date: "",
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

    const calendarDays = useMemo(
        () => getCalendarDays(visibleDate, "Sunday"),
        [visibleDate]
    )

    const events = useMemo(
        () =>
            buildCalendarEvents({
                schoolItems,
                familyMembers,
                trips,
                calendarEvents,
                visibleDate,
            }),
        [
            schoolItems,
            familyMembers,
            trips,
            calendarEvents,
            visibleDate,
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

    const agendaEvents = useMemo(() => {
        const today = getTodayString()

        return events
            .filter(event => event.date >= today)
            .slice(0, 30)
    }, [events])

    const agendaEventsByDate = useMemo(() => {
        return agendaEvents.reduce((grouped, event) => {
            if (!grouped[event.date]) grouped[event.date] = []
            grouped[event.date].push(event)
            return grouped
        }, {})
    }, [agendaEvents])

    useEffect(() => {
        const date = location.state?.selectedDate || getTodayString()

        if (location.state?.openCalendarEventForm) {
            setSelectedDate(date)
            resetCalendarEventForm(date)
            setShowCalendarEventForm(true)
            setShowTaskForm(false)
            setShowActivityForm(false)
            setShowSchoolItemForm(false)
            navigate(location.pathname, { replace: true, state: {} })
            return
        }

        if (location.state?.openTaskForm) {
            setSelectedDate(date)
            resetTaskForm()
            setShowTaskForm(true)
            setShowCalendarEventForm(false)
            setShowActivityForm(false)
            setShowSchoolItemForm(false)
            navigate(location.pathname, { replace: true, state: {} })
        }

        if (location.state?.selectedDate) {
            setSelectedDate(location.state.selectedDate)
        }

        if (location.state?.calendarEventId) {
            const existingEvent = calendarEvents.find(
                calendarEvent => calendarEvent.id === location.state.calendarEventId
            )

            if (existingEvent) {
                setEditingCalendarEventId(existingEvent.id)

                setCalendarEventForm({
                    title: existingEvent.title || "",
                    event_type: existingEvent.event_type || "Family Event",
                    start_date: existingEvent.start_date || location.state.selectedDate || "",
                    end_date: existingEvent.end_date || "",
                    start_time: existingEvent.start_time || "",
                    end_time: existingEvent.end_time || "",
                    location: existingEvent.location || "",
                    notes: existingEvent.notes || "",
                    repeats_yearly: Boolean(existingEvent.repeats_yearly),
                    session_frequency: "none",
                    session_until: ""
                })

                setShowCalendarEventForm(true)
                setShowTaskForm(false)
                setShowSchoolItemForm(false)
            }
        }

        if (location.state?.selectedDate || location.state?.calendarEventId) {
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location, navigate, calendarEvents])

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
                    notes: existingEvent.notes || "",
                    repeats_yearly: Boolean(existingEvent.repeats_yearly)
                })
            }

            return
        }

        if (event.type === "birthday") {
            navigate("/family")
        }
    }

    function startEditCalendarEventFromSummary(event) {
        const existingEvent = calendarEvents.find(
            calendarEvent => calendarEvent.id === event.sourceId
        )

        if (!existingEvent) return

        setSelectedEvent(null)
        setSelectedDate(event.date)

        setEditingCalendarEventId(existingEvent.id)

        setCalendarEventForm({
            title: existingEvent.title || "",
            event_type: existingEvent.event_type || "Family Event",
            start_date: existingEvent.start_date || event.date || "",
            end_date: existingEvent.end_date || "",
            start_time: existingEvent.start_time || "",
            end_time: existingEvent.end_time || "",
            location: existingEvent.location || "",
            notes: existingEvent.notes || "",
            repeats_yearly: Boolean(existingEvent.repeats_yearly),
            session_frequency: "none",
            session_until: ""
        })

        setShowCalendarEventForm(true)
        setShowTaskForm(false)
        setShowActivityForm(false)
        setShowSchoolItemForm(false)
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
            event_type: "Family Event",
            start_date: date || "",
            end_date: "",
            start_time: "",
            end_time: "",
            location: "",
            notes: "",
            repeats_yearly: false,
            session_frequency: "none",
            session_until: ""
        })
    }

    async function handleCreateCalendarEvent(event) {
        event.preventDefault()
        setSavingCalendarEvent(true)

        try {
            const basePayload = {
                title: calendarEventForm.title.trim(),
                event_type: calendarEventForm.event_type,
                start_date: calendarEventForm.start_date || selectedDate,
                end_date: calendarEventForm.end_date || null,
                start_time: calendarEventForm.start_time || null,
                end_time: calendarEventForm.end_time || null,
                location: calendarEventForm.location.trim() || null,
                notes: calendarEventForm.notes.trim() || null,
                repeats_yearly: calendarEventForm.repeats_yearly
            }

            const sessionPayload = {
                ...basePayload,
                session_frequency: calendarEventForm.session_frequency,
                session_until: calendarEventForm.session_until
            }

            if (editingCalendarEventId) {
                await updateCalendarEvent(editingCalendarEventId, basePayload)
            } else {
                const eventsToCreate = buildActivitySessionEvents(sessionPayload)

                for (const eventToCreate of eventsToCreate) {
                    const {
                        session_frequency,
                        session_until,
                        ...cleanEvent
                    } = eventToCreate

                    await createCalendarEvent(cleanEvent)
                }
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

    function resetTaskForm(date = selectedDate) {
        setTaskForm({
            title: "",
            description: "",
            due_date: date || "",
            family_member_id: "",
            activity_id: "",
            status: "open",
            visibility: "household"
        })
    }

    async function handleCreateTask(event) {
        event.preventDefault()
        setSavingTask(true)

        try {
            await createTask({
                title: taskForm.title.trim(),
                description: taskForm.description.trim() || null,
                due_date: taskForm.due_date || selectedDate,
                status: taskForm.status || "open",
                family_member_id: taskForm.family_member_id || null,
                activity_id: taskForm.activity_id || null,
                visibility: taskForm.visibility || "household"
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

    function resetActivityForm(date = selectedDate) {
        setActivityForm({
            name: "",
            family_member_id: "",
            location: "",
            start_date: date || "",
            end_date: date || "",
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
                start_date: activityForm.start_date || selectedDate,
                end_date: activityForm.end_date || activityForm.start_date || selectedDate,
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

    function openAddMenuForm(type) {
        const today = getTodayString()

        setSelectedDate(today)
        setShowAddMenu(false)

        resetCalendarEventForm(today)
        resetTaskForm(today)
        resetActivityForm(today)
        resetSchoolItemForm()

        if (type === "activity") {
            setCalendarEventForm(current => ({
                ...current,
                event_type: "Activity",
                start_date: today,
                end_date: today
            }))

            setShowCalendarEventForm(true)
            setShowTaskForm(false)
            setShowActivityForm(false)
            setShowSchoolItemForm(false)
            return
        }

        setShowCalendarEventForm(type === "event")
        setShowTaskForm(type === "task")
        setShowActivityForm(false)
        setShowSchoolItemForm(type === "school")
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
        preferencesLoading ||
        calendarEventsLoading

    const todayString = getTodayString()

    const weekdayLabels = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ]

    return (
        <AppPage>
            <div className="eg-stack">

                <CalendarHeader
                    householdName={preferences?.household_name || "My Household"}
                    calendarView={calendarView}
                    setCalendarView={setCalendarView}
                    onAdd={() => setShowAddMenu(true)}
                />

                {calendarView === "agenda" && (
                    <CalendarAgenda
                        loading={loading}
                        agendaEventsByDate={agendaEventsByDate}
                        formatAgendaDateLabel={formatAgendaDateLabel}
                        onSelectEvent={(event) => {
                            setSelectedDate(null)
                            setSelectedEvent(event)
                        }}
                    />
                )}

                {calendarView === "month" && (
                    <CalendarMonth
                        loading={loading}
                        visibleDate={visibleDate}
                        monthTitle={formatMonthTitle(visibleDate)}
                        calendarDays={calendarDays}
                        eventsByDate={eventsByDate}
                        todayString={todayString}
                        weekdayLabels={weekdayLabels}
                        onPreviousMonth={goToPreviousMonth}
                        onNextMonth={goToNextMonth}
                        onToday={goToCurrentMonth}
                        onSelectDate={(dateString) => {
                            setSelectedDate(dateString)
                            setShowCalendarEventForm(false)
                            setShowTaskForm(false)
                            resetCalendarEventForm(dateString)
                            resetTaskForm(dateString)
                        }}
                    />
                )}

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
                                                <option>Family Event</option>
                                                <option>Activity</option>
                                                <option>School</option>
                                                <option>Trip</option>
                                                <option>Reminder</option>
                                                <option>Important Date</option>
                                                <option>Holiday</option>
                                                <option>Visitor</option>
                                                <option>Other</option>
                                            </select>
                                        </label>

                                        {calendarEventForm.event_type === "Activity" && (
                                            <>
                                                <label>
                                                    Sessions
                                                    <select
                                                        value={calendarEventForm.session_frequency}
                                                        onChange={event =>
                                                            updateCalendarEventForm(
                                                                "session_frequency",
                                                                event.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="none">One-time activity</option>
                                                        <option value="daily">Daily</option>
                                                        <option value="weekly">Weekly</option>
                                                        <option value="monthly">Monthly</option>
                                                    </select>
                                                </label>

                                                {calendarEventForm.session_frequency !== "none" && (
                                                    <label>
                                                        Repeat Until
                                                        <input
                                                            type="date"
                                                            value={calendarEventForm.session_until}
                                                            onChange={event =>
                                                                updateCalendarEventForm(
                                                                    "session_until",
                                                                    event.target.value
                                                                )
                                                            }
                                                        />
                                                    </label>
                                                )}
                                            </>
                                        )}

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
                                            Repeat
                                            <div className="checkbox-row">
                                                <input
                                                    type="checkbox"
                                                    checked={calendarEventForm.repeats_yearly}
                                                    onChange={event =>
                                                        updateCalendarEventForm(
                                                            "repeats_yearly",
                                                            event.target.checked
                                                        )
                                                    }
                                                />

                                                <span>Repeat every year</span>
                                            </div>
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
                                    <h4>Add To-Do</h4>

                                    <div className="form-grid">
                                        <label>
                                            Title
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

                                        <label>
                                            Due Date
                                            <input
                                                type="date"
                                                value={taskForm.due_date}
                                                onChange={event =>
                                                    setTaskForm({
                                                        ...taskForm,
                                                        due_date: event.target.value
                                                    })
                                                }
                                            />
                                        </label>

                                        <label>
                                            Family Member
                                            <select
                                                value={taskForm.family_member_id}
                                                onChange={event =>
                                                    setTaskForm({
                                                        ...taskForm,
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
                                            Activity
                                            <select
                                                value={taskForm.activity_id}
                                                onChange={event =>
                                                    setTaskForm({
                                                        ...taskForm,
                                                        activity_id: event.target.value
                                                    })
                                                }
                                            >
                                                <option value="">No activity selected</option>

                                                {activities.map(activity => (
                                                    <option key={activity.id} value={activity.id}>
                                                        {activity.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label>
                                            Visibility
                                            <select
                                                value={taskForm.visibility}
                                                onChange={event =>
                                                    setTaskForm({
                                                        ...taskForm,
                                                        visibility: event.target.value
                                                    })
                                                }
                                            >
                                                <option value="household">Family task</option>
                                                <option value="private">Private task</option>
                                            </select>
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
                                            {savingTask ? "Saving..." : "Save To-Do"}
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
                                            Start Date
                                            <input
                                                type="date"
                                                value={activityForm.start_date}
                                                onChange={event =>
                                                    setActivityForm({
                                                        ...activityForm,
                                                        start_date: event.target.value
                                                    })
                                                }
                                            />
                                        </label>

                                        <label>
                                            End Date
                                            <input
                                                type="date"
                                                value={activityForm.end_date}
                                                onChange={event =>
                                                    setActivityForm({
                                                        ...activityForm,
                                                        end_date: event.target.value
                                                    })
                                                }
                                            />
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
                                {showTaskForm ? "Cancel To-Do" : "+ To-Do"}
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
                <CalendarEventDetailSheet
                    event={selectedEvent}
                    open={Boolean(selectedEvent)}
                    onClose={() => setSelectedEvent(null)}
                    onEdit={startEditCalendarEventFromSummary}
                />
            </div>
        </AppPage>
    )
}