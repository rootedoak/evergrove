import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { supabase } from "../lib/supabase"

import {
    completeTask,
    createTask,
    deleteTask,
    getTasks,
    updateTask
} from "../services/taskService"

import { getActivities } from "../services/activityService"
import { getFamilyMembers } from "../services/familyService"

import usePreferences from "../hooks/usePreferences"
import { updatePreferences } from "../services/preferenceService"

import { filterTasksByScope } from "../utils/taskFilters"

import {
    getLocalDateString,
    isDateInCurrentWeek
} from "../utils/dateUtils"

const initialForm = {
    title: "",
    description: "",
    due_date: "",
    status: "open",
    family_member_id: "",
    activity_id: "",
    trip_id: "",
    visibility: "household"
}

const taskScopes = [
    { key: "mine_family", label: "Mine + Family" },
    { key: "mine", label: "Mine" },
    { key: "family", label: "Family" },
    { key: "kids", label: "Kids" },
    { key: "all", label: "All" }
]

function normalizeTask(task) {
    return {
        title: task.title || "",
        description: task.description || "",
        due_date: task.due_date || "",
        status: task.status || "open",
        family_member_id: task.family_member_id || "",
        activity_id: task.activity_id || "",
        trip_id: task.trip_id || "",
        visibility: task.visibility || "household"
    }
}

function createLocalDate(dateString) {
    const [year, month, day] = String(dateString).slice(0, 10).split("-").map(Number)
    return new Date(year, month - 1, day)
}

function getDaysUntil(dateString) {
    if (!dateString) return null

    const today = createLocalDate(getLocalDateString())
    const target = createLocalDate(dateString)

    return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function formatDisplayDate(dateString) {
    if (!dateString) return "No due date"

    return createLocalDate(dateString).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    })
}

function getTaskMeta(task, familyMembers) {
    const member = task.family_members
    const creator = familyMembers.find(
        familyMember => familyMember.user_id === task.user_id
    )

    const pieces = []

    if (member?.name) pieces.push(member.name)
    if (task.due_date) pieces.push(formatDisplayDate(task.due_date))
    if (task.activities?.name) pieces.push(task.activities.name)
    if (task.trips?.name) pieces.push(task.trips.name)
    if (task.visibility === "private") pieces.push("Private")
    if (creator?.name && task.visibility === "household") {
        pieces.push(`Created by ${creator.name}`)
    }

    return pieces.join(" • ")
}

function isChildMember(member) {
    const role = String(member.role || "").toLowerCase()
    return role === "child"
}

function groupTasks(tasks) {
    const groups = {
        overdue: [],
        today: [],
        thisWeek: [],
        later: [],
        completed: []
    }

    tasks.forEach(task => {
        if (task.status === "complete") {
            groups.completed.push(task)
            return
        }

        const daysUntil = getDaysUntil(task.due_date)

        if (daysUntil !== null && daysUntil < 0) {
            groups.overdue.push(task)
            return
        }

        if (daysUntil === 0) {
            groups.today.push(task)
            return
        }

        if (task.due_date && isDateInCurrentWeek(task.due_date)) {
            groups.thisWeek.push(task)
            return
        }

        groups.later.push(task)
    })

    return groups
}

function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
        if (!a.due_date && !b.due_date) return a.title.localeCompare(b.title)
        if (!a.due_date) return 1
        if (!b.due_date) return -1

        const dateDiff = createLocalDate(a.due_date) - createLocalDate(b.due_date)
        if (dateDiff !== 0) return dateDiff

        return a.title.localeCompare(b.title)
    })
}

function TaskDestinationCard({ to, icon, title, description }) {
    return (
        <Link className="task-destination-card" to={to}>
            <span>{icon}</span>

            <div>
                <strong>{title}</strong>
                <p>{description}</p>
            </div>
        </Link>
    )
}

function getOwnershipBadge(task) {
    if (task.visibility === "private") {
        return {
            label: "Private",
            icon: "🔒"
        }
    }

    if (task.family_members?.name) {
        return {
            label: task.family_members.name,
            icon: task.family_members.avatar_emoji || "👤"
        }
    }

    return {
        label: "Family",
        icon: "🏠"
    }
}

function TaskRow({ task, familyMembers, onComplete, onEdit, onDelete }) {
    const isComplete = task.status === "complete"
    const meta = getTaskMeta(task, familyMembers)

    const ownership = getOwnershipBadge(task)

    return (
        <div className={`task-command-row ${isComplete ? "task-command-row-complete" : ""}`}>
            <button
                className="task-check-button"
                type="button"
                onClick={() => !isComplete && onComplete(task)}
                disabled={isComplete}
                aria-label={isComplete ? "To-Do complete" : "Complete To-Do"}
            >
                {isComplete ? "✓" : ""}
            </button>

            <div className="task-command-main">
                <div className="task-title-line">
                    <span className="task-owner-badge">
                        {ownership.icon} {ownership.label}
                    </span>

                    <strong>{task.title}</strong>
                </div>
                {meta && <p>{meta}</p>}
                {task.description && <small>{task.description}</small>}
            </div>

            <div className="task-command-actions">
                <button className="secondary-button" type="button" onClick={() => onEdit(task)}>
                    Edit
                </button>

                <button className="danger-button" type="button" onClick={() => onDelete(task)}>
                    Delete
                </button>
            </div>
        </div>
    )
}

function TaskSection({
    title,
    subtitle,
    tasks,
    familyMembers,
    emptyText,
    onComplete,
    onEdit,
    onDelete,
    className = ""
}) {
    return (
        <section className={`task-command-section ${className}`}>
            <div className="task-section-header">
                <div>
                    <h3>{title}</h3>
                    {subtitle && <p>{subtitle}</p>}
                </div>

                <span>{tasks.length}</span>
            </div>

            {tasks.length === 0 ? (
                <p className="dashboard-empty">{emptyText}</p>
            ) : (
                <div className="task-command-list">
                    {tasks.map(task => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            familyMembers={familyMembers}
                            onComplete={onComplete}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

export default function Tasks() {
    const { preferences, refreshPreferences } = usePreferences()
    const [searchParams] = useSearchParams()
    const tripId = searchParams.get("tripId")
    const dueDateParam = searchParams.get("dueDate")

    const [tasks, setTasks] = useState([])
    const [familyMembers, setFamilyMembers] = useState([])
    const [activities, setActivities] = useState([])
    const [currentUserId, setCurrentUserId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [showCompleted, setShowCompleted] = useState(false)
    const [taskScope, setTaskScope] = useState("mine_family")

    const currentMember = familyMembers.find(member => member.user_id === currentUserId)
    const childMemberIds = familyMembers.filter(isChildMember).map(member => member.id)

    const visibleTasks = useMemo(() => {
        const tripTasks = tripId
            ? tasks.filter(task => task.trip_id === tripId)
            : tasks

        if (tripId) return tripTasks

        return filterTasksByScope(
            tripTasks,
            taskScope,
            currentMember?.id,
            childMemberIds
        )
    }, [tasks, tripId, taskScope, currentMember?.id, childMemberIds])

    const selectedTrip = visibleTasks.find(task => task.trips)?.trips
    const groupedTasks = groupTasks(sortTasks(visibleTasks))

    const openCount =
        groupedTasks.overdue.length +
        groupedTasks.today.length +
        groupedTasks.thisWeek.length +
        groupedTasks.later.length

    async function loadData() {
        try {
            const {
                data: { user },
                error
            } = await supabase.auth.getUser()

            if (error) throw error

            const [taskData, memberData, activityData] = await Promise.all([
                getTasks(),
                getFamilyMembers(),
                getActivities()
            ])

            setCurrentUserId(user?.id || null)
            setTasks(taskData)
            setFamilyMembers(memberData)
            setActivities(activityData)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()

        if (dueDateParam) {
            setForm({
                ...initialForm,
                due_date: dueDateParam,
                trip_id: tripId || ""
            })
            setEditingId(null)
            setShowForm(true)
        }
    }, [dueDateParam, tripId])

    useEffect(() => {
        if (preferences?.task_default_view && !tripId) {
            setTaskScope(preferences.task_default_view)
        }
    }, [preferences?.task_default_view, tripId])

    function updateForm(field, value) {
        setForm(current => ({
            ...current,
            [field]: value
        }))
    }

    function resetForm() {
        setForm({
            ...initialForm,
            trip_id: tripId || ""
        })
        setEditingId(null)
        setShowForm(false)
    }

    function startEdit(task) {
        setEditingId(task.id)
        setForm(normalizeTask(task))
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    async function handleTaskScopeChange(scope) {
        setTaskScope(scope)

        try {
            await updatePreferences({
                task_default_view: scope
            })

            await refreshPreferences?.()
        } catch (error) {
            console.error(error)
        }
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)

        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            due_date: form.due_date || null,
            status: form.status || "open",
            family_member_id: form.family_member_id || null,
            activity_id: form.activity_id || null,
            trip_id: form.trip_id || tripId || null,
            visibility: form.visibility || "household"
        }

        try {
            if (editingId) {
                await updateTask(editingId, payload)
            } else {
                await createTask(payload)
            }

            resetForm()
            await loadData()
        } catch (error) {
            console.error(error)
            alert(error.message || "Task save failed.")
        } finally {
            setSaving(false)
        }
    }

    async function handleComplete(task) {
        try {
            await completeTask(task)
            await loadData()
        } catch (error) {
            console.error(error)
        }
    }

    async function handleDelete(task) {
        const confirmed = window.confirm(
            `Delete "${task.title}"? This cannot be undone.`
        )

        if (!confirmed) return

        try {
            await deleteTask(task.id)
            await loadData()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="tasks-command-page">
            <header className="calendar-header tasks-command-header">
                <div>
                    <p className="dashboard-household-name">
                        {tripId ? "Trip Checklist" : "To-Do's"}
                    </p>

                    <h2>
                        {tripId
                            ? selectedTrip?.name || "Trip Checklist"
                            : "Family To-Do's"}
                    </h2>

                    <p className="tasks-header-counts">
                        {groupedTasks.overdue.length} Overdue •{" "}
                        {groupedTasks.today.length} Today •{" "}
                        {openCount} Open
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                        if (showForm) {
                            resetForm()
                            return
                        }

                        setForm({
                            ...initialForm,
                            trip_id: tripId || ""
                        })
                        setEditingId(null)
                        setShowForm(true)
                    }}
                >
                    {showForm ? "Cancel" : "+ Add To-Do"}
                </button>
            </header>

            {!tripId && (
                <section className="task-scope-filter card">
                    <div>
                        <strong>Showing</strong>
                        <p>Choose which To-Do's you want to focus on.</p>
                    </div>

                    <div className="task-scope-buttons">
                        {taskScopes.map(scope => (
                            <button
                                key={scope.key}
                                type="button"
                                className={taskScope === scope.key ? "active" : ""}
                                onClick={() => handleTaskScopeChange(scope.key)}
                            >
                                {scope.label}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {!tripId && (
                <section className="task-destinations">
                    <TaskDestinationCard
                        to="/routines"
                        icon="🔁"
                        title="Routines"
                        description="Recurring household responsibilities."
                    />

                    <TaskDestinationCard
                        to="/reminders"
                        icon="🔔"
                        title="Reminders"
                        description="Important one-time reminders."
                    />
                </section>
            )}

            {showForm && (
                <section className="card form-card">
                    <h3>{editingId ? "Edit Task" : "Add Task"}</h3>

                    <form className="form-grid" onSubmit={handleSubmit}>
                        <label>
                            Title
                            <input
                                value={form.title}
                                onChange={event => updateForm("title", event.target.value)}
                                placeholder="Register for basketball"
                                required
                            />
                        </label>

                        <label>
                            Due Date
                            <input
                                type="date"
                                value={form.due_date}
                                onChange={event => updateForm("due_date", event.target.value)}
                            />
                        </label>

                        <label>
                            Family Member
                            <select
                                value={form.family_member_id}
                                onChange={event =>
                                    updateForm("family_member_id", event.target.value)
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
                                value={form.activity_id}
                                onChange={event =>
                                    updateForm("activity_id", event.target.value)
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
                            Status
                            <select
                                value={form.status}
                                onChange={event => updateForm("status", event.target.value)}
                            >
                                <option value="open">Open</option>
                                <option value="complete">Complete</option>
                            </select>
                        </label>

                        <label>
                            Visibility
                            <select
                                value={form.visibility}
                                onChange={event => updateForm("visibility", event.target.value)}
                            >
                                <option value="household">Family task</option>
                                <option value="private">Private task</option>
                            </select>
                        </label>

                        <label className="full-width">
                            Description
                            <textarea
                                value={form.description}
                                onChange={event =>
                                    updateForm("description", event.target.value)
                                }
                                rows="3"
                            />
                        </label>

                        <button className="primary-button full-width" type="submit" disabled={saving}>
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Save Changes"
                                    : "Save Task"}
                        </button>
                    </form>
                </section>
            )}

            <section className="card task-command-card">
                {loading ? (
                    <p>Loading tasks...</p>
                ) : visibleTasks.length === 0 ? (
                    <p className="dashboard-empty">
                        {tripId
                            ? "No checklist tasks for this trip yet."
                            : "No tasks match this view."}
                    </p>
                ) : (
                    <>
                        <TaskSection
                            title="Overdue"
                            subtitle="Needs attention first."
                            tasks={groupedTasks.overdue}
                            familyMembers={familyMembers}
                            emptyText="No overdue tasks."
                            onComplete={handleComplete}
                            onEdit={startEdit}
                            onDelete={handleDelete}
                        />

                        <TaskSection
                            title="Today"
                            subtitle="Due today."
                            tasks={groupedTasks.today}
                            familyMembers={familyMembers}
                            emptyText="Nothing due today."
                            onComplete={handleComplete}
                            onEdit={startEdit}
                            onDelete={handleDelete}
                            className="task-section-today"
                        />

                        <TaskSection
                            title="This Week"
                            subtitle="Due before the end of this calendar week."
                            tasks={groupedTasks.thisWeek}
                            familyMembers={familyMembers}
                            emptyText="Nothing else due this week."
                            onComplete={handleComplete}
                            onEdit={startEdit}
                            onDelete={handleDelete}
                        />

                        <TaskSection
                            title="Later"
                            subtitle="Upcoming or unscheduled."
                            tasks={groupedTasks.later}
                            familyMembers={familyMembers}
                            emptyText="No later tasks."
                            onComplete={handleComplete}
                            onEdit={startEdit}
                            onDelete={handleDelete}
                        />

                        {groupedTasks.completed.length > 0 && (
                            <section className="task-command-section">
                                <button
                                    className="completed-toggle"
                                    type="button"
                                    onClick={() => setShowCompleted(current => !current)}
                                >
                                    <span>
                                        {showCompleted ? "Hide" : "Show"} Completed
                                    </span>

                                    <strong>{groupedTasks.completed.length}</strong>
                                </button>

                                {showCompleted && (
                                    <TaskSection
                                        title="Completed"
                                        subtitle="Recently completed."
                                        tasks={groupedTasks.completed}
                                        familyMembers={familyMembers}
                                        emptyText="No completed tasks."
                                        onComplete={handleComplete}
                                        onEdit={startEdit}
                                        onDelete={handleDelete}
                                    />
                                )}
                            </section>
                        )}
                    </>
                )}
            </section>
        </div>
    )
}