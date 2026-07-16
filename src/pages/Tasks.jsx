import ListRow from "../components/ui/ListRow"
import StatusBadge from "../components/ui/StatusBadge"
import EmptyState from "../components/ui/EmptyState"

import AppPage from "../components/ui/AppPage"
import PageHeader from "../components/ui/PageHeader"
import Button from "../components/ui/Button"

import TextField from "../components/ui/TextField"
import TextAreaField from "../components/ui/TextAreaField"
import SelectField from "../components/ui/SelectField"
import FormSection from "../components/ui/FormSection"

import BottomSheet from "../components/ui/BottomSheet"
import SectionCard from "../components/ui/SectionCard"

import Avatar from "../components/ui/Avatar"

import {
    CalendarDays,
    CheckCircle2,
    Lock
} from "lucide-react"

import { useEffect, useMemo, useState } from "react"
import {
    Link,
    useSearchParams,
    useLocation,
    useNavigate
} from "react-router-dom"

import { supabase } from "../lib/supabase"

import {
    completeTask,
    createTask,
    deleteTask,
    getTasks,
    updateTask
} from "../services/taskService"

import { getFamilyMembers } from "../services/familyService"

import usePreferences from "../hooks/usePreferences"
import { updatePreferences } from "../services/preferenceService"

import { filterTasksByScope } from "../utils/taskFilters"

import ActionMenu from "../components/ui/ActionMenu"

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

function TaskSection({
    title,
    subtitle,
    tasks,
    familyMembers,
    emptyText,
    onComplete,
    onEdit,
    onDelete,
    highlightedTaskId,
    taskMenuOpen,
    setTaskMenuOpen,
    hideWhenEmpty = false
}) {
    if (hideWhenEmpty && tasks.length === 0) return null

    return (
        <section className="eg-card">
            <div className="eg-row-between">
                <div>
                    <h2 className="eg-section-title">{title}</h2>
                    {subtitle && <p className="eg-task-section-subtitle">{subtitle}</p>}
                </div>

                <StatusBadge tone={tasks.length > 0 ? "primary" : "neutral"}>
                    {tasks.length}
                </StatusBadge>
            </div>

            {tasks.length === 0 ? (
                <EmptyState
                    title={emptyText}
                    message="You're clear here."
                />
            ) : (
                <div className="eg-task-list">
                    {tasks.map(task => (
                        <TaskListRow
                            key={task.id}
                            task={task}
                            familyMembers={familyMembers}
                            onComplete={onComplete}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            highlighted={task.id === highlightedTaskId}
                            taskMenuOpen={taskMenuOpen}
                            setTaskMenuOpen={setTaskMenuOpen}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

function TaskListRow({
    task,
    familyMembers,
    onComplete,
    onEdit,
    onDelete,
    highlighted,
    taskMenuOpen,
    setTaskMenuOpen
}) {
    const isComplete = task.status === "complete"
    const meta = getTaskMeta(task, familyMembers)
    const ownership = getOwnershipBadge(task)

    return (
        <ListRow
            completed={isComplete}
            title={task.title}
            subtitle={task.description}
            meta={meta}
            icon={
                <button
                    type="button"
                    className={`eg-task-check ${isComplete ? "complete" : ""}`}
                    onClick={(event) => {
                        event.stopPropagation()
                        if (!isComplete) onComplete(task)
                    }}
                    disabled={isComplete}
                    aria-label={isComplete ? "To-Do complete" : "Complete To-Do"}
                >
                    {isComplete && <CheckCircle2 size={18} />}
                </button>
            }
            action={
                <div className="eg-task-actions">
                    {task.visibility === "private" ? (
                        <StatusBadge tone="warning">
                            <Lock size={12} /> Private
                        </StatusBadge>
                    ) : (
                        <div className="eg-task-owner">
                            <Avatar
                                member={task.family_members}
                                name={ownership.label}
                                emoji={ownership.icon}
                                size="xs"
                            />

                            <span>{ownership.label}</span>
                        </div>
                    )}

                    <button
                        type="button"
                        className="eg-text-button"
                        onClick={() => onEdit(task)}
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        className="eg-text-button danger"
                        onClick={() => onDelete(task)}
                    >
                        Delete
                    </button>
                </div>
            }
        />
    )
}

export default function Tasks() {
    const { preferences, refreshPreferences } = usePreferences()
    const [searchParams] = useSearchParams()

    const location = useLocation()
    const navigate = useNavigate()

    const tripId = searchParams.get("tripId")
    const dueDateParam = searchParams.get("dueDate")

    const [tasks, setTasks] = useState([])
    const [familyMembers, setFamilyMembers] = useState([])
    const [currentUserId, setCurrentUserId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [showCompleted, setShowCompleted] = useState(false)
    const [taskScope, setTaskScope] = useState("mine_family")

    const [highlightedTaskId, setHighlightedTaskId] = useState(null)
    const [taskMenuOpen, setTaskMenuOpen] = useState(null)

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
            currentUserId,
            childMemberIds
        )
    }, [tasks, tripId, taskScope, currentMember?.id, currentUserId, childMemberIds])

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

            const [taskData, memberData] = await Promise.all([
                getTasks(),
                getFamilyMembers()
            ])

            setCurrentUserId(user?.id || null)
            setTasks(taskData)
            setFamilyMembers(memberData)
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
        const taskId = location.state?.taskId

        if (!taskId || tasks.length === 0) return

        const task = tasks.find(
            item => item.id === taskId
        )

        if (!task) return

        if (location.state?.mode === "view") {
            setShowCompleted(true)
        } else {
            startEdit(task)
        }

        setHighlightedTaskId(task.id)

        setTimeout(() => {
            setHighlightedTaskId(null)
        }, 2500)

        navigate(location.pathname, {
            replace: true,
            state: {}
        })
    }, [location.state, tasks, navigate])

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

    function openNewTaskForm() {
        setForm({
            ...initialForm,
            trip_id: tripId || ""
        })
        setEditingId(null)
        setShowForm(true)
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
        const previousTasks = tasks

        setTasks(current =>
            current.map(item =>
                item.id === task.id
                    ? {
                        ...item,
                        status: "complete",
                        completed_at: new Date().toISOString()
                    }
                    : item
            )
        )

        try {
            await completeTask(task)
        } catch (error) {
            console.error(error)
            setTasks(previousTasks)
            alert(error.message || "Could not complete to-do.")
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
        <AppPage>
            <PageHeader
                eyebrow={tripId ? "Trip" : "Family"}
                title={tripId ? "Trip Checklist" : "To-Dos"}
                subtitle={`${groupedTasks.overdue.length} overdue • ${groupedTasks.today.length} today • ${openCount} open`}
                action={
                    <Button
                        onClick={() => {
                            if (showForm) {
                                resetForm()
                            } else {
                                openNewTaskForm()
                            }
                        }}
                    >
                        {showForm ? "Cancel" : "+ Add"}
                    </Button>
                }
            />

            <div className="eg-stack">
                {!tripId && (
                    <div className="eg-filter-chips">
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
                )}

                {!tripId && (
                    <SectionCard>
                        <Link className="eg-routines-link-row" to="/routines">
                            <span className="eg-routines-link-icon">🔁</span>

                            <div>
                                <strong>Routines</strong>
                                <p>Manage recurring household tasks.</p>
                            </div>
                        </Link>
                    </SectionCard>
                )}

                <BottomSheet open={showForm} onClose={resetForm}>
                    <SectionCard title={editingId ? "Edit To-Do" : "Add To-Do"}>
                        <form onSubmit={handleSubmit}>
                            <FormSection>
                                <TextField
                                    label="Title"
                                    value={form.title}
                                    onChange={value => updateForm("title", value)}
                                    placeholder="Register for basketball"
                                    required
                                />

                                <TextField
                                    label="Due Date"
                                    type="date"
                                    value={form.due_date}
                                    onChange={value => updateForm("due_date", value)}
                                />

                                <SelectField
                                    label="Family Member"
                                    value={form.family_member_id}
                                    onChange={value => updateForm("family_member_id", value)}
                                    options={[
                                        { value: "", label: "No family member selected" },
                                        ...familyMembers.map(member => ({
                                            value: member.id,
                                            label: `${member.avatar_emoji ? `${member.avatar_emoji} ` : ""}${member.name}`
                                        }))
                                    ]}
                                />

                                {editingId && (
                                    <SelectField
                                        label="Status"
                                        value={form.status}
                                        onChange={value => updateForm("status", value)}
                                        options={[
                                            { value: "open", label: "Open" },
                                            { value: "complete", label: "Complete" }
                                        ]}
                                    />
                                )}

                                <SelectField
                                    label="Visibility"
                                    value={form.visibility}
                                    onChange={value => updateForm("visibility", value)}
                                    options={[
                                        { value: "household", label: "Family task" },
                                        { value: "private", label: "Private task" }
                                    ]}
                                />

                                <TextAreaField
                                    label="Description"
                                    value={form.description}
                                    onChange={value => updateForm("description", value)}
                                    rows={3}
                                />

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Save Changes"
                                            : "Save To-Do"}
                                </Button>
                            </FormSection>
                        </form>
                    </SectionCard>
                </BottomSheet>

                <section className="task-command-card">
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
                                highlightedTaskId={highlightedTaskId}
                                taskMenuOpen={taskMenuOpen}
                                setTaskMenuOpen={setTaskMenuOpen}
                                hideWhenEmpty
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
                                highlightedTaskId={highlightedTaskId}
                                taskMenuOpen={taskMenuOpen}
                                setTaskMenuOpen={setTaskMenuOpen}
                                className="task-section-today"
                                hideWhenEmpty
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
                                highlightedTaskId={highlightedTaskId}
                                taskMenuOpen={taskMenuOpen}
                                setTaskMenuOpen={setTaskMenuOpen}
                                hideWhenEmpty
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
                                highlightedTaskId={highlightedTaskId}
                                taskMenuOpen={taskMenuOpen}
                                setTaskMenuOpen={setTaskMenuOpen}
                                hideWhenEmpty
                            />

                            {openCount === 0 && (
                                <p className="dashboard-empty">
                                    No open To-Do's in this view.
                                </p>
                            )}

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
                                            highlightedTaskId={highlightedTaskId}
                                            taskMenuOpen={taskMenuOpen}
                                            setTaskMenuOpen={setTaskMenuOpen}
                                        />
                                    )}
                                </section>
                            )}
                        </>
                    )}
                </section>
            </div>
        </AppPage>
    )
}