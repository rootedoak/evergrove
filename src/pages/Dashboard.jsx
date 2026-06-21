import useActivities from "../hooks/useActivities"
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

import useActivitySessions from "../hooks/useActivitySessions"
import useMeals from "../hooks/useMeals"

import { useNavigate } from "react-router-dom"
import { completeTask, createTask } from "../services/taskService"
import { markRegistrationTaskCreated } from "../services/activityService"

import useCalendarEvents from "../hooks/useCalendarEvents"

import FamilyTimelineCard from "../components/FamilyTimelineCard"

import useAnnouncements from "../hooks/useAnnouncements"
import FamilyAnnouncementsCard from "../components/FamilyAnnouncementsCard"

import useHouseholdFeed from "../hooks/useHouseholdFeed"
import HouseholdFeedCard from "../components/HouseholdFeedCard"

import { getTaskSuggestions } from "../utils/taskSuggestions"

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
                title: activity?.event_name || activity?.name || "Activity session",
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
                title: `${activity.name}`,
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
                title: `${activity.name}`,
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

function getCalendarEventEvents(calendarEvents) {
    return calendarEvents.flatMap(event => {
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
                date,
                icon: "📌",
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
    return trips.flatMap(trip => {
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

                <p>
                    {item.subtitle || "Family"}
                </p>
            </div>
        </div>
    )
}

export default function Dashboard() {
    const [currentUserId, setCurrentUserId] = useState(null)

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

    const { dinnerTonight } = useMeals()

    const {
        feedEvents,
        loading: feedLoading,
    } = useHouseholdFeed(10)

    const {
        calendarEvents,
        loading: calendarEventsLoading
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
        ...getCalendarEventEvents(calendarEvents),
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

    const currentMember = familyMembers.find(
        member => member.user_id === currentUserId
    )

    const childMemberIds = familyMembers
        .filter(isChildMember)
        .map(member => member.id)

    const dashboardTaskScope = preferences?.task_default_view || "mine_family"

    const scopedTasks = useMemo(() => {
        return filterTasksByScope(
            tasks,
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
        loading ||
        tasksLoading ||
        preferencesLoading ||
        activitySessionsLoading ||
        calendarEventsLoading

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
            alert(error.message || "Could not create to-do.")
        }
    }

    async function handleCompleteTask(task) {
        try {
            await completeTask(task)
            await refreshTasks()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not complete to-do.")
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
                householdName={preferences?.household_name || "Family"}
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
                taskSuggestions={showSuggestedTasks ? taskSuggestions : []}
                todayString={todayString}
                onCreateSuggestedTask={handleCreateSuggestedTask}
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
                        activities={activities}
                        tasks={tasks}
                        schoolItems={showSchoolItems ? schoolItems : []}
                        familyMembers={showBirthdays ? familyMembers : []}
                        trips={showTrips ? trips : []}
                        activitySessions={showActivitySessions ? activitySessions : []}
                        calendarEvents={calendarEvents}
                        timelineDays={timelineDays}
                    />
                </div>
            </details>

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
        </div>
    )
}