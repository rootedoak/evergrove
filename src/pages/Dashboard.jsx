import useActivities from "../hooks/useActivities"
import useTasks from "../hooks/useTasks"
import useSchoolItems from "../hooks/useSchoolItems"
import useFamilyMembers from "../hooks/useFamilyMembers"
import useTrips from "../hooks/useTrips"

import { createTask } from "../services/taskService"
import { markRegistrationTaskCreated } from "../services/activityService"

import FamilyTimelineCard from "../components/FamilyTimelineCard"

import { getRegistrationActions } from "../utils/registrationActions"
import { getTaskSuggestions } from "../utils/taskSuggestions"
import { getSchoolActions } from "../utils/schoolActions"

function getTodayString() {
    return new Date().toISOString().slice(0, 10)
}

function getDaysUntil(dateString) {
    if (!dateString) return null

    const today = new Date()
    const target = new Date(`${dateString}T00:00:00`)

    today.setHours(0, 0, 0, 0)

    const diffMs = target - today
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
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

    return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
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

function getUpcomingBirthdayDate(birthdate) {
    if (!birthdate) return null

    const today = new Date()
    const birthDate = new Date(`${birthdate}T00:00:00`)

    let nextBirthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
    )

    today.setHours(0, 0, 0, 0)

    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1)
    }

    return nextBirthday.toISOString().slice(0, 10)
}

function getBirthdayEvents(familyMembers) {
    return familyMembers
        .filter(member => member.birthdate)
        .map(member => {
            const date = getUpcomingBirthdayDate(member.birthdate)
            const birthDate = new Date(`${member.birthdate}T00:00:00`)
            const birthdayDate = new Date(`${date}T00:00:00`)
            const age = birthdayDate.getFullYear() - birthDate.getFullYear()

            return {
                id: `birthday-${member.id}`,
                date,
                icon: "🎂",
                title: `${member.name} turns ${age}`,
                subtitle: "Birthday"
            }
        })
}

function getBirthdayReminders(familyMembers) {
    return getBirthdayEvents(familyMembers)
        .map(item => ({
            ...item,
            days: getDaysUntil(item.date),
            subtitle:
                getDaysUntil(item.date) === 0
                    ? "Today"
                    : getDaysUntil(item.date) === 1
                        ? "Tomorrow"
                        : `In ${getDaysUntil(item.date)} days`
        }))
        .filter(item => item.days !== null && item.days >= 0 && item.days <= 14)
}

function getTripReminders(trips) {
    return trips
        .filter(trip => trip.start_date)
        .map(trip => {
            const days = getDaysUntil(trip.start_date)

            return {
                id: `trip-reminder-${trip.id}`,
                icon: "🚗",
                title: trip.name,
                subtitle:
                    days === 0
                        ? "Starts today"
                        : days === 1
                            ? "Starts tomorrow"
                            : `Starts in ${days} days`,
                days
            }
        })
        .filter(item => item.days !== null && item.days >= 0 && item.days <= 14)
}

function getActivityEvents(activities) {
    return activities.flatMap(activity => {
        const member = activity.family_members
        const avatar = member?.avatar_emoji || "📅"
        const memberName = member?.name
        const timeRange = formatTimeRange(activity.start_time, activity.end_time)

        const events = []

        if (activity.registration_open_date) {
            events.push({
                id: `${activity.id}-registration-open`,
                date: activity.registration_open_date,
                icon: avatar,
                title: `${activity.name} registration opens`,
                subtitle: memberName
            })
        }

        if (activity.registration_close_date) {
            events.push({
                id: `${activity.id}-registration-close`,
                date: activity.registration_close_date,
                icon: avatar,
                title: `${activity.name} registration closes`,
                subtitle: memberName
            })
        }

        if (activity.start_date) {
            events.push({
                id: `${activity.id}-start`,
                date: activity.start_date,
                icon: avatar,
                title: `${activity.name} starts`,
                subtitle: [memberName, timeRange].filter(Boolean).join(" • ")
            })
        }

        if (activity.end_date) {
            events.push({
                id: `${activity.id}-end`,
                date: activity.end_date,
                icon: avatar,
                title: `${activity.name} ends`,
                subtitle: memberName
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
            date: item.due_date,
            icon: item.family_members?.avatar_emoji || "🎒",
            title: item.title,
            subtitle: item.family_members?.name || item.category || "School"
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
                date: trip.start_date,
                icon: "🚗",
                title: trip.name,
                subtitle: attendees || trip.destination || "Trip"
            }
        })
}

function EmptyState({ children }) {
    return <p className="dashboard-empty">{children}</p>
}

function EventRow({ item }) {
    return (
        <div className="dashboard-row">
            <span className="dashboard-row-icon">{item.icon}</span>

            <div>
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

    const todayString = getTodayString()

    const registrationActions = getRegistrationActions(activities)
    const schoolActions = getSchoolActions(schoolItems)
    const taskSuggestions = getTaskSuggestions(activities)

    const birthdayReminders = getBirthdayReminders(familyMembers)
    const tripReminders = getTripReminders(trips)

    const headsUpItems = [
        ...registrationActions.map(item => ({
            id: item.id,
            icon: item.avatar || "📣",
            title: item.title,
            subtitle: item.subtitle,
            days: getDaysUntil(item.date),
            sortOrder: 1
        })),
        ...schoolActions.map(item => ({
            id: item.id,
            icon: item.avatar || "🏫",
            title: item.title,
            subtitle: item.subtitle
                ? `${item.subtitle} • ${item.label}`
                : item.label,
            days: getDaysUntil(item.dueDate),
            sortOrder: 2
        })),
        ...birthdayReminders.map(item => ({
            ...item,
            sortOrder: 3
        })),
        ...tripReminders.map(item => ({
            ...item,
            sortOrder: 4
        }))
    ]
        .filter(item => item.days === null || item.days >= 0)
        .sort((a, b) => {
            if (a.days !== b.days) return (a.days || 0) - (b.days || 0)
            return a.sortOrder - b.sortOrder
        })
        .slice(0, 8)

    const allEvents = [
        ...getActivityEvents(activities),
        ...getSchoolEvents(schoolItems),
        ...getTripEvents(trips),
        ...getBirthdayEvents(familyMembers)
    ]

    const todayEvents = allEvents
        .filter(item => item.date === todayString)
        .sort((a, b) => a.title.localeCompare(b.title))

    const upcomingEvents = allEvents
        .filter(item => {
            const days = getDaysUntil(item.date)
            return days !== null && days > 0 && days <= 7
        })
        .sort((a, b) => a.date.localeCompare(b.date))

    const openTasks = tasks
        .filter(task => task.status !== "complete")
        .sort((a, b) => {
            if (!a.due_date && !b.due_date) return 0
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return a.due_date.localeCompare(b.due_date)
        })
        .slice(0, 8)

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
        }
    }

    return (
        <div className="dashboard-page compact-dashboard">
            <header className="dashboard-simple-header">
                <div>
                    <p className="eyebrow">Evergrove</p>
                    <h2>Today</h2>
                </div>

                <p>
                    A simple view of what is happening today, what is coming up,
                    and what still needs to get done.
                </p>
            </header>

            <div className="dashboard-main-layout">
                <main className="dashboard-left-flow">
                    <section className="card">
                        <div className="card-header-row">
                            <div>
                                <p className="card-kicker">Today</p>
                                <h3>What's Happening</h3>
                            </div>
                        </div>

                        {loading || tasksLoading ? (
                            <EmptyState>Loading today...</EmptyState>
                        ) : todayEvents.length === 0 ? (
                            <EmptyState>Nothing scheduled for today.</EmptyState>
                        ) : (
                            <div className="today-checklist">
                                {todayEvents.map(item => (
                                    <div className="today-checklist-item" key={item.id}>
                                        <span className="today-check-circle" />

                                        <div>
                                            <strong>{item.title}</strong>

                                            {item.subtitle && (
                                                <p>{item.subtitle}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="card">
                        <div className="card-header-row">
                            <div>
                                <p className="card-kicker">Next 7 Days</p>
                                <h3>Coming Up</h3>
                            </div>
                        </div>

                        {loading || tasksLoading ? (
                            <EmptyState>Loading the week ahead...</EmptyState>
                        ) : upcomingEvents.length === 0 ? (
                            <EmptyState>Nothing coming up in the next 7 days.</EmptyState>
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
                                    <div className="dashboard-row" key={task.id}>
                                        <span className="dashboard-row-icon">
                                            {task.family_members?.avatar_emoji || "✅"}
                                        </span>

                                        <div>
                                            <strong>{task.title}</strong>

                                            <p>
                                                {task.family_members?.name || "Task"}
                                                {task.due_date
                                                    ? ` • ${formatDisplayDate(task.due_date)}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                </aside>
            </div>

            {taskSuggestions.length > 0 && (
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
                    schoolItems={schoolItems}
                    familyMembers={familyMembers}
                    trips={trips}
                />
            </div>
        </div>
    )
}