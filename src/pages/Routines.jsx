import { useEffect, useState } from "react"
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

export default function Routines() {
    const [routines, setRoutines] = useState([])
    const [familyMembers, setFamilyMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState(null)

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
        }
    }

    async function handleCreateTask(routine) {
        try {
            await createTaskFromRoutine(routine)
            await loadData()
        } catch (error) {
            console.error(error)
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
        }
    }

    return (
        <>
            <section className="hero-card">
                <div className="section-header">
                    <div>
                        <p className="eyebrow">Routines</p>
                        <h2>Family Routines</h2>
                        <p>
                            Manage recurring household, school, activity, and family
                            responsibilities that need to happen on a regular rhythm.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={() => {
                            if (showForm) resetForm()
                            else setShowForm(true)
                        }}
                    >
                        {showForm ? "Cancel" : "+ Add Routine"}
                    </button>
                </div>
            </section>

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

            <div className="grid">
                {loading ? (
                    <section className="card">
                        <p>Loading routines...</p>
                    </section>
                ) : routines.length === 0 ? (
                    <section className="card">
                        <p>No routines added yet.</p>
                    </section>
                ) : (
                    routines.map(routine => {
                        const member = routine.family_members
                        const isPaused = routine.active === false

                        return (
                            <section
                                className={`card ${isPaused ? "completed-card" : ""}`}
                                key={routine.id}
                            >
                                <div className="member-header">
                                    <span className="avatar">
                                        {member?.avatar_emoji || "🔁"}
                                    </span>

                                    <div>
                                        <h3>{routine.title}</h3>
                                        <span
                                            className={`status-pill ${isPaused
                                                    ? "status-muted"
                                                    : "status-success"
                                                }`}
                                        >
                                            {isPaused ? "Paused" : routine.frequency}
                                        </span>
                                    </div>
                                </div>

                                {routine.next_due && <p>Next due: {routine.next_due}</p>}
                                {routine.last_completed && (
                                    <p>Last completed: {routine.last_completed}</p>
                                )}
                                {member?.name && <p>For: {member.name}</p>}
                                {routine.category && <p>Category: {routine.category}</p>}
                                {routine.description && <p>{routine.description}</p>}

                                <div className="card-actions">
                                    {!isPaused && (
                                        <>
                                            <button
                                                className="secondary-button"
                                                onClick={() => handleComplete(routine)}
                                            >
                                                Complete
                                            </button>

                                            <button
                                                className="secondary-button"
                                                onClick={() => handleCreateTask(routine)}
                                            >
                                                Create Task
                                            </button>
                                        </>
                                    )}

                                    <button
                                        className="secondary-button"
                                        onClick={() => startEdit(routine)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="danger-button"
                                        onClick={() => handleDelete(routine)}
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