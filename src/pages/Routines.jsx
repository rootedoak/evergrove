import { useEffect, useMemo, useState } from "react"
import {
    completeRoutine,
    createRoutine,
    createTaskFromRoutine,
    deleteRoutine,
    getRoutines,
    updateRoutine
} from "../services/routineService"
import { getFamilyMembers } from "../services/familyService"

const initialForm = {
    title: "",
    description: "",
    category: "general",
    frequency: "weekly",
    next_due: "",
    family_member_id: "",
    create_task: true,
    active: true
}

function normalizeRoutine(routine) {
    return {
        title: routine.title || "",
        description: routine.description || "",
        category: routine.category || "general",
        frequency: routine.frequency || "weekly",
        next_due: routine.next_due || "",
        family_member_id: routine.family_member_id || "",
        create_task: routine.create_task ?? true,
        active: routine.active ?? true
    }
}

function formatFrequency(value) {
    const labels = {
        daily: "Daily",
        every_2_days: "Every 2 days",
        weekly: "Weekly",
        every_2_weeks: "Every 2 weeks",
        monthly: "Monthly"
    }

    return labels[value] || value || "Routine"
}

function formatDate(dateString) {
    if (!dateString) return "No due date"

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

function createLocalDate(dateString) {
    if (!dateString) return null

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day)
}

function getTodayString() {
    const today = new Date()

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-")
}

function getDaysUntil(dateString) {
    if (!dateString) return null

    const today = createLocalDate(getTodayString())
    const target = createLocalDate(dateString)

    return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function sortRoutines(routines) {
    return [...routines].sort((a, b) => {
        if (!a.next_due && !b.next_due) return a.title.localeCompare(b.title)
        if (!a.next_due) return 1
        if (!b.next_due) return -1

        const dateDiff = createLocalDate(a.next_due) - createLocalDate(b.next_due)
        if (dateDiff !== 0) return dateDiff

        return a.title.localeCompare(b.title)
    })
}

function groupRoutines(routines) {
    const groups = {
        dueNow: [],
        thisWeek: [],
        later: [],
        paused: []
    }

    routines.forEach(routine => {
        if (routine.active === false) {
            groups.paused.push(routine)
            return
        }

        const daysUntil = getDaysUntil(routine.next_due)

        if (daysUntil !== null && daysUntil <= 0) {
            groups.dueNow.push(routine)
            return
        }

        if (daysUntil !== null && daysUntil <= 7) {
            groups.thisWeek.push(routine)
            return
        }

        groups.later.push(routine)
    })

    return groups
}

function RoutineSection({
    title,
    subtitle,
    routines,
    emptyText,
    renderRoutineRow
}) {
    return (
        <section className="routine-command-section">
            <div className="routine-section-header">
                <div>
                    <h3>{title}</h3>
                    {subtitle && <p>{subtitle}</p>}
                </div>

                <span>{routines.length}</span>
            </div>

            {routines.length === 0 ? (
                <p className="dashboard-empty">{emptyText}</p>
            ) : (
                <div className="routine-command-list">
                    {routines.map(routine => renderRoutineRow(routine))}
                </div>
            )}
        </section>
    )
}

export default function Routines() {
    const [routines, setRoutines] = useState([])
    const [familyMembers, setFamilyMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState(null)

    const groupedRoutines = useMemo(() => {
        return groupRoutines(sortRoutines(routines))
    }, [routines])

    const activeCount =
        groupedRoutines.dueNow.length +
        groupedRoutines.thisWeek.length +
        groupedRoutines.later.length

    async function loadData() {
        try {
            const [routineData, memberData] = await Promise.all([
                getRoutines(),
                getFamilyMembers()
            ])

            setRoutines(routineData)
            setFamilyMembers(memberData)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    function updateForm(field, value) {
        setForm(current => ({
            ...current,
            [field]: value
        }))
    }

    function resetForm() {
        setForm(initialForm)
        setEditingId(null)
        setShowForm(false)
    }

    function startEdit(routine) {
        setEditingId(routine.id)
        setForm(normalizeRoutine(routine))
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)

        const payload = {
            ...form,
            next_due: form.next_due || null,
            family_member_id: form.family_member_id || null
        }

        try {
            if (editingId) {
                await updateRoutine(editingId, payload)
            } else {
                await createRoutine(payload)
            }

            resetForm()
            await loadData()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not save routine.")
        } finally {
            setSaving(false)
        }
    }

    async function handleComplete(routine) {
        try {
            await completeRoutine(routine)
            await loadData()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not complete routine.")
        }
    }

    async function handleCreateTask(routine) {
        try {
            await createTaskFromRoutine(routine)
            await loadData()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not create task from routine.")
        }
    }

    async function handleDelete(routine) {
        const confirmed = window.confirm(
            `Delete "${routine.title}"? This cannot be undone.`
        )

        if (!confirmed) return

        try {
            await deleteRoutine(routine.id)
            await loadData()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not delete routine.")
        }
    }

    function renderRoutineRow(routine) {
        const member = routine.family_members
        const isPaused = routine.active === false

        return (
            <div
                className={`routine-command-row ${isPaused ? "routine-command-row-paused" : ""}`}
                key={routine.id}
            >
                <span className="routine-command-icon">
                    {member?.avatar_emoji || "🔁"}
                </span>

                <div className="routine-command-main">
                    <strong>{routine.title}</strong>

                    <p>
                        {formatFrequency(routine.frequency)}
                        {routine.next_due ? ` • Next due ${formatDate(routine.next_due)}` : ""}
                        {member?.name ? ` • ${member.name}` : ""}
                    </p>

                    <small>
                        {routine.category || "general"}
                        {routine.last_completed
                            ? ` • Last completed ${formatDate(routine.last_completed)}`
                            : ""}
                    </small>

                    {routine.description && <small>{routine.description}</small>}
                </div>

                <div className="routine-command-status">
                    <span
                        className={`status-pill ${isPaused ? "status-muted" : "status-success"}`}
                    >
                        {isPaused ? "Paused" : "Active"}
                    </span>
                </div>

                <div className="routine-command-actions">
                    {!isPaused && (
                        <>
                            <button
                                className="secondary-button"
                                type="button"
                                onClick={() => handleComplete(routine)}
                            >
                                Complete
                            </button>

                            <button
                                className="secondary-button"
                                type="button"
                                onClick={() => handleCreateTask(routine)}
                            >
                                Create Task
                            </button>
                        </>
                    )}

                    <button
                        className="secondary-button"
                        type="button"
                        onClick={() => startEdit(routine)}
                    >
                        Edit
                    </button>

                    <button
                        className="danger-button"
                        type="button"
                        onClick={() => handleDelete(routine)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="routines-command-page">
            <header className="calendar-header routines-command-header">
                <div>
                    <p className="dashboard-household-name">Routines</p>
                    <h2>Family Routines</h2>

                    <p className="routines-header-summary">
                        {activeCount} active • {groupedRoutines.dueNow.length} due now •{" "}
                        {groupedRoutines.paused.length} paused
                    </p>
                </div>

                <button
                    className="primary-button"
                    type="button"
                    onClick={() => {
                        if (showForm) resetForm()
                        else setShowForm(true)
                    }}
                >
                    {showForm ? "Cancel" : "+ Add Routine"}
                </button>
            </header>

            {showForm && (
                <section className="card form-card">
                    <h3>{editingId ? "Edit Routine" : "Add Routine"}</h3>

                    <form className="form-grid" onSubmit={handleSubmit}>
                        <label>
                            Title
                            <input
                                value={form.title}
                                onChange={event => updateForm("title", event.target.value)}
                                placeholder="Clean backpacks"
                                required
                            />
                        </label>

                        <label>
                            Category
                            <select
                                value={form.category}
                                onChange={event => updateForm("category", event.target.value)}
                            >
                                <option value="general">General</option>
                                <option value="school">School</option>
                                <option value="home">Home</option>
                                <option value="health">Health</option>
                                <option value="activity">Activity</option>
                                <option value="pet">Pet</option>
                                <option value="finance">Finance</option>
                            </select>
                        </label>

                        <label>
                            Frequency
                            <select
                                value={form.frequency}
                                onChange={event => updateForm("frequency", event.target.value)}
                            >
                                <option value="daily">Daily</option>
                                <option value="every_2_days">Every 2 Days</option>
                                <option value="weekly">Weekly</option>
                                <option value="every_2_weeks">Every 2 Weeks</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </label>

                        <label>
                            Next Due
                            <input
                                type="date"
                                value={form.next_due}
                                onChange={event => updateForm("next_due", event.target.value)}
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
                            Active
                            <select
                                value={form.active ? "true" : "false"}
                                onChange={event =>
                                    updateForm("active", event.target.value === "true")
                                }
                            >
                                <option value="true">Active</option>
                                <option value="false">Paused</option>
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

                        <button
                            className="primary-button full-width"
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Save Changes"
                                    : "Save Routine"}
                        </button>
                    </form>
                </section>
            )}

            <section className="card routines-command-card">
                {loading ? (
                    <p>Loading routines...</p>
                ) : routines.length === 0 ? (
                    <p className="dashboard-empty">No routines added yet.</p>
                ) : (
                    <>
                        <RoutineSection
                            title="Due Now"
                            subtitle="Needs attention first."
                            routines={groupedRoutines.dueNow}
                            emptyText="No routines due now."
                            renderRoutineRow={renderRoutineRow}
                        />

                        <RoutineSection
                            title="This Week"
                            subtitle="Coming due in the next 7 days."
                            routines={groupedRoutines.thisWeek}
                            emptyText="No routines due this week."
                            renderRoutineRow={renderRoutineRow}
                        />

                        <RoutineSection
                            title="Later"
                            subtitle="Upcoming routines."
                            routines={groupedRoutines.later}
                            emptyText="No later routines."
                            renderRoutineRow={renderRoutineRow}
                        />

                        {groupedRoutines.paused.length > 0 && (
                            <RoutineSection
                                title="Paused"
                                subtitle="Inactive routines."
                                routines={groupedRoutines.paused}
                                emptyText="No paused routines."
                                renderRoutineRow={renderRoutineRow}
                            />
                        )}
                    </>
                )}
            </section>
        </div>
    )
}