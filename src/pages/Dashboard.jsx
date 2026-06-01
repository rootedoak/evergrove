import useActivities from "../hooks/useActivities"
import useTasks from "../hooks/useTasks"
import useSchoolItems from "../hooks/useSchoolItems"
import useFamilyMembers from "../hooks/useFamilyMembers"
import useTrips from "../hooks/useTrips"
import usePreferences from "../hooks/usePreferences"
import useActivitySessions from "../hooks/useActivitySessions"

import { completeTask, createTask } from "../services/taskService"
import { markRegistrationTaskCreated } from "../services/activityService"

import FamilyTimelineCard from "../components/FamilyTimelineCard"

import { getRegistrationActions } from "../utils/registrationActions"
import { getTaskSuggestions } from "../utils/taskSuggestions"

function getDateOnly(value) {
    if (!value) return ""
    return String(value).slice(0, 10)
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

function getDaysUntil(dateString) {
    if (!dateString) return null

    const today = createLocalDate(getTodayString())
    const target = createLocalDate(dateString)

    return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function formatDateLabel(dateString) {
    const days = getDaysUntil(dateString)

    if (days === 0) return "Today"
    if (days === 1) return "Tomorrow"
    if (days > 1) return `In ${days} days`

    return "Past due"
}

function formatDisplayDate(dateString) {
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
    if (startTime && endTime) {
        return `${formatTime(startTime)} - ${formatTime(endTime)}`
    }

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

    if (nextBirthday < today) {
        birthdayYear += 1
    }

    return formatDateParts(birthdayYear, month, day)
}

function getBirthdayEvents(familyMembers) {
    return familyMembers
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

function getActivitySessionEvents(activitySessions) {
    return activitySessions
        .filter(session => session.session_date)
        .map(session => {
            const activity = session.activities
            const member = activity?.family_members
            const timeRange = formatTimeRange(
                session.start_time,
                session.end_time
            )

            return {
                id: `activity-session-${session.id}`,
                date: getDateOnly(session.session_date),
                icon: member?.avatar_emoji || "📅",
                title: activity?.name || "Activity Session",
                subtitle: member?.name || "",
                detail: session.location || "",
                time_label: timeRange,
                start_time: session.start_time,
                end_time: session.end_time,
                sort_time: getMinutesFromTime(session.start_time),
                activity_id: session.activity_id,
                event_type: "session"
            }
        })
}

function getActivityEvents(activities, activitySessions = []) {
    const activityIdsWithSessions = new Set(
        activitySessions
            .map(session => session.activity_id)
            .filter(Boolean)
    )

    return activities.flatMap(activity => {
        const member = activity.family_members
        const avatar = member?.avatar_emoji || "📅"
        const memberName = member?.name
        const timeRange = formatTimeRange(activity.start_time, activity.end_time)
        const hasSessions = activityIdsWithSessions.has(activity.id)

        const events = []

        if (activity.registration_open_date) {
            events.push({
                id: `${activity.id}-registration-open`,
                date: getDateOnly(activity.registration_open_date),
                icon: avatar,
                title: `${activity.name} registration opens`,
                subtitle: memberName,
                sort_time: 99999
            })
        }

        if (activity.registration_close_date) {
            events.push({
                id: `${activity.id}-registration-close`,
                date: getDateOnly(activity.registration_close_date),
                icon: avatar,
                title: `${activity.name} registration closes`,
                subtitle: memberName,
                sort_time: 99999
            })
        }

        if (!hasSessions && activity.start_date) {
            events.push({
                id: `${activity.id}-start`,
                date: getDateOnly(activity.start_date),
                icon: avatar,
                title: `${activity.name} starts`,
                subtitle: memberName,
                detail: "",
                time_label: timeRange,
                start_time: activity.start_time,
                end_time: activity.end_time,
                sort_time: getMinutesFromTime(activity.start_time),
                event_type: "activity"
            })
        }

        if (!hasSessions && activity.end_date) {
            events.push({
                id: `${activity.id}-end`,
                date: getDateOnly(activity.end_date),
                icon: avatar,
                title: `${activity.name} ends`,
                subtitle: memberName,
                sort_time: 99999
            })
        }

        return events
    })
}

function getSchoolEvents(schoolItems) {
    return schoolItems
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

function getTripEvents(trips) {
    return trips
        .filter(trip => trip.start_date)
        .map(trip => {
            const attendees = trip.trip_family_members
                ?.map(attendee => attendee.family_members?.name)
                .filter(Boolean)
                .join(", ")

            return {
                id: `trip-${trip.id}-start`,
                date: getDateOnly(trip.start_date),
                icon: "🚗",
                title: trip.name,
                subtitle: attendees || trip.destination || "Trip",
                sort_time: 99999
            }
        })
}

function EmptyState({ children }) {
    return <p className="dashboard-empty">{children}</p>
}

function TodayEventRow({ item }) {
    return (
        <div className="today-checklist-item" key={item.id}>
            <span className="today-check-circle" />

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

function EventRow({ item }) {
    return (
        <div className="dashboard-row">
            <span className="dashboard-row-icon">{item.icon}</span>

            <div>
                {item.time_label && (
                    <p className="card-kicker">{item.time_label}</p>
                )}

                <strong>{item.title}</strong>

                <p>
                    {item.subtitle && `${item.subtitle} • `}
                    {formatDisplayDate(item.date)}
                </p>
            </div>

            <span className="dashboard-date-pill">
                {formatDateLabel(item.date)}
            </span>
        </div>
    )
}

export default function Dashboard() {
    const { activities, loading, refreshActivities } = useActivities()
    const { tasks, loading: tasksLoading, refreshTasks } = useTasks()
    const { schoolItems } = useSchoolItems()
    const { familyMembers } = useFamilyMembers()
    const { trips } = useTrips()
    const { preferences, loading: preferencesLoading } = usePreferences()
    const {
        activitySessions,
        loading: activitySessionsLoading
    } = useActivitySessions()

    const todayString = getTodayString()

    const dashboardWindowDays = Number(
        preferences?.dashboard_window_days || 7
    )

    const timelineDays = Number(
        preferences?.timeline_window_days || 90
    )

    const showBirthdays = preferences?.show_birthdays !== false
    const showTrips = preferences?.show_trips !== false
    const showSchoolItems = preferences?.show_school_items !== false
    const showSuggestedTasks = preferences?.show_suggested_tasks !== false
    const showActivitySessions = preferences?.show_activity_sessions !== false

    const taskSuggestions = getTaskSuggestions(activities)

    const allEvents = [
        ...getActivityEvents(
            activities,
            showActivitySessions ? activitySessions : []
        ),

        ...(showActivitySessions
            ? getActivitySessionEvents(activitySessions)
            : []),

        ...(showSchoolItems
            ? getSchoolEvents(schoolItems)
            : []),

        ...(showTrips
            ? getTripEvents(trips)
            : []),

        ...(showBirthdays
            ? getBirthdayEvents(familyMembers)
            : [])
    ]

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
            const days = getDaysUntil(item.date)

            return (
                days !== null &&
                days > 0 &&
                days <= dashboardWindowDays
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

    const openTasks = tasks
        .filter(task => task.status !== "complete")
        .sort((a, b) => {
            if (!a.due_date && !b.due_date) return 0
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return createLocalDate(a.due_date) - createLocalDate(b.due_date)
        })
        .slice(0, 8)

    const dashboardLoading =
        loading ||
        tasksLoading ||
        preferencesLoading ||
        activitySessionsLoading

    async function handleCreateSuggestedTask(suggestion) {
        try {
            await createTask({
                title: suggestion.title,
                description: `Registration task created from ${suggestion.activityName}.`,
                due_date: null,
                status: "open",
                family_member_id: suggestion.familyMemberId,
                activity_id: suggestion.activityId
            })

            await markRegistrationTaskCreated(suggestion.activityId)
            await refreshActivities()
            await refreshTasks()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not create task.")
        }
    }

    async function handleCompleteTask(task) {
        try {
            await completeTask(task)
            await refreshTasks()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not complete task.")
        }
    }

    return (
        <div className="dashboard-page compact-dashboard">
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
                <div className="dashboard-now-banner">
                    {happeningNowEvents.map(item => (
                        <div key={item.id}>
                            <strong>🟢 Happening Now:</strong>{" "}
                            {item.title}
                            {item.subtitle && ` • ${item.subtitle}`}
                            {item.end_time &&
                                ` • Ends ${formatTime(item.end_time)}`}
                        </div>
                    ))}
                </div>
            )}

            <div className="dashboard-main-layout">
                <main className="dashboard-left-flow">
                    <section className="card">
                        <div className="card-header-row">
                            <div>
                                <p className="card-kicker">Today</p>
                                <h3>What's Happening</h3>
                            </div>
                        </div>

                        {dashboardLoading ? (
                            <EmptyState>Loading today...</EmptyState>
                        ) : todayEvents.length === 0 ? (
                            <EmptyState>Enjoy your day! Nothing scheduled for today.</EmptyState>
                        ) : (
                            <div className="today-checklist">
                                {todayEvents.map(item => (
                                    <TodayEventRow key={item.id} item={item} />
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="card">
                        <div className="card-header-row">
                            <div>
                                <p className="card-kicker">
                                    Next {dashboardWindowDays} Days
                                </p>
                                <h3>Coming Up</h3>
                            </div>
                        </div>

                        {dashboardLoading ? (
                            <EmptyState>Loading the week ahead...</EmptyState>
                        ) : upcomingEvents.length === 0 ? (
                            <EmptyState>
                                Nothing coming up in the next {dashboardWindowDays} days.
                            </EmptyState>
                        ) : (
                            <div className="dashboard-list">
                                {upcomingEvents.map(item => (
                                    <EventRow key={item.id} item={item} />
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                <aside className="dashboard-right-rail">
                    <section className="card">
                        <div className="card-header-row">
                            <div>
                                <p className="card-kicker">Tasks</p>
                                <h3>Open Tasks</h3>
                            </div>
                        </div>

                        {tasksLoading ? (
                            <EmptyState>Loading tasks...</EmptyState>
                        ) : openTasks.length === 0 ? (
                            <EmptyState>No open tasks.</EmptyState>
                        ) : (
                            <div className="dashboard-list">
                                {openTasks.map(task => (
                                    <div className="dashboard-task-row" key={task.id}>
                                        <div>
                                            <strong>{task.title}</strong>

                                            <p>
                                                {task.family_members?.name || "Task"}
                                                {task.due_date
                                                    ? ` • ${formatDisplayDate(task.due_date)}`
                                                    : ""}
                                            </p>
                                        </div>

                                        <button
                                            className="secondary-button dashboard-task-complete"
                                            type="button"
                                            onClick={() => handleCompleteTask(task)}
                                        >
                                            Complete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </aside>
            </div>

            {showSuggestedTasks && taskSuggestions.length > 0 && (
                <section className="card">
                    <div className="card-header-row">
                        <div>
                            <p className="card-kicker">Suggested</p>
                            <h3>Helpful Next Steps</h3>
                        </div>
                    </div>

                    <div className="dashboard-list">
                        {taskSuggestions.map(suggestion => (
                            <div className="dashboard-row" key={suggestion.activityId}>
                                <span className="dashboard-row-icon">
                                    {suggestion.avatar}
                                </span>

                                <div>
                                    <strong>{suggestion.title}</strong>

                                    {suggestion.daysRemaining !== null && (
                                        <p>
                                            Registration closes in{" "}
                                            {suggestion.daysRemaining}{" "}
                                            {suggestion.daysRemaining === 1 ? "day" : "days"}.
                                        </p>
                                    )}
                                </div>

                                <button
                                    className="secondary-button"
                                    type="button"
                                    onClick={() => handleCreateSuggestedTask(suggestion)}
                                >
                                    Create Task
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="dashboard-wide">
                <FamilyTimelineCard
                    activities={activities}
                    tasks={tasks}
                    schoolItems={showSchoolItems ? schoolItems : []}
                    familyMembers={showBirthdays ? familyMembers : []}
                    trips={showTrips ? trips : []}
                    activitySessions={showActivitySessions ? activitySessions : []}
                    timelineDays={timelineDays}
                />
            </div>
        </div>
    )
}