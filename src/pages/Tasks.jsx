import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import {
    completeTask,
    createTask,
    deleteTask,
    getTasks,
    updateTask
} from "../services/taskService"

import { getActivities } from "../services/activityService"
import { getFamilyMembers } from "../services/familyService"

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

export default function Tasks() {
    const [searchParams] = useSearchParams()
    const tripId = searchParams.get("tripId")

    const [tasks, setTasks] = useState([])
    const [familyMembers, setFamilyMembers] = useState([])
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState(null)

    const visibleTasks = tripId
        ? tasks.filter(task => task.trip_id === tripId)
        : tasks

    const selectedTrip = visibleTasks.find(task => task.trips)?.trips

    async function loadData() {
        try {
            const [taskData, memberData, activityData] = await Promise.all([
                getTasks(),
                getFamilyMembers(),
                getActivities()
            ])

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
    }, [])

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
        <>
            <section className="hero-card">
                <div className="section-header">
                    <div>
                        <p className="eyebrow">
                            {tripId ? "Trip Checklist" : "Tasks"}
                        </p>

                        <h2>
                            {tripId
                                ? selectedTrip?.name || "Trip Checklist"
                                : "Family Tasks"}
                        </h2>

                        <p>
                            {tripId
                                ? "Manage the checklist for this trip."
                                : "Manage school forms, payments, registrations, errands, packing lists, and recurring family responsibilities."}
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
                        {showForm ? "Cancel" : "+ Add Task"}
                    </button>
                </div>
            </section>

            {showForm && (
                <section className="card form-card">
                    <h3>{editingId ? "Edit Task" : "Add Task"}</h3>

                    <form className="form-grid" onSubmit={handleSubmit}>
                        <label>
                            Title
                            <input
                                value={form.title}
                                onChange={event =>
                                    updateForm("title", event.target.value)
                                }
                                placeholder="Register for basketball"
                                required
                            />
                        </label>

                        <label>
                            Due Date
                            <input
                                type="date"
                                value={form.due_date}
                                onChange={event =>
                                    updateForm("due_date", event.target.value)
                                }
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
                                onChange={event =>
                                    updateForm("status", event.target.value)
                                }
                            >
                                <option value="open">Open</option>
                                <option value="complete">Complete</option>
                            </select>
                        </label>

                        <label>
                            Visibility
                            <select
                                value={form.visibility}
                                onChange={event =>
                                    updateForm("visibility", event.target.value)
                                }
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

                        <button
                            className="primary-button full-width"
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Save Changes"
                                    : "Save Task"}
                        </button>
                    </form>
                </section>
            )}

            <div className="grid">
                {loading ? (
                    <section className="card">
                        <p>Loading tasks...</p>
                    </section>
                ) : visibleTasks.length === 0 ? (
                    <section className="card">
                        <p>
                            {tripId
                                ? "No checklist tasks for this trip yet."
                                : "No tasks added yet."}
                        </p>
                    </section>
                ) : (
                    visibleTasks.map(task => {
                        const member = task.family_members
                        const creator = familyMembers.find(
                            familyMember => familyMember.user_id === task.user_id
                        )
                        const activity = task.activities
                        const trip = task.trips
                        const isComplete = task.status === "complete"
                        const isPrivate = task.visibility === "private"

                        return (
                            <section
                                className={`card ${isComplete ? "completed-card" : ""}`}
                                key={task.id}
                            >
                                <div className="member-header">
                                    <span className="avatar">
                                        {member?.avatar_emoji || "✅"}
                                    </span>

                                    <div>
                                        <h3>{task.title}</h3>

                                        <div className="task-badge-row">
                                            <span
                                                className={`status-pill ${isComplete
                                                    ? "status-success"
                                                    : "status-warning"
                                                    }`}
                                            >
                                                {isComplete ? "Complete" : "Open"}
                                            </span>

                                            {isPrivate && (
                                                <span className="status-pill">
                                                    🔒 Private
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {task.due_date && <p>Due: {task.due_date}</p>}
                                {member?.name && <p>For: {member.name}</p>}

                                {creator?.name && task.visibility === "household" && (
                                    <p>Created by: {creator.name}</p>
                                )}

                                {activity?.name && <p>Activity: {activity.name}</p>}
                                {trip?.name && <p>Trip: {trip.name}</p>}
                                {task.description && <p>{task.description}</p>}

                                <div className="card-actions">
                                    {!isComplete && (
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() => handleComplete(task)}
                                        >
                                            Complete
                                        </button>
                                    )}

                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => startEdit(task)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="danger-button"
                                        type="button"
                                        onClick={() => handleDelete(task)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </section>
                        )
                    })
                )}
            </div>
        </>
    )
}