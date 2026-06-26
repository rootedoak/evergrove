import useTasks from "../hooks/useTasks"
import useSchoolItems from "../hooks/useSchoolItems"
import useFamilyMembers from "../hooks/useFamilyMembers"
import useTrips from "../hooks/useTrips"
import usePreferences from "../hooks/usePreferences"

import CommandCenterDailyBrief from "../components/CommandCenterDailyBrief"
import CommandCenterNeedsAttention from "../components/CommandCenterNeedsAttention"
import FloatingQuickActions from "../components/FloatingQuickActions"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"
import { filterTasksByScope } from "../utils/taskFilters"

import useMeals from "../hooks/useMeals"
import { useNavigate } from "react-router-dom"
import { completeTask, updateTask, deleteTask } from "../services/taskService"

import useCalendarEvents from "../hooks/useCalendarEvents"
import { deleteCalendarEvent, updateCalendarEvent } from "../services/calendarEventService"

import FamilyTimelineCard from "../components/FamilyTimelineCard"

import useAnnouncements from "../hooks/useAnnouncements"
import FamilyAnnouncementsCard from "../components/FamilyAnnouncementsCard"

import useHouseholdFeed from "../hooks/useHouseholdFeed"
import HouseholdFeedCard from "../components/HouseholdFeedCard"

import { getFeedReadCounts } from "../services/feedService"

function getDateOnly(value) {
    if (!value) return ""
    return String(value).slice(0, 10)
}

function isChildMember(member) {
    const role = String(member.role || "").toLowerCase()
    return role === "child"
}

function parseDateParts(dateString) {
    const cleanDate = getDateOnly(dateString)
    const [year, month, day] = cleanDate.split("-").map(Number)
    return { year, month, day }
}

function createLocalDate(dateString) {
    const { year, month, day } = parseDateParts(dateString)
    return new Date(year, month - 1, day)
}

function formatDateParts(year, month, day) {
    return [
        year,
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-")
}

function getTodayString() {
    const today = new Date()
    return formatDateParts(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
    )
}

function getWeekRange(weekStartsOn = "sunday") {
    const today = createLocalDate(getTodayString())
    const start = new Date(today)
    const day = start.getDay()

    const offset =
        weekStartsOn === "monday"
            ? day === 0
                ? -6
                : 1 - day
            : -day

    start.setDate(start.getDate() + offset)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return {
        start: formatDateParts(
            start.getFullYear(),
            start.getMonth() + 1,
            start.getDate()
        ),
        end: formatDateParts(
            end.getFullYear(),
            end.getMonth() + 1,
            end.getDate()
        )
    }
}

function formatShortDate(dateString) {
    if (!dateString) return ""

    return createLocalDate(dateString).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
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
    if (startTime && endTime) return `${formatTime(startTime)} - ${formatTime(endTime)}`
    if (startTime) return formatTime(startTime)
    return ""
}

function getMinutesFromTime(timeString) {
    if (!timeString) return 99999

    const [hours, minutes] = timeString.split(":").map(Number)
    return hours * 60 + minutes
}

function isHappeningNow(event) {
    if (!event.start_time || !event.end_time) return false

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    return (
        currentMinutes >= getMinutesFromTime(event.start_time) &&
        currentMinutes <= getMinutesFromTime(event.end_time)
    )
}

function getUpcomingBirthdayDate(birthdate) {
    if (!birthdate) return null

    const { month, day } = parseDateParts(birthdate)
    const today = createLocalDate(getTodayString())

    let birthdayYear = today.getFullYear()
    const nextBirthday = new Date(birthdayYear, month - 1, day)

    if (nextBirthday < today) birthdayYear += 1

    return formatDateParts(birthdayYear, month, day)
}

function getBirthdayEvents(familyMembers) {
    return (Array.isArray(familyMembers) ? familyMembers : [])
        .filter(member => member.birthdate)
        .map(member => {
            const date = getUpcomingBirthdayDate(member.birthdate)
            const { year: birthYear } = parseDateParts(member.birthdate)
            const { year: birthdayYear } = parseDateParts(date)

            return {
                id: `birthday-${member.id}`,
                date,
                icon: "🎂",
                title: `${member.name} turns ${birthdayYear - birthYear}`,
                subtitle: "Birthday",
                sort_time: 99999
            }
        })
}

function getSchoolEvents(schoolItems) {
    return (Array.isArray(schoolItems) ? schoolItems : [])
        .filter(item => item.due_date)
        .map(item => ({
            id: `school-${item.id}`,
            date: getDateOnly(item.due_date),
            icon: item.family_members?.avatar_emoji || "🎒",
            title: item.title,
            subtitle: item.family_members?.name || item.category || "School",
            sort_time: 99999
        }))
}

function getCalendarEventEvents(calendarEvents) {
    return (Array.isArray(calendarEvents) ? calendarEvents : []).flatMap(event => {
        if (!event.start_date) return []

        const events = []
        const startDate = createLocalDate(event.start_date)
        const endDate = createLocalDate(event.end_date || event.start_date)
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            const date = formatDateParts(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                currentDate.getDate()
            )

            events.push({
                id: `calendar-event-${event.id}-${date}`,
                sourceId: event.id,
                sourceType: "calendar_event",
                date,
                icon: event.event_type === "Activity" ? "🏃" : "📌",
                title: event.title,
                subtitle: event.event_type || "Calendar Event",
                detail: event.location || "",
                time_label: formatTimeRange(event.start_time, event.end_time),
                start_time: event.start_time,
                end_time: event.end_time,
                sort_time: getMinutesFromTime(event.start_time)
            })

            currentDate.setDate(currentDate.getDate() + 1)
        }

        return events
    })
}

function getTripEvents(trips) {
    return (Array.isArray(trips) ? trips : []).flatMap(trip => {
        if (!trip.start_date) return []

        const attendees = trip.trip_family_members
            ?.map(attendee => attendee.family_members?.name)
            .filter(Boolean)
            .join(", ")

        const events = []
        const startDate = createLocalDate(trip.start_date)
        const endDate = createLocalDate(trip.end_date || trip.start_date)
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            const date = formatDateParts(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                currentDate.getDate()
            )

            events.push({
                id: `trip-${trip.id}-${date}`,
                date,
                icon: "🚗",
                title: trip.name,
                subtitle: attendees || trip.destination || "Trip",
                sort_time: 99999
            })

            currentDate.setDate(currentDate.getDate() + 1)
        }

        return events
    })
}

function groupEventsByDate(events) {
    return events.reduce((groups, event) => {
        if (!groups[event.date]) groups[event.date] = []
        groups[event.date].push(event)
        return groups
    }, {})
}

function EmptyState({ children }) {
    return <p className="dashboard-empty">{children}</p>
}

function HomeSection({ eyebrow, title, count, children }) {
    return (
        <section className="home-section">
            <div className="home-section-header">
                <div>
                    <p className="card-kicker">{eyebrow}</p>
                    <h3>{title}</h3>
                </div>

                {typeof count === "number" && (
                    <span>{count}</span>
                )}
            </div>

            {children}
        </section>
    )
}

function TodayEventRow({ item }) {
    return (
        <div className="home-check-row">
            <span className="home-check-circle" />

            <div>
                {item.time_label && (
                    <p className="card-kicker">{item.time_label}</p>
                )}

                <strong>{item.title}</strong>

                {item.subtitle && <p>{item.subtitle}</p>}
                {item.detail && <small>{item.detail}</small>}
            </div>
        </div>
    )
}

function UpcomingEventRow({ item }) {
    return (
        <div className="upcoming-event-card">
            <div className="upcoming-event-icon">
                {item.icon}
            </div>

            <div className="upcoming-event-content">
                {item.time_label && (
                    <p className="card-kicker">{item.time_label}</p>
                )}

                <strong>{item.title}</strong>

                <p>{item.subtitle || "Family"}</p>
            </div>
        </div>
    )
}

function dedupeEvents(events) {
    const seen = new Set()

    return events.filter(event => {
        const key = [
            event.date,
            event.title,
            event.subtitle,
            event.time_label || "",
            event.start_time || "",
            event.end_time || ""
        ].join("|")

        if (seen.has(key)) return false

        seen.add(key)
        return true
    })
}

export default function Dashboard() {
    const [currentUserId, setCurrentUserId] = useState(null)

    const [briefModal, setBriefModal] = useState(null)

    const [feedReadCounts, setFeedReadCounts] = useState({})

    const [editingBriefEventId, setEditingBriefEventId] = useState(null)

    const [briefEventForm, setBriefEventForm] = useState({
        title: "",
        event_type: "Family Event",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        location: "",
        notes: "",
        repeats_yearly: false
    })

    const [editingBriefTaskId, setEditingBriefTaskId] = useState(null)

    const [briefTaskForm, setBriefTaskForm] = useState({
        title: "",
        description: "",
        due_date: ""
    })

    const { tasks, loading: tasksLoading, refreshTasks } = useTasks()
    const { schoolItems } = useSchoolItems()
    const { familyMembers } = useFamilyMembers()
    const { trips } = useTrips()
    const { preferences, loading: preferencesLoading } = usePreferences()

    const { dinnerTonight } = useMeals()

    const {
        feedEvents,
        loading: feedLoading,
    } = useHouseholdFeed(10)

    const {
        calendarEvents,
        loading: calendarEventsLoading,
        refreshCalendarEvents
    } = useCalendarEvents()

    const {
        announcements,
        loading: announcementsLoading,
        addAnnouncement,
        editAnnouncement,
        removeAnnouncement,
    } = useAnnouncements()

    const navigate = useNavigate()

    const todayString = getTodayString()
    const weekStartsOn = preferences?.week_starts_on || "sunday"
    const currentWeek = getWeekRange(weekStartsOn)
    const timelineDays = Number(preferences?.timeline_window_days || 90)

    const showBirthdays = preferences?.show_birthdays !== false
    const showTrips = preferences?.show_trips !== false
    const showSchoolItems = preferences?.show_school_items !== false

    const allEvents = dedupeEvents([
        ...(showSchoolItems ? getSchoolEvents(schoolItems) : []),
        ...(showTrips ? getTripEvents(trips) : []),
        ...getCalendarEventEvents(calendarEvents),
        ...(showBirthdays ? getBirthdayEvents(familyMembers) : [])
    ])

    const todayEvents = allEvents
        .filter(item => item.date === todayString)
        .sort((a, b) => {
            if ((a.sort_time || 99999) !== (b.sort_time || 99999)) {
                return (a.sort_time || 99999) - (b.sort_time || 99999)
            }

            return a.title.localeCompare(b.title)
        })

    const happeningNowEvents = todayEvents.filter(isHappeningNow)

    const upcomingEvents = allEvents
        .filter(item => {
            return (
                item.date > todayString &&
                item.date >= currentWeek.start &&
                item.date <= currentWeek.end
            )
        })
        .sort((a, b) => {
            const dateDiff = createLocalDate(a.date) - createLocalDate(b.date)
            if (dateDiff !== 0) return dateDiff

            if ((a.sort_time || 99999) !== (b.sort_time || 99999)) {
                return (a.sort_time || 99999) - (b.sort_time || 99999)
            }

            return a.title.localeCompare(b.title)
        })

    const upcomingEventsByDate = groupEventsByDate(upcomingEvents)

    const currentMember = (Array.isArray(familyMembers) ? familyMembers : []).find(
        member => member.user_id === currentUserId
    )

    const childMemberIds = (Array.isArray(familyMembers) ? familyMembers : [])
        .filter(isChildMember)
        .map(member => member.id)

    const dashboardTaskScope = preferences?.task_default_view || "mine_family"

    const scopedTasks = useMemo(() => {
        return filterTasksByScope(
            Array.isArray(tasks) ? tasks : [],
            dashboardTaskScope,
            currentMember?.id,
            childMemberIds
        )
    }, [tasks, dashboardTaskScope, currentMember?.id, childMemberIds])

    const openTasks = scopedTasks
        .filter(task => {
            if (task.status === "complete") return false
            if (!task.due_date) return false

            return task.due_date <= currentWeek.end
        })
        .sort((a, b) => {
            if (!a.due_date && !b.due_date) return 0
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return createLocalDate(a.due_date) - createLocalDate(b.due_date)
        })

    const dashboardLoading =
        tasksLoading ||
        preferencesLoading ||
        calendarEventsLoading

    async function handleCompleteTask(task) {
        try {
            await completeTask(task)
            await refreshTasks()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not complete to-do.")
        }
    }

    function startEditBriefTask(task) {
        setEditingBriefTaskId(task.id)

        setBriefTaskForm({
            title: task.title || "",
            description: task.description || "",
            due_date: task.due_date || ""
        })
    }

    function cancelEditBriefTask() {
        setEditingBriefTaskId(null)

        setBriefTaskForm({
            title: "",
            description: "",
            due_date: ""
        })
    }

    async function handleUpdateBriefTask(task) {
        try {
            await updateTask(task.id, {
                title: briefTaskForm.title.trim(),
                description: briefTaskForm.description.trim() || null,
                due_date: briefTaskForm.due_date || null
            })

            cancelEditBriefTask()
            await refreshTasks()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not update task.")
        }
    }

    async function handleDeleteBriefTask(task) {
        if (!window.confirm(`Delete "${task.title}"?`)) return

        try {
            await deleteTask(task.id)
            await refreshTasks()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not delete task.")
        }
    }

    async function handleDeleteBriefEvent(event) {
        if (!event.sourceId) return

        if (!window.confirm(`Delete "${event.title}"?`)) return

        try {
            await deleteCalendarEvent(event.sourceId)
            await refreshCalendarEvents()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not delete event.")
        }
    }

    function startEditBriefEvent(event) {
        const existingEvent = calendarEvents.find(
            calendarEvent => calendarEvent.id === event.sourceId
        )

        if (!existingEvent) return

        setEditingBriefEventId(existingEvent.id)

        setBriefEventForm({
            title: existingEvent.title || "",
            event_type: existingEvent.event_type || "Family Event",
            start_date: existingEvent.start_date || "",
            end_date: existingEvent.end_date || "",
            start_time: existingEvent.start_time || "",
            end_time: existingEvent.end_time || "",
            location: existingEvent.location || "",
            notes: existingEvent.notes || "",
            repeats_yearly: Boolean(existingEvent.repeats_yearly)
        })
    }

    function cancelEditBriefEvent() {
        setEditingBriefEventId(null)

        setBriefEventForm({
            title: "",
            event_type: "Family Event",
            start_date: "",
            end_date: "",
            start_time: "",
            end_time: "",
            location: "",
            notes: "",
            repeats_yearly: false
        })
    }

    async function handleUpdateBriefEvent(event) {
        try {
            await updateCalendarEvent(editingBriefEventId, {
                title: briefEventForm.title.trim(),
                event_type: briefEventForm.event_type,
                start_date: briefEventForm.start_date || event.date,
                end_date: briefEventForm.end_date || null,
                start_time: briefEventForm.start_time || null,
                end_time: briefEventForm.end_time || null,
                location: briefEventForm.location.trim() || null,
                notes: briefEventForm.notes.trim() || null,
                repeats_yearly: briefEventForm.repeats_yearly
            })

            cancelEditBriefEvent()
            await refreshCalendarEvents()

        } catch (error) {
            console.error(error)
            alert(error.message || "Could not update event.")
        }
    }

    useEffect(() => {
        async function loadCurrentUser() {
            const {
                data: { user },
                error
            } = await supabase.auth.getUser()

            if (error) {
                console.error(error)
                return
            }

            setCurrentUserId(user?.id || null)
        }

        loadCurrentUser()
    }, [])

    useEffect(() => {
        async function loadFeedReadCounts() {
            if (!Array.isArray(feedEvents) || feedEvents.length === 0) {
                setFeedReadCounts({})
                return
            }

            try {
                const counts = await getFeedReadCounts(
                    feedEvents.map(event => event.id)
                )

                setFeedReadCounts(counts)
            } catch (error) {
                console.error("Could not load feed read counts:", error)
            }
        }

        loadFeedReadCounts()
    }, [feedEvents])

    return (
        <div className="home-command-page">
            <header className="dashboard-simple-header dashboard-household-header">
                <div>
                    <p className="dashboard-household-name">
                        {preferences?.household_name || "My Household"}
                    </p>

                    <h2>Family Command Center</h2>

                    <p className="dashboard-date">
                        {new Date().toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "long",
                            day: "numeric"
                        })}
                    </p>

                    <p className="dashboard-powered-by">
                        Powered by Evergrove
                    </p>
                </div>
            </header>

            {happeningNowEvents.length > 0 && (
                <div className="home-now-banner">
                    {happeningNowEvents.map(item => (
                        <div key={item.id}>
                            <strong>Happening now:</strong>{" "}
                            {item.title}
                            {item.subtitle && ` • ${item.subtitle}`}
                            {item.end_time && ` • Ends ${formatTime(item.end_time)}`}
                        </div>
                    ))}
                </div>
            )}

            <CommandCenterDailyBrief

                onOpenEvents={() => setBriefModal("events")}
                onOpenTasks={() => setBriefModal("tasks")}
                onOpenDinner={() => setBriefModal("dinner")}
                householdName={preferences?.household_name || "Family"}
                userName={currentMember?.name}
                todayEvents={todayEvents || []}
                todayTasks={openTasks.filter(task => task.due_date === todayString)}
                tonightDinner={dinnerTonight}
                upcomingItems={upcomingEvents || []}
                attentionCount={
                    scopedTasks.filter(task => {
                        if (task.status === "complete") return false
                        return task.due_date && task.due_date <= todayString
                    }).length
                }
            />

            <CommandCenterNeedsAttention
                tasks={scopedTasks}
                schoolItems={schoolItems}
                taskSuggestions={[]}
                todayString={todayString}
                onCreateSuggestedTask={() => { }}
                onCompleteTask={handleCompleteTask}
            />

            <HomeSection
                eyebrow="Today"
                title="Today's Agenda"
                count={todayEvents.length}
            >
                {dashboardLoading ? (
                    <EmptyState>Loading today...</EmptyState>
                ) : todayEvents.length === 0 ? (
                    <EmptyState>Enjoy your day. Nothing scheduled for today.</EmptyState>
                ) : (
                    <div className="home-check-list">
                        {todayEvents.map(item => (
                            <TodayEventRow key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </HomeSection>

            <HouseholdFeedCard
                feedEvents={feedEvents}
                loading={feedLoading}
                readCounts={feedReadCounts}
            />

            <FamilyAnnouncementsCard
                announcements={announcements}
                loading={announcementsLoading}
                onAdd={addAnnouncement}
                onEdit={editAnnouncement}
                onDelete={removeAnnouncement}
            />

            <HomeSection
                eyebrow="This Week"
                title="Coming Up"
                count={upcomingEvents.length}
            >
                {dashboardLoading ? (
                    <EmptyState>Loading the week ahead...</EmptyState>
                ) : upcomingEvents.length === 0 ? (
                    <EmptyState>Nothing else coming up this week.</EmptyState>
                ) : (
                    <div className="home-week-list">
                        {Object.keys(upcomingEventsByDate).map(date => (
                            <div className="home-day-group" key={date}>
                                <div className="home-day-label">
                                    {formatShortDate(date)}
                                </div>

                                <div className="home-day-events">
                                    {upcomingEventsByDate[date].map(item => (
                                        <UpcomingEventRow key={item.id} item={item} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </HomeSection>

            <details className="timeline-expandable">
                <summary>
                    <span>Family Timeline</span>
                    <small>View recent and upcoming family history</small>
                </summary>

                <div className="home-timeline-section">
                    <FamilyTimelineCard
                        activities={[]}
                        tasks={Array.isArray(tasks) ? tasks : []}
                        schoolItems={showSchoolItems ? schoolItems : []}
                        familyMembers={showBirthdays ? familyMembers : []}
                        trips={showTrips && Array.isArray(trips) ? trips : []}
                        activitySessions={[]}
                        calendarEvents={Array.isArray(calendarEvents) ? calendarEvents : []}
                        timelineDays={timelineDays}
                    />
                </div>
            </details>

            {briefModal && (
                <div
                    className="task-action-backdrop"
                    onClick={() => setBriefModal(null)}
                >
                    <div
                        className="task-action-sheet"
                        onClick={event => event.stopPropagation()}
                    >
                        {briefModal === "events" && (
                            <>
                                <h3>Events Today</h3>

                                {todayEvents.length === 0 ? (
                                    <p className="muted-text">Nothing scheduled today.</p>
                                ) : (
                                    todayEvents.map(event => (
                                        <div key={event.id} className="mini-row dashboard-event-detail-row">
                                            {editingBriefEventId === event.sourceId ? (
                                                <div className="dashboard-task-edit-form">
                                                    <input
                                                        className="form-input"
                                                        value={briefEventForm.title}
                                                        onChange={inputEvent =>
                                                            setBriefEventForm({
                                                                ...briefEventForm,
                                                                title: inputEvent.target.value
                                                            })
                                                        }
                                                        placeholder="Event title"
                                                    />

                                                    <select
                                                        className="form-input"
                                                        value={briefEventForm.event_type}
                                                        onChange={inputEvent =>
                                                            setBriefEventForm({
                                                                ...briefEventForm,
                                                                event_type: inputEvent.target.value
                                                            })
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

                                                    <div className="two-column-form">
                                                        <input
                                                            className="form-input"
                                                            type="date"
                                                            value={briefEventForm.start_date}
                                                            onChange={inputEvent =>
                                                                setBriefEventForm({
                                                                    ...briefEventForm,
                                                                    start_date: inputEvent.target.value
                                                                })
                                                            }
                                                        />

                                                        <input
                                                            className="form-input"
                                                            type="date"
                                                            value={briefEventForm.end_date}
                                                            onChange={inputEvent =>
                                                                setBriefEventForm({
                                                                    ...briefEventForm,
                                                                    end_date: inputEvent.target.value
                                                                })
                                                            }
                                                        />
                                                    </div>

                                                    <div className="two-column-form">
                                                        <input
                                                            className="form-input"
                                                            type="time"
                                                            value={briefEventForm.start_time}
                                                            onChange={inputEvent =>
                                                                setBriefEventForm({
                                                                    ...briefEventForm,
                                                                    start_time: inputEvent.target.value
                                                                })
                                                            }
                                                        />

                                                        <input
                                                            className="form-input"
                                                            type="time"
                                                            value={briefEventForm.end_time}
                                                            onChange={inputEvent =>
                                                                setBriefEventForm({
                                                                    ...briefEventForm,
                                                                    end_time: inputEvent.target.value
                                                                })
                                                            }
                                                        />
                                                    </div>

                                                    <input
                                                        className="form-input"
                                                        value={briefEventForm.location}
                                                        onChange={inputEvent =>
                                                            setBriefEventForm({
                                                                ...briefEventForm,
                                                                location: inputEvent.target.value
                                                            })
                                                        }
                                                        placeholder="Location"
                                                    />

                                                    <textarea
                                                        className="form-input"
                                                        rows="2"
                                                        value={briefEventForm.notes}
                                                        onChange={inputEvent =>
                                                            setBriefEventForm({
                                                                ...briefEventForm,
                                                                notes: inputEvent.target.value
                                                            })
                                                        }
                                                        placeholder="Notes"
                                                    />

                                                    <label className="checkbox-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={briefEventForm.repeats_yearly}
                                                            onChange={inputEvent =>
                                                                setBriefEventForm({
                                                                    ...briefEventForm,
                                                                    repeats_yearly: inputEvent.target.checked
                                                                })
                                                            }
                                                        />

                                                        <span>Repeat every year</span>
                                                    </label>

                                                    <div className="button-row">
                                                        <button
                                                            type="button"
                                                            className="primary-button"
                                                            onClick={() => handleUpdateBriefEvent(event)}
                                                        >
                                                            Save
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="secondary-button"
                                                            onClick={cancelEditBriefEvent}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="mini-avatar">
                                                        {event.icon || "📌"}
                                                    </span>

                                                    <div className="dashboard-event-detail-content">
                                                        <strong>{event.title}</strong>

                                                        {event.subtitle && (
                                                            <p>{event.subtitle}</p>
                                                        )}

                                                        {event.time_label && (
                                                            <small>{event.time_label}</small>
                                                        )}

                                                        {event.detail && (
                                                            <small>{event.detail}</small>
                                                        )}
                                                    </div>

                                                    <div className="dashboard-task-actions">
                                                        {event.sourceType === "calendar_event" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="dashboard-task-edit"
                                                                    onClick={() => startEditBriefEvent(event)}
                                                                >
                                                                    ✏️
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="dashboard-task-edit danger"
                                                                    onClick={() => handleDeleteBriefEvent(event)}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}

                                <button type="button" onClick={() => setBriefModal(null)}>
                                    Close
                                </button>
                            </>
                        )}

                        {briefModal === "tasks" && (
                            <>
                                <h3>Tasks Due</h3>

                                {openTasks.filter(task => task.due_date === todayString).length === 0 ? (
                                    <p className="muted-text">No tasks due today.</p>
                                ) : (
                                    openTasks
                                        .filter(task => task.due_date === todayString)
                                        .map(task => (
                                            <div key={task.id} className="mini-row dashboard-task-row">
                                                {editingBriefTaskId === task.id ? (
                                                    <div className="dashboard-task-edit-form">
                                                        <input
                                                            className="form-input"
                                                            value={briefTaskForm.title}
                                                            onChange={event =>
                                                                setBriefTaskForm({
                                                                    ...briefTaskForm,
                                                                    title: event.target.value
                                                                })
                                                            }
                                                        />

                                                        <textarea
                                                            className="form-input"
                                                            rows="2"
                                                            value={briefTaskForm.description}
                                                            onChange={event =>
                                                                setBriefTaskForm({
                                                                    ...briefTaskForm,
                                                                    description: event.target.value
                                                                })
                                                            }
                                                        />

                                                        <input
                                                            className="form-input"
                                                            type="date"
                                                            value={briefTaskForm.due_date}
                                                            onChange={event =>
                                                                setBriefTaskForm({
                                                                    ...briefTaskForm,
                                                                    due_date: event.target.value
                                                                })
                                                            }
                                                        />

                                                        <div className="button-row">
                                                            <button
                                                                type="button"
                                                                className="primary-button"
                                                                onClick={() => handleUpdateBriefTask(task)}
                                                            >
                                                                Save
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="secondary-button"
                                                                onClick={cancelEditBriefTask}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="dashboard-task-check-circle"
                                                            onClick={() => handleCompleteTask(task)}
                                                            aria-label={`Complete ${task.title}`}
                                                        />

                                                        <div className="dashboard-task-content">
                                                            <strong>{task.title}</strong>

                                                            {task.description && (
                                                                <p>{task.description}</p>
                                                            )}

                                                            {task.due_date && (
                                                                <small>Due {task.due_date}</small>
                                                            )}
                                                        </div>

                                                        <div className="dashboard-task-actions">
                                                            <button
                                                                type="button"
                                                                className="dashboard-task-edit"
                                                                onClick={() => startEditBriefTask(task)}
                                                            >
                                                                ✏️
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="dashboard-task-edit danger"
                                                                onClick={() => handleDeleteBriefTask(task)}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                )}

                                <button type="button" onClick={() => setBriefModal(null)}>
                                    Close
                                </button>
                            </>
                        )}

                        {briefModal === "dinner" && (
                            <>
                                <h3>Dinner Tonight</h3>

                                {dinnerTonight ? (
                                    <div className="dashboard-dinner-detail">
                                        <div className="mini-row">
                                            <span className="mini-avatar">🍽️</span>

                                            <div>
                                                <strong>{dinnerTonight.meal_name}</strong>

                                                {dinnerTonight.meal_category && (
                                                    <p>{dinnerTonight.meal_category}</p>
                                                )}

                                                {dinnerTonight.notes && (
                                                    <small>{dinnerTonight.notes}</small>
                                                )}
                                            </div>
                                        </div>

                                        <div className="dashboard-dinner-actions">
                                            {(dinnerTonight.recipe_url || dinnerTonight.meal?.recipe_url) && (
                                                <a
                                                    href={
                                                        (dinnerTonight.recipe_url || dinnerTonight.meal?.recipe_url).startsWith("http")
                                                            ? (dinnerTonight.recipe_url || dinnerTonight.meal?.recipe_url)
                                                            : `https://${dinnerTonight.recipe_url || dinnerTonight.meal?.recipe_url}`
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="secondary-button"
                                                >
                                                    View Recipe
                                                </a>
                                            )}

                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={() => navigate("/meals")}
                                            >
                                                Open Meals
                                            </button>

                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={() => navigate("/shopping")}
                                            >
                                                Open Shopping List
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="dashboard-dinner-detail">
                                        <p className="muted-text">No dinner planned yet.</p>

                                        <button
                                            type="button"
                                            className="primary-button"
                                            onClick={() =>
                                                navigate("/meals", {
                                                    state: {
                                                        openMealPlanForm: true,
                                                        selectedDate: todayString
                                                    }
                                                })
                                            }
                                        >
                                            Plan Dinner
                                        </button>
                                    </div>
                                )}

                                <button type="button" onClick={() => setBriefModal(null)}>
                                    Close
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <FloatingQuickActions
                onAddTask={() =>
                    navigate("/calendar", {
                        state: {
                            openTaskForm: true,
                            selectedDate: todayString
                        }
                    })
                }
                onAddEvent={() =>
                    navigate("/calendar", {
                        state: {
                            openCalendarEventForm: true,
                            selectedDate: todayString
                        }
                    })
                }
                onAddMeal={() =>
                    navigate("/meals", {
                        state: {
                            openMealPlanForm: true,
                            selectedDate: todayString
                        }
                    })
                }
                onAddShopping={() =>
                    navigate("/shopping", {
                        state: {
                            openShoppingForm: true
                        }
                    })
                }
                onAddAnnouncement={() => {
                    const button = document.querySelector(".family-announcements-card .secondary-button")
                    button?.click()
                }}
            />
        </div >
    )
}