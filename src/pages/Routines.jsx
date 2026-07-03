import { useEffect, useMemo, useState } from "react"
import {
    completeRoutine,
    createRoutine,
    deleteRoutine,
    getRoutines,
    updateRoutine
} from "../services/routineService"
import { getFamilyMembers } from "../services/familyService"

import ActionMenu from "../components/ui/ActionMenu"
import AppPage from "../components/ui/AppPage"
import PageHeader from "../components/ui/PageHeader"
import SectionCard from "../components/ui/SectionCard"
import Button from "../components/ui/Button"
import InsightCard from "../components/dashboard/InsightCard"

const initialForm = {
    title: "",
    description: "",
    category: "general",
    frequency: "weekly",
    next_due: "",
    family_member_id: "",
    create_task: true,
    active: true,
    schedule_basis: "completion_date"
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
        active: routine.active ?? true,
        schedule_basis: routine.schedule_basis || "completion_date"
    }
}

function formatFrequency(value) {
    const labels = {
        daily: "daily",
        every_2_days: "every 2 days",
        weekly: "weekly",
        every_2_weeks: "every 2 weeks",
        monthly: "monthly"
    }

    return labels[value] || value || "routine"
}

function formatDate(dateString) {
    if (!dateString) return "No date"

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

function AutomationStat({ label, value }) {
    return (
        <div className="automation-stat">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    )
}

function RoutineSection({
    title,
    subtitle,
    routines,
    emptyText,
    renderRoutineRow,
    routineMenuOpen,
    setRoutineMenuOpen
}) {
    return (
        <SectionCard title={title} subtitle={subtitle} count={routines.length}>
            {routines.length === 0 ? (
                <p className="dashboard-empty">{emptyText}</p>
            ) : (
                <div className="eg-stack">
                    {routines.map(routine =>
                        renderRoutineRow(
                            routine,
                            routineMenuOpen,
                            setRoutineMenuOpen
                        )
                    )}
                </div>
            )}
        </SectionCard>
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
    const [routineMenuOpen, setRoutineMenuOpen] = useState(null)

    const groupedRoutines = useMemo(() => {
        return groupRoutines(sortRoutines(routines))
    }, [routines])

    const runningCount =
        groupedRoutines.dueNow.length +
        groupedRoutines.thisWeek.length +
        groupedRoutines.later.length

    const pausedCount = groupedRoutines.paused.length

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
                const updated = await updateRoutine(editingId, payload)

                setRoutines(current =>
                    current.map(routine =>
                        routine.id === updated.id ? updated : routine
                    )
                )
            } else {
                const created = await createRoutine(payload)

                setRoutines(current => [created, ...current])
            }

            resetForm()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not save automation.")
        } finally {
            setSaving(false)
        }
    }

    async function handleComplete(routine) {
        const previousRoutines = routines

        setRoutines(current =>
            current.map(item =>
                item.id === routine.id
                    ? {
                        ...item,
                        last_completed: new Date().toISOString().slice(0, 10)
                    }
                    : item
            )
        )

        try {
            const updatedRoutine = await completeRoutine(routine)

            setRoutines(current =>
                current.map(item =>
                    item.id === updatedRoutine.id ? updatedRoutine : item
                )
            )
        } catch (error) {
            console.error(error)
            setRoutines(previousRoutines)
            alert(error.message || "Could not complete automation.")
        }
    }

    async function handlePauseRoutine(routine) {
        const previousRoutines = routines

        setRoutines(current =>
            current.map(item =>
                item.id === routine.id
                    ? { ...item, active: false }
                    : item
            )
        )

        try {
            await updateRoutine(routine.id, { active: false })
        } catch (error) {
            console.error(error)
            setRoutines(previousRoutines)
            alert(error.message || "Could not pause automation.")
        }
    }

    async function handleResumeRoutine(routine) {
        const previousRoutines = routines

        setRoutines(current =>
            current.map(item =>
                item.id === routine.id
                    ? { ...item, active: true }
                    : item
            )
        )

        try {
            await updateRoutine(routine.id, { active: true })
        } catch (error) {
            console.error(error)
            setRoutines(previousRoutines)
            alert(error.message || "Could not resume automation.")
        }
    }

    async function handleDelete(routine) {
        const confirmed = window.confirm(
            `Delete "${routine.title}"? This cannot be undone.`
        )

        if (!confirmed) return

        const previousRoutines = routines

        setRoutines(current =>
            current.filter(item => item.id !== routine.id)
        )

        try {
            await deleteRoutine(routine.id)
        } catch (error) {
            console.error(error)
            setRoutines(previousRoutines)
            alert(error.message || "Could not delete automation.")
        }
    }

    function renderRoutineRow(routine, routineMenuOpen, setRoutineMenuOpen) {
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
                        Automatically creates a To-Do {formatFrequency(routine.frequency)}
                    </p>

                    <div className="automation-details-grid">
                        <div>
                            <span>Next To-Do</span>
                            <strong>
                                {isPaused
                                    ? "Paused"
                                    : routine.next_due
                                        ? formatDate(routine.next_due)
                                        : "Not scheduled"}
                            </strong>
                        </div>

                        <div>
                            <span>Assigned To</span>
                            <strong>{member?.name || "Household"}</strong>
                        </div>

                        <div>
                            <span>Schedule</span>
                            <strong>
                                {routine.schedule_basis === "due_date"
                                    ? "Fixed schedule"
                                    : "Completion-based"}
                            </strong>
                        </div>
                    </div>

                    {routine.last_completed && (
                        <small>
                            Last completed {formatDate(routine.last_completed)}
                        </small>
                    )}

                    {routine.description && <small>{routine.description}</small>}
                </div>

                <div className="routine-command-status">
                    <span
                        className={`status-pill ${isPaused ? "status-muted" : "status-success"}`}
                    >
                        {isPaused ? "⏸ Paused" : "🟢 Running"}
                    </span>
                </div>

                <div className="routine-command-actions">
                    <ActionMenu
                        title={routine.title}
                        open={routineMenuOpen === routine.id}
                        onOpenChange={isOpen =>
                            setRoutineMenuOpen(isOpen ? routine.id : null)
                        }
                        ariaLabel="Open automation actions"
                        actions={[
                            {
                                label: "Edit",
                                onClick: () => startEdit(routine)
                            },
                            ...(!isPaused
                                ? [
                                    {
                                        label: "Complete Early",
                                        onClick: () => handleComplete(routine)
                                    },
                                    {
                                        label: "Pause Automation",
                                        onClick: () => handlePauseRoutine(routine)
                                    }
                                ]
                                : [
                                    {
                                        label: "Resume Automation",
                                        onClick: () => handleResumeRoutine(routine)
                                    }
                                ]),
                            {
                                label: "Delete",
                                danger: true,
                                onClick: () => handleDelete(routine)
                            }
                        ]}
                    />
                </div>
            </div>
        )
    }

    return (
        <AppPage>
            <PageHeader
                eyebrow="Automations"
                title="Automations"
                subtitle="Let Evergrove automatically create recurring To-Dos for your household."
                action={
                    <Button
                        onClick={() => {
                            if (showForm) {
                                resetForm()
                            } else {
                                setShowForm(true)
                            }
                        }}
                    >
                        {showForm ? "Cancel" : "+ New Automation"}
                    </Button>
                }
            />

            <div className="eg-stack">
                <InsightCard
                    insight={{
                        title:
                            groupedRoutines.dueNow.length > 0
                                ? `${groupedRoutines.dueNow[0]?.title} is ready to create work.`
                                : groupedRoutines.thisWeek.length > 0
                                    ? `${groupedRoutines.thisWeek[0]?.title} has a To-Do coming up.`
                                    : "Your automations are running smoothly.",

                        description:
                            groupedRoutines.dueNow.length > 0
                                ? "Evergrove will help turn this routine into actionable work."
                                : groupedRoutines.thisWeek.length > 0
                                    ? "Recurring work is scheduled and ready."
                                    : "No automation needs attention right now.",

                        actionLabel:
                            groupedRoutines.dueNow.length > 0
                                ? "Complete Early"
                                : "New Automation"
                    }}
                    onAction={() => {
                        if (groupedRoutines.dueNow.length > 0 && groupedRoutines.dueNow[0]) {
                            handleComplete(groupedRoutines.dueNow[0])
                        } else {
                            setShowForm(true)
                        }
                    }}
                />

                <SectionCard
                    title="Automation Summary"
                    subtitle="A quick view of what Evergrove is managing for your household."
                >
                    <div className="automation-stat-grid">
                        <AutomationStat label="Total" value={routines.length} />
                        <AutomationStat label="Running" value={runningCount} />
                        <AutomationStat label="Paused" value={pausedCount} />
                    </div>
                </SectionCard>

                {showForm && (
                    <SectionCard
                        title={editingId ? "Edit Household Routine" : "New Household Routine"}
                        subtitle="Create an automation that automatically generates recurring To-Dos."
                    >
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
                                Schedule Based On
                                <select
                                    value={form.schedule_basis}
                                    onChange={event => updateForm("schedule_basis", event.target.value)}
                                >
                                    <option value="completion_date">When completed</option>
                                    <option value="due_date">Original due date</option>
                                </select>
                            </label>

                            <label>
                                Next To-Do
                                <input
                                    type="date"
                                    value={form.next_due}
                                    onChange={event => updateForm("next_due", event.target.value)}
                                />
                            </label>

                            <label>
                                Assigned To
                                <select
                                    value={form.family_member_id}
                                    onChange={event =>
                                        updateForm("family_member_id", event.target.value)
                                    }
                                >
                                    <option value="">Household</option>

                                    {familyMembers.map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.avatar_emoji ? `${member.avatar_emoji} ` : ""}
                                            {member.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Status
                                <select
                                    value={form.active ? "true" : "false"}
                                    onChange={event =>
                                        updateForm("active", event.target.value === "true")
                                    }
                                >
                                    <option value="true">Running</option>
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

                            <Button
                                className="full-width"
                                type="submit"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Save Changes"
                                        : "Save Automation"}
                            </Button>
                        </form>
                    </SectionCard>
                )}

                <SectionCard
                    title="Household Routines"
                    subtitle={`${runningCount} running • ${pausedCount} paused`}
                >
                    {loading ? (
                        <p>Loading automations...</p>
                    ) : routines.length === 0 ? (
                        <p className="dashboard-empty">
                            No automations yet. Create an automation and Evergrove will automatically generate recurring To-Dos for you.
                        </p>
                    ) : (
                        <div className="eg-stack">
                            <RoutineSection
                                title="Due Now"
                                subtitle="Ready to generate or advance work."
                                routines={groupedRoutines.dueNow}
                                emptyText="No automations due now."
                                renderRoutineRow={renderRoutineRow}
                                routineMenuOpen={routineMenuOpen}
                                setRoutineMenuOpen={setRoutineMenuOpen}
                            />

                            <RoutineSection
                                title="This Week"
                                subtitle="Coming due in the next 7 days."
                                routines={groupedRoutines.thisWeek}
                                emptyText="No automations due this week."
                                renderRoutineRow={renderRoutineRow}
                                routineMenuOpen={routineMenuOpen}
                                setRoutineMenuOpen={setRoutineMenuOpen}
                            />

                            <RoutineSection
                                title="Later"
                                subtitle="Upcoming automations."
                                routines={groupedRoutines.later}
                                emptyText="No later automations."
                                renderRoutineRow={renderRoutineRow}
                                routineMenuOpen={routineMenuOpen}
                                setRoutineMenuOpen={setRoutineMenuOpen}
                            />

                            {groupedRoutines.paused.length > 0 && (
                                <RoutineSection
                                    title="Paused"
                                    subtitle="Stopped until resumed."
                                    routines={groupedRoutines.paused}
                                    emptyText="No paused automations."
                                    renderRoutineRow={renderRoutineRow}
                                    routineMenuOpen={routineMenuOpen}
                                    setRoutineMenuOpen={setRoutineMenuOpen}
                                />
                            )}
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    title="Coming Soon"
                    subtitle="These automation types are already on the roadmap."
                >
                    <div className="automation-coming-soon-grid">
                        <span>☀ Weather-based reminders</span>
                        <span>🎂 Birthday reminders</span>
                        <span>🧳 Trip preparation</span>
                        <span>🛒 Shopping automations</span>
                        <span>🤖 AI Assistant automations</span>
                    </div>
                </SectionCard>
            </div>
        </AppPage>
    )
}