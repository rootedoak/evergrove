import useActivities from "../hooks/useActivities"
import useTasks from "../hooks/useTasks"
import useSchoolItems from "../hooks/useSchoolItems"
import useFamilyMembers from "../hooks/useFamilyMembers"
import useTrips from "../hooks/useTrips"
import usePreferences from "../hooks/usePreferences"
import useActivitySessions from "../hooks/useActivitySessions"
import useMeals from "../hooks/useMeals"

import { useNavigate } from "react-router-dom"
import { completeTask, createTask } from "../services/taskService"
import { markRegistrationTaskCreated } from "../services/activityService"

import FamilyTimelineCard from "../components/FamilyTimelineCard"

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

function formatDisplayDate(dateString) {
    if (!dateString) return ""

    return createLocalDate(dateString).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    })
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
            const timeRange = formatTimeRange(session.start_time, session.end_time)

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
                sort_time: getMinutesFromTime(session.start_time)
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
                sort_time: getMinutesFromTime(activity.start_time)
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

function TaskRow({ task, onComplete }) {
    return (
        <div className="home-task-row">
            <button
                className="home-check-circle home-task-check"
                type="button"
                aria-label="Complete task"
                onClick={() => onComplete(task)}
            />

            <div>
                <strong>{task.title}</strong>

                <p>
                    {task.family_members?.name || "Task"}
                    {task.due_date ? ` • ${formatDisplayDate(task.due_date)}` : ""}
                </p>
            </div>
        </div>
    )
}

function UpcomingEventRow({ item }) {
    return (
        <div className="home-upcoming-row">
            <span className="home-upcoming-icon">{item.icon}</span>

            <div>
                {item.time_label && (
                    <p className="card-kicker">{item.time_label}</p>
                )}

                <strong>{item.title}</strong>

                <p>
                    {item.subtitle || "Family"}
                </p>
            </div>
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

    const { dinnerTonight, loading: mealsLoading } = useMeals()

    const todayString = getTodayString()
    const dashboardWindowDays = Number(preferences?.dashboard_window_days || 7)
    const timelineDays = Number(preferences?.timeline_window_days || 90)

    const navigate = useNavigate()

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
        ...(showActivitySessions ? getActivitySessionEvents(activitySessions) : []),
        ...(showSchoolItems ? getSchoolEvents(schoolItems) : []),
        ...(showTrips ? getTripEvents(trips) : []),
        ...(showBirthdays ? getBirthdayEvents(familyMembers) : [])
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
            return days !== null && days > 0 && days <= dashboardWindowDays
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

    const openTasks = tasks
        .filter(task => task.status !== "complete")
        .sort((a, b) => {
            if (!a.due_date && !b.due_date) return 0
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return createLocalDate(a.due_date) - createLocalDate(b.due_date)
        })
        .slice(0, 6)

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
                    <div className="home-quick-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => navigate("/tasks")}
                        >
                            + Task
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => navigate("/activities")}
                        >
                            + Activity
                        </button>
                    </div>
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

            <HomeSection
                eyebrow="Dinner"
                title="Tonight's Dinner"
            >
                {mealsLoading ? (
                    <EmptyState>Loading dinner...</EmptyState>
                ) : dinnerTonight ? (
                    <div className="home-check-list">
                        <div className="home-check-row">
                            <span className="home-check-circle" />

                            <div>
                                <strong>{dinnerTonight.meal_name}</strong>

                                {dinnerTonight.notes && (
                                    <p>{dinnerTonight.notes}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <EmptyState>No dinner planned tonight.</EmptyState>
                )}
            </HomeSection>

            <HomeSection
                eyebrow="Tasks"
                title="Open Tasks"
                count={openTasks.length}
            >
                {tasksLoading ? (
                    <EmptyState>Loading tasks...</EmptyState>
                ) : openTasks.length === 0 ? (
                    <EmptyState>No open tasks.</EmptyState>
                ) : (
                    <div className="home-check-list">
                        {openTasks.map(task => (
                            <TaskRow
                                key={task.id}
                                task={task}
                                onComplete={handleCompleteTask}
                            />
                        ))}
                    </div>
                )}
            </HomeSection>

            <HomeSection
                eyebrow={`Next ${dashboardWindowDays} Days`}
                title="This Week"
                count={upcomingEvents.length}
            >
                {dashboardLoading ? (
                    <EmptyState>Loading the week ahead...</EmptyState>
                ) : upcomingEvents.length === 0 ? (
                    <EmptyState>
                        Nothing coming up in the next {dashboardWindowDays} days.
                    </EmptyState>
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

            {showSuggestedTasks && taskSuggestions.length > 0 && (
                <HomeSection
                    eyebrow="Suggested"
                    title="Helpful Next Steps"
                    count={taskSuggestions.length}
                >
                    <div className="home-suggestion-list">
                        {taskSuggestions.map(suggestion => (
                            <div className="home-suggestion-row" key={suggestion.activityId}>
                                <span className="home-upcoming-icon">
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
                </HomeSection>
            )}

            <div className="home-timeline-section">
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