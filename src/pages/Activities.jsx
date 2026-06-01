import { useEffect, useMemo, useState } from "react"
import {
    createActivity,
    deleteActivity,
    getActivities,
    updateActivity
} from "../services/activityService"
import {
    createActivitySession,
    deleteActivitySession
} from "../services/activitySessionService"
import { getFamilyMembers } from "../services/familyService"
import { getRegistrationStatus } from "../utils/activityStatus"
import useActivitySessions from "../hooks/useActivitySessions"

const activityTypeConfig = {
    Activity: {
        icon: "📅",
        showFamilyMember: true,
        showOrganization: true,
        showSeason: true,
        showRegistration: true,
        showCost: true,
        showSessions: true,
        namePlaceholder: "Basketball Camp",
        locationPlaceholder: "Gym, field, classroom..."
    },
    Travel: {
        icon: "🚗",
        showFamilyMember: false,
        showOrganization: false,
        showSeason: false,
        showRegistration: false,
        showCost: true,
        showSessions: false,
        namePlaceholder: "Travel to tournament",
        locationPlaceholder: "Abilene, TX → Dallas, TX"
    },
    Lodging: {
        icon: "🏨",
        showFamilyMember: false,
        showOrganization: false,
        showSeason: false,
        showRegistration: false,
        showCost: true,
        showSessions: false,
        namePlaceholder: "Hotel Check-In",
        locationPlaceholder: "Hotel name or address"
    },
    Appointment: {
        icon: "🗓️",
        showFamilyMember: true,
        showOrganization: true,
        showSeason: false,
        showRegistration: false,
        showCost: true,
        showSessions: false,
        namePlaceholder: "Dentist Appointment",
        locationPlaceholder: "Office name or address"
    },
    School: {
        icon: "🎒",
        showFamilyMember: true,
        showOrganization: true,
        showSeason: false,
        showRegistration: false,
        showCost: false,
        showSessions: false,
        namePlaceholder: "School Program",
        locationPlaceholder: "School, classroom, auditorium..."
    },
    Birthday: {
        icon: "🎂",
        showFamilyMember: true,
        showOrganization: false,
        showSeason: false,
        showRegistration: false,
        showCost: true,
        showSessions: false,
        namePlaceholder: "Birthday Party",
        locationPlaceholder: "Home, park, party venue..."
    },
    Holiday: {
        icon: "🎉",
        showFamilyMember: false,
        showOrganization: false,
        showSeason: false,
        showRegistration: false,
        showCost: false,
        showSessions: false,
        namePlaceholder: "Thanksgiving",
        locationPlaceholder: "Home, family house, destination..."
    },
    Other: {
        icon: "📌",
        showFamilyMember: true,
        showOrganization: true,
        showSeason: false,
        showRegistration: false,
        showCost: true,
        showSessions: false,
        namePlaceholder: "Family Event",
        locationPlaceholder: "Location..."
    }
}

const activityTypes = Object.keys(activityTypeConfig)

const initialForm = {
    family_member_id: "",
    name: "",
    organization: "",
    season: "",
    activity_type: "Activity",
    location: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    registration_open_date: "",
    registration_close_date: "",
    cost: "",
    notes: "",
    parent_activity_id: ""
}

const initialSessionForm = {
    session_date: "",
    start_time: "",
    end_time: "",
    location: "",
    notes: ""
}

function getTypeConfig(type) {
    return activityTypeConfig[type] || activityTypeConfig.Activity
}

function normalizeActivity(activity) {
    return {
        family_member_id: activity.family_member_id || "",
        name: activity.name || "",
        organization: activity.organization || "",
        season: activity.season || "",
        activity_type: activity.activity_type || "Activity",
        location: activity.location || "",
        start_date: activity.start_date || "",
        end_date: activity.end_date || "",
        start_time: activity.start_time || "",
        end_time: activity.end_time || "",
        registration_open_date: activity.registration_open_date || "",
        registration_close_date: activity.registration_close_date || "",
        cost: activity.cost ?? "",
        notes: activity.notes || "",
        parent_activity_id: activity.parent_activity_id || ""
    }
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

function formatDate(dateString) {
    if (!dateString) return ""

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    })
}

function formatDateRange(startDate, endDate) {
    if (startDate && endDate && startDate !== endDate) {
        return `${formatDate(startDate)} - ${formatDate(endDate)}`
    }

    if (startDate) return formatDate(startDate)
    if (endDate) return formatDate(endDate)

    return "No date set"
}

function addDays(dateString, days) {
    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    const date = new Date(year, month - 1, day)
    date.setDate(date.getDate() + days)

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-")
}

function getDatesBetween(startDate, endDate, stepDays = 1) {
    if (!startDate || !endDate) return []

    const dates = []
    let current = startDate

    while (current <= endDate) {
        dates.push(current)
        current = addDays(current, stepDays)
    }

    return dates
}

function sortActivitiesByDate(a, b) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    function createLocalDate(dateString) {
        const [year, month, day] = String(dateString)
            .slice(0, 10)
            .split("-")
            .map(Number)

        return new Date(year, month - 1, day)
    }

    function getClosestRelevantDate(activity) {
        const dates = [activity.start_date, activity.end_date]
            .filter(Boolean)
            .map(createLocalDate)
            .filter(date => date >= today)
            .sort((dateA, dateB) => dateA - dateB)

        if (dates.length > 0) return dates[0]

        return new Date(9999, 11, 31)
    }

    const aDate = getClosestRelevantDate(a)
    const bDate = getClosestRelevantDate(b)

    if (aDate.getTime() !== bDate.getTime()) return aDate - bDate

    return (a.name || "").localeCompare(b.name || "")
}

function getActivityIcon(activity) {
    return getTypeConfig(activity.activity_type).icon
}

function getActivityMeta(activity, member) {
    return [
        activity.activity_type || "Activity",
        member?.name,
        activity.season,
        activity.location
    ]
        .filter(Boolean)
        .join(" • ")
}

function getTodayString() {
    const today = new Date()
    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-")
}

function createLocalDate(dateString) {
    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day)
}

function getDaysUntil(dateString) {
    if (!dateString) return null

    const today = createLocalDate(getTodayString())
    const target = createLocalDate(dateString)

    return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function groupActivities(activities) {
    const groups = {
        thisWeek: [],
        later: [],
        unscheduled: [],
        past: []
    }

    activities.forEach(activity => {
        const date = activity.start_date || activity.end_date
        const daysUntil = getDaysUntil(date)

        if (daysUntil === null) {
            groups.unscheduled.push(activity)
            return
        }

        if (daysUntil < 0) {
            groups.past.push(activity)
            return
        }

        if (daysUntil <= 7) {
            groups.thisWeek.push(activity)
            return
        }

        groups.later.push(activity)
    })

    return groups
}

function ActivitySection({
    title,
    subtitle,
    activities,
    emptyText,
    renderActivityRow,
    className = ""
}) {
    return (
        <section className={`activity-command-section ${className}`}>
            <div className="activity-section-header">
                <div>
                    <h3>{title}</h3>
                    {subtitle && <p>{subtitle}</p>}
                </div>

                <span>{activities.length}</span>
            </div>

            {activities.length === 0 ? (
                <p className="dashboard-empty">{emptyText}</p>
            ) : (
                <div className="activity-command-list">
                    {activities.map(activity => renderActivityRow(activity))}
                </div>
            )}
        </section>
    )
}

export default function Activities() {
    const { activitySessions, refreshActivitySessions } = useActivitySessions()

    const [activities, setActivities] = useState([])
    const [familyMembers, setFamilyMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [expandedActivityId, setExpandedActivityId] = useState(null)
    const [expandedAssociatedActivityIds, setExpandedAssociatedActivityIds] = useState([])
    const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState(() => {
        return localStorage.getItem("evergrove_activity_family_filter") || "all"
    })

    const [sessionActivityId, setSessionActivityId] = useState(null)
    const [sessionForm, setSessionForm] = useState(initialSessionForm)
    const [savingSession, setSavingSession] = useState(false)

    const currentTypeConfig = getTypeConfig(form.activity_type)

    const activitiesById = useMemo(() => {
        return activities.reduce((map, activity) => {
            map[activity.id] = activity
            return map
        }, {})
    }, [activities])

    const childActivitiesByParentId = useMemo(() => {
        return activities.reduce((map, activity) => {
            if (!activity.parent_activity_id) return map

            if (!map[activity.parent_activity_id]) {
                map[activity.parent_activity_id] = []
            }

            map[activity.parent_activity_id].push(activity)
            return map
        }, {})
    }, [activities])

    const visibleActivities = useMemo(() => {
        return activities
            .filter(activity => {
                if (selectedFamilyMemberId !== "all") {
                    if (activity.family_member_id !== selectedFamilyMemberId) {
                        return false
                    }
                }

                if (!activity.parent_activity_id) return true
                return !activitiesById[activity.parent_activity_id]
            })
            .sort(sortActivitiesByDate)
    }, [activities, activitiesById, selectedFamilyMemberId])

    const groupedActivities = groupActivities(visibleActivities)

    const parentOptions = useMemo(() => {
        return activities
            .filter(activity => activity.id !== editingId)
            .sort(sortActivitiesByDate)
    }, [activities, editingId])

    const activeCount =
        groupedActivities.thisWeek.length +
        groupedActivities.later.length +
        groupedActivities.unscheduled.length

    async function loadData() {
        try {
            const [activityData, memberData] = await Promise.all([
                getActivities(),
                getFamilyMembers()
            ])

            setActivities(activityData || [])
            setFamilyMembers(memberData || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        localStorage.setItem(
            "evergrove_activity_family_filter",
            selectedFamilyMemberId
        )
    }, [selectedFamilyMemberId])

    function updateForm(field, value) {
        setForm(current => ({
            ...current,
            [field]: value
        }))
    }

    function updateActivityType(value) {
        const config = getTypeConfig(value)

        setForm(current => ({
            ...current,
            activity_type: value,
            family_member_id: config.showFamilyMember ? current.family_member_id : "",
            organization: config.showOrganization ? current.organization : "",
            season: config.showSeason ? current.season : "",
            registration_open_date: config.showRegistration
                ? current.registration_open_date
                : "",
            registration_close_date: config.showRegistration
                ? current.registration_close_date
                : "",
            cost: config.showCost ? current.cost : ""
        }))
    }

    function updateSessionForm(field, value) {
        setSessionForm(current => ({
            ...current,
            [field]: value
        }))
    }

    function resetForm() {
        setForm({ ...initialForm })
        setEditingId(null)
        setShowForm(false)
    }

    function resetSessionForm() {
        setSessionForm({ ...initialSessionForm })
        setSessionActivityId(null)
    }

    function startEdit(activity) {
        setEditingId(activity.id)
        setForm(normalizeActivity(activity))
        setShowForm(true)
        setExpandedActivityId(activity.parent_activity_id || activity.id)

        if (activity.parent_activity_id) {
            setExpandedAssociatedActivityIds(current =>
                current.includes(activity.parent_activity_id)
                    ? current
                    : [...current, activity.parent_activity_id]
            )
        }

        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    function startAddAssociatedEvent(parentActivity) {
        setEditingId(null)
        setForm({
            ...initialForm,
            family_member_id: parentActivity.family_member_id || "",
            organization: parentActivity.organization || "",
            season: parentActivity.season || "",
            location: parentActivity.location || "",
            parent_activity_id: parentActivity.id
        })
        setShowForm(true)
        setExpandedActivityId(parentActivity.id)
        setExpandedAssociatedActivityIds(current =>
            current.includes(parentActivity.id)
                ? current
                : [...current, parentActivity.id]
        )
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    function toggleExpanded(activityId) {
        setExpandedActivityId(current =>
            current === activityId ? null : activityId
        )
    }

    function toggleAssociatedEvents(activityId) {
        setExpandedAssociatedActivityIds(current =>
            current.includes(activityId)
                ? current.filter(id => id !== activityId)
                : [...current, activityId]
        )
    }

    function getSessionsForActivity(activityId) {
        return activitySessions
            .filter(session => session.activity_id === activityId)
            .sort((a, b) => a.session_date.localeCompare(b.session_date))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)

        const config = getTypeConfig(form.activity_type)

        const payload = {
            ...form,
            family_member_id:
                config.showFamilyMember && form.family_member_id
                    ? form.family_member_id
                    : null,
            organization:
                config.showOrganization && form.organization.trim()
                    ? form.organization.trim()
                    : null,
            season:
                config.showSeason && form.season.trim()
                    ? form.season.trim()
                    : null,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
            start_time: form.start_time || null,
            end_time: form.end_time || null,
            registration_open_date:
                config.showRegistration && form.registration_open_date
                    ? form.registration_open_date
                    : null,
            registration_close_date:
                config.showRegistration && form.registration_close_date
                    ? form.registration_close_date
                    : null,
            cost:
                config.showCost && form.cost !== ""
                    ? Number(form.cost)
                    : null,
            parent_activity_id: form.parent_activity_id || null,
            activity_type: form.activity_type || "Activity",
            location: form.location.trim() || null,
            notes: form.notes.trim() || null
        }

        try {
            if (editingId) {
                await updateActivity(editingId, payload)
                setExpandedActivityId(payload.parent_activity_id || editingId)
            } else {
                const created = await createActivity(payload)
                setExpandedActivityId(payload.parent_activity_id || created?.id || null)

                if (payload.parent_activity_id) {
                    setExpandedAssociatedActivityIds(current =>
                        current.includes(payload.parent_activity_id)
                            ? current
                            : [...current, payload.parent_activity_id]
                    )
                }
            }

            resetForm()
            await loadData()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not save activity.")
        } finally {
            setSaving(false)
        }
    }

    async function handleCreateSession(event) {
        event.preventDefault()
        if (!sessionActivityId) return

        setSavingSession(true)

        try {
            await createActivitySession({
                activity_id: sessionActivityId,
                session_date: sessionForm.session_date,
                start_time: sessionForm.start_time || null,
                end_time: sessionForm.end_time || null,
                location: sessionForm.location.trim() || null,
                notes: sessionForm.notes.trim() || null
            })

            resetSessionForm()
            await refreshActivitySessions()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not save session.")
        } finally {
            setSavingSession(false)
        }
    }

    async function handleGenerateSessions(activity, frequency) {
        if (!activity.start_date || !activity.end_date) {
            alert("Add a start date and end date before generating sessions.")
            return
        }

        const stepDays = frequency === "weekly" ? 7 : 1
        const dates = getDatesBetween(activity.start_date, activity.end_date, stepDays)

        if (dates.length === 0) return

        const existingDates = getSessionsForActivity(activity.id).map(
            session => session.session_date
        )

        const datesToCreate = dates.filter(date => !existingDates.includes(date))

        if (datesToCreate.length === 0) {
            alert("Sessions already exist for those dates.")
            return
        }

        try {
            await Promise.all(
                datesToCreate.map(date =>
                    createActivitySession({
                        activity_id: activity.id,
                        session_date: date,
                        start_time: activity.start_time || null,
                        end_time: activity.end_time || null,
                        location: activity.location || null,
                        notes: null
                    })
                )
            )

            await refreshActivitySessions()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not generate sessions.")
        }
    }

    async function handleCopyLastSession(activity, sessions) {
        if (sessions.length === 0) {
            alert("Add at least one session before copying.")
            return
        }

        const lastSession = [...sessions].sort(
            (a, b) => b.session_date.localeCompare(a.session_date)
        )[0]

        try {
            await createActivitySession({
                activity_id: activity.id,
                session_date: addDays(lastSession.session_date, 7),
                start_time: lastSession.start_time || null,
                end_time: lastSession.end_time || null,
                location: lastSession.location || null,
                notes: lastSession.notes || null
            })

            await refreshActivitySessions()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not copy session.")
        }
    }

    async function handleDeleteSession(session) {
        if (!window.confirm("Delete this session?")) return

        try {
            await deleteActivitySession(session.id)
            await refreshActivitySessions()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not delete session.")
        }
    }

    async function handleDelete(activity) {
        const childActivities = childActivitiesByParentId[activity.id] || []

        if (childActivities.length > 0) {
            alert("This activity has associated events. Remove or reassign those events before deleting it.")
            return
        }

        const confirmed = window.confirm(
            `Delete ${activity.name}? This cannot be undone.`
        )

        if (!confirmed) return

        try {
            await deleteActivity(activity.id)
            setExpandedActivityId(null)
            await loadData()
            await refreshActivitySessions()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not delete activity.")
        }
    }

    function renderActivityRow(activity) {
        const config = getTypeConfig(activity.activity_type)
        const member = activity.family_members
        const timeRange = formatTimeRange(activity.start_time, activity.end_time)
        const sessions = getSessionsForActivity(activity.id)
        const isAddingSession = sessionActivityId === activity.id
        const childActivities = (childActivitiesByParentId[activity.id] || [])
            .sort(sortActivitiesByDate)
        const isExpanded = expandedActivityId === activity.id
        const areAssociatedEventsExpanded =
            expandedAssociatedActivityIds.includes(activity.id)
        const icon = getActivityIcon(activity)

        return (
            <div className="activity-command-item" key={activity.id}>
                <div className="activity-command-row">
                    <span className="activity-command-icon">{icon}</span>

                    <button
                        className="activity-command-main"
                        type="button"
                        onClick={() => toggleExpanded(activity.id)}
                    >
                        <strong>{activity.name}</strong>

                        <p>
                            {formatDateRange(activity.start_date, activity.end_date)}
                            {timeRange ? ` • ${timeRange}` : ""}
                        </p>

                        <small>{getActivityMeta(activity, member)}</small>
                    </button>

                    <div className="activity-command-badges">
                        {config.showRegistration && (
                            <span className={`status-pill ${getRegistrationStatus(activity).className}`}>
                                {getRegistrationStatus(activity).label}
                            </span>
                        )}

                        {childActivities.length > 0 && (
                            <span className="status-pill">
                                {childActivities.length} linked
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        className="secondary-button activity-details-button"
                        onClick={() => toggleExpanded(activity.id)}
                    >
                        {isExpanded ? "Hide" : "Details"}
                    </button>
                </div>

                {isExpanded && (
                    <div className="activity-details-panel">
                        <div className="activity-detail-grid">
                            {activity.organization && (
                                <div>
                                    <p className="card-kicker">Organization</p>
                                    <strong>{activity.organization}</strong>
                                </div>
                            )}

                            {activity.location && (
                                <div>
                                    <p className="card-kicker">Location</p>
                                    <strong>{activity.location}</strong>
                                </div>
                            )}

                            {config.showCost && activity.cost !== null && activity.cost !== undefined && (
                                <div>
                                    <p className="card-kicker">Cost</p>
                                    <strong>${Number(activity.cost).toFixed(2)}</strong>
                                </div>
                            )}

                            {config.showRegistration && activity.registration_open_date && (
                                <div>
                                    <p className="card-kicker">Registration Opens</p>
                                    <strong>{formatDate(activity.registration_open_date)}</strong>
                                </div>
                            )}

                            {config.showRegistration && activity.registration_close_date && (
                                <div>
                                    <p className="card-kicker">Registration Closes</p>
                                    <strong>{formatDate(activity.registration_close_date)}</strong>
                                </div>
                            )}
                        </div>

                        {activity.notes && (
                            <div>
                                <p className="card-kicker">Notes</p>
                                <p>{activity.notes}</p>
                            </div>
                        )}

                        {childActivities.length > 0 && (
                            <div className="sessions-section">
                                <div className="sessions-header">
                                    <div>
                                        <p className="card-kicker">Associated Events</p>
                                        <h4>{childActivities.length} linked to this activity</h4>
                                    </div>

                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => toggleAssociatedEvents(activity.id)}
                                    >
                                        {areAssociatedEventsExpanded ? "Hide" : "Show"}
                                    </button>
                                </div>

                                {areAssociatedEventsExpanded && (
                                    <div className="sessions-grid">
                                        {childActivities.map(child => (
                                            <div className="session-item" key={child.id}>
                                                <div>
                                                    <strong>
                                                        {getActivityIcon(child)} {child.name}
                                                    </strong>

                                                    <p>
                                                        {formatDateRange(
                                                            child.start_date,
                                                            child.end_date
                                                        )}
                                                    </p>

                                                    {child.location && (
                                                        <small>{child.location}</small>
                                                    )}
                                                </div>

                                                <div className="sessions-actions">
                                                    <button
                                                        className="secondary-button"
                                                        type="button"
                                                        onClick={() => startEdit(child)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="danger-button"
                                                        type="button"
                                                        onClick={() => handleDelete(child)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {config.showSessions && (
                            <div className="sessions-section">
                                <div className="sessions-header">
                                    <div>
                                        <p className="card-kicker">Sessions</p>
                                        <h4>Activity Schedule</h4>
                                    </div>

                                    <div className="sessions-actions">
                                        <button className="secondary-button" type="button" onClick={() => handleGenerateSessions(activity, "daily")}>
                                            Generate Daily
                                        </button>

                                        <button className="secondary-button" type="button" onClick={() => handleGenerateSessions(activity, "weekly")}>
                                            Generate Weekly
                                        </button>

                                        <button className="secondary-button" type="button" onClick={() => handleCopyLastSession(activity, sessions)}>
                                            Copy Last
                                        </button>

                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() => {
                                                if (isAddingSession) {
                                                    resetSessionForm()
                                                } else {
                                                    setSessionActivityId(activity.id)
                                                    setSessionForm({
                                                        session_date: activity.start_date || "",
                                                        start_time: activity.start_time || "",
                                                        end_time: activity.end_time || "",
                                                        location: activity.location || "",
                                                        notes: ""
                                                    })
                                                }
                                            }}
                                        >
                                            {isAddingSession ? "Cancel" : "+ Add Session"}
                                        </button>
                                    </div>
                                </div>

                                {sessions.length === 0 ? (
                                    <p>No sessions added yet.</p>
                                ) : (
                                    <div className="sessions-grid">
                                        {sessions.map(session => {
                                            const sessionTime = formatTimeRange(
                                                session.start_time,
                                                session.end_time
                                            )

                                            return (
                                                <div className="session-item" key={session.id}>
                                                    <div>
                                                        <strong>{formatDate(session.session_date)}</strong>
                                                        {sessionTime && <p>{sessionTime}</p>}
                                                        {session.location && <p>{session.location}</p>}
                                                        {session.notes && <small>{session.notes}</small>}
                                                    </div>

                                                    <button
                                                        className="danger-button session-delete"
                                                        type="button"
                                                        onClick={() => handleDeleteSession(session)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {isAddingSession && (
                                    <form className="form-grid" onSubmit={handleCreateSession}>
                                        <label>
                                            Session Date
                                            <input
                                                type="date"
                                                value={sessionForm.session_date}
                                                onChange={event =>
                                                    updateSessionForm("session_date", event.target.value)
                                                }
                                                required
                                            />
                                        </label>

                                        <label>
                                            Start Time
                                            <input
                                                type="time"
                                                value={sessionForm.start_time}
                                                onChange={event =>
                                                    updateSessionForm("start_time", event.target.value)
                                                }
                                            />
                                        </label>

                                        <label>
                                            End Time
                                            <input
                                                type="time"
                                                value={sessionForm.end_time}
                                                onChange={event =>
                                                    updateSessionForm("end_time", event.target.value)
                                                }
                                            />
                                        </label>

                                        <label>
                                            Location
                                            <input
                                                value={sessionForm.location}
                                                onChange={event =>
                                                    updateSessionForm("location", event.target.value)
                                                }
                                                placeholder="Gym, field, classroom..."
                                            />
                                        </label>

                                        <label className="full-width">
                                            Notes
                                            <textarea
                                                rows="2"
                                                value={sessionForm.notes}
                                                onChange={event =>
                                                    updateSessionForm("notes", event.target.value)
                                                }
                                            />
                                        </label>

                                        <button
                                            className="primary-button full-width"
                                            type="submit"
                                            disabled={savingSession}
                                        >
                                            {savingSession ? "Saving..." : "Save Session"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        <div className="card-actions">
                            <button className="secondary-button" type="button" onClick={() => startAddAssociatedEvent(activity)}>
                                + Add Associated Event
                            </button>

                            <button className="secondary-button" type="button" onClick={() => startEdit(activity)}>
                                Edit
                            </button>

                            <button className="danger-button" type="button" onClick={() => handleDelete(activity)}>
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="activities-command-page">
            <header className="calendar-header activities-command-header">
                <div>
                    <p className="dashboard-household-name">Activities</p>
                    <h2>Family Activities</h2>

                    <p className="activities-header-summary">
                        {activeCount} active • {groupedActivities.thisWeek.length} this week •{" "}
                        {groupedActivities.past.length} past
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                        if (showForm) {
                            resetForm()
                        } else {
                            setForm({ ...initialForm })
                            setEditingId(null)
                            setShowForm(true)
                        }
                    }}
                >
                    {showForm ? "Cancel" : "+ Add Activity"}
                </button>
            </header>

            {showForm && (
                <section className="card form-card">
                    <h3>{editingId ? "Edit Activity" : "Add Activity"}</h3>

                    <form className="form-grid" onSubmit={handleSubmit}>
                        {currentTypeConfig.showFamilyMember && (
                            <label>
                                Family Member
                                <select value={form.family_member_id} onChange={event => updateForm("family_member_id", event.target.value)}>
                                    <option value="">No family member selected</option>
                                    {familyMembers.map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.avatar_emoji ? `${member.avatar_emoji} ` : ""}
                                            {member.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}

                        <label>
                            Activity Type
                            <select value={form.activity_type} onChange={event => updateActivityType(event.target.value)}>
                                {activityTypes.map(type => (
                                    <option key={type} value={type}>
                                        {activityTypeConfig[type].icon} {type}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Parent Activity
                            <select value={form.parent_activity_id} onChange={event => updateForm("parent_activity_id", event.target.value)}>
                                <option value="">None</option>
                                {parentOptions.map(activity => (
                                    <option key={activity.id} value={activity.id}>
                                        {getActivityIcon(activity)} {activity.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Name
                            <input
                                value={form.name}
                                onChange={event => updateForm("name", event.target.value)}
                                placeholder={currentTypeConfig.namePlaceholder}
                                required
                            />
                        </label>

                        {currentTypeConfig.showOrganization && (
                            <label>
                                Organization
                                <input value={form.organization} onChange={event => updateForm("organization", event.target.value)} placeholder="YMCA, school, church..." />
                            </label>
                        )}

                        {currentTypeConfig.showSeason && (
                            <label>
                                Season
                                <input value={form.season} onChange={event => updateForm("season", event.target.value)} placeholder="Summer 2026" />
                            </label>
                        )}

                        <label>
                            Location
                            <input value={form.location} onChange={event => updateForm("location", event.target.value)} placeholder={currentTypeConfig.locationPlaceholder} />
                        </label>

                        <label>
                            Start Date
                            <input type="date" value={form.start_date} onChange={event => updateForm("start_date", event.target.value)} />
                        </label>

                        <label>
                            End Date
                            <input type="date" value={form.end_date} onChange={event => updateForm("end_date", event.target.value)} />
                        </label>

                        <label>
                            Start Time
                            <input type="time" value={form.start_time} onChange={event => updateForm("start_time", event.target.value)} />
                        </label>

                        <label>
                            End Time
                            <input type="time" value={form.end_time} onChange={event => updateForm("end_time", event.target.value)} />
                        </label>

                        {currentTypeConfig.showRegistration && (
                            <>
                                <label>
                                    Registration Opens
                                    <input type="date" value={form.registration_open_date} onChange={event => updateForm("registration_open_date", event.target.value)} />
                                </label>

                                <label>
                                    Registration Closes
                                    <input type="date" value={form.registration_close_date} onChange={event => updateForm("registration_close_date", event.target.value)} />
                                </label>
                            </>
                        )}

                        {currentTypeConfig.showCost && (
                            <label>
                                Cost
                                <input type="number" min="0" step="0.01" value={form.cost} onChange={event => updateForm("cost", event.target.value)} placeholder="75.00" />
                            </label>
                        )}

                        <label className="full-width">
                            Notes
                            <textarea value={form.notes} onChange={event => updateForm("notes", event.target.value)} rows="3" />
                        </label>

                        <button className="primary-button full-width" type="submit" disabled={saving}>
                            {saving ? "Saving..." : editingId ? "Save Changes" : "Save Activity"}
                        </button>
                    </form>
                </section>
            )}

            <section className="card activities-command-card">
                <div className="activity-command-toolbar">
                    <div>
                        <p className="card-kicker">Filter</p>
                        <h3>Upcoming Activities</h3>
                    </div>

                    <select
                        className="activity-filter-select"
                        value={selectedFamilyMemberId}
                        onChange={event => setSelectedFamilyMemberId(event.target.value)}
                    >
                        <option value="all">Entire Family</option>

                        {familyMembers.map(member => (
                            <option key={member.id} value={member.id}>
                                {member.avatar_emoji ? `${member.avatar_emoji} ` : ""}
                                {member.name}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <p>Loading activities...</p>
                ) : visibleActivities.length === 0 ? (
                    <p className="dashboard-empty">No activities found for this filter.</p>
                ) : (
                    <>
                        <ActivitySection
                            title="This Week"
                            subtitle="Coming up soon."
                            activities={groupedActivities.thisWeek}
                            emptyText="Nothing this week."
                            renderActivityRow={renderActivityRow}
                        />

                        <ActivitySection
                            title="Later"
                            subtitle="Upcoming after this week."
                            activities={groupedActivities.later}
                            emptyText="No later activities."
                            renderActivityRow={renderActivityRow}
                        />

                        <ActivitySection
                            title="Unscheduled"
                            subtitle="Saved without a date."
                            activities={groupedActivities.unscheduled}
                            emptyText="No unscheduled activities."
                            renderActivityRow={renderActivityRow}
                        />

                        {groupedActivities.past.length > 0 && (
                            <ActivitySection
                                title="Past"
                                subtitle="Already happened."
                                activities={groupedActivities.past}
                                emptyText="No past activities."
                                renderActivityRow={renderActivityRow}
                            />
                        )}
                    </>
                )}
            </section>
        </div>
    )
}