import { useEffect, useState } from "react"
import {
    completeSchoolItem,
    createSchoolItem,
    deleteSchoolItem,
    getSchoolItems,
    updateSchoolItem
} from "../services/schoolService"
import { getFamilyMembers } from "../services/familyService"

const initialForm = {
    title: "",
    category: "general",
    due_date: "",
    family_member_id: "",
    notes: "",
    completed: false
}

function normalizeItem(item) {
    return {
        title: item.title || "",
        category: item.category || "general",
        due_date: item.due_date || "",
        family_member_id: item.family_member_id || "",
        notes: item.notes || "",
        completed: item.completed || false
    }
}

export default function School() {
    const [items, setItems] = useState([])
    const [familyMembers, setFamilyMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)

    async function loadData() {
        try {
            const [schoolData, memberData] = await Promise.all([
                getSchoolItems(),
                getFamilyMembers()
            ])

            setItems(schoolData)
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
        setForm(current => ({ ...current, [field]: value }))
    }

    function resetForm() {
        setForm(initialForm)
        setEditingId(null)
        setShowForm(false)
    }

    function startEdit(item) {
        setEditingId(item.id)
        setForm(normalizeItem(item))
        setShowForm(true)
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)

        const payload = {
            ...form,
            due_date: form.due_date || null,
            family_member_id: form.family_member_id || null
        }

        try {
            if (editingId) {
                await updateSchoolItem(editingId, payload)
            } else {
                await createSchoolItem(payload)
            }

            resetForm()
            await loadData()
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    async function handleComplete(item) {
        try {
            await completeSchoolItem(item.id)
            await loadData()
        } catch (error) {
            console.error(error)
        }
    }

    async function handleDelete(item) {
        const confirmed = window.confirm(
            `Delete "${item.title}"? This cannot be undone.`
        )

        if (!confirmed) return

        try {
            await deleteSchoolItem(item.id)
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
                        <p className="eyebrow">School</p>
                        <h2>School Hub</h2>
                        <p>
                            Track school forms, field trips, parent conferences,
                            supply deadlines, spirit days, and school tasks.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={() => {
                            if (showForm) resetForm()
                            else setShowForm(true)
                        }}
                    >
                        {showForm ? "Cancel" : "+ Add School Item"}
                    </button>
                </div>
            </section>

            {showForm && (
                <section className="card form-card">
                    <h3>{editingId ? "Edit School Item" : "Add School Item"}</h3>

                    <form className="form-grid" onSubmit={handleSubmit}>
                        <label>
                            Title
                            <input
                                value={form.title}
                                onChange={event => updateForm("title", event.target.value)}
                                placeholder="Field trip form due"
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
                                <option value="form">Form</option>
                                <option value="field_trip">Field Trip</option>
                                <option value="conference">Conference</option>
                                <option value="supply">Supply</option>
                                <option value="spirit_day">Spirit Day</option>
                                <option value="event">Event</option>
                                <option value="payment">Payment</option>
                            </select>
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

                        <label className="full-width">
                            Notes
                            <textarea
                                value={form.notes}
                                onChange={event => updateForm("notes", event.target.value)}
                                rows="3"
                            />
                        </label>

                        <button className="primary-button full-width" type="submit" disabled={saving}>
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Save Changes"
                                    : "Save School Item"}
                        </button>
                    </form>
                </section>
            )}

            <div className="grid">
                {loading ? (
                    <section className="card">
                        <p>Loading school items...</p>
                    </section>
                ) : items.length === 0 ? (
                    <section className="card">
                        <p>No school items added yet.</p>
                    </section>
                ) : (
                    items.map(item => {
                        const member = item.family_members
                        const isComplete = item.completed

                        return (
                            <section
                                className={`card ${isComplete ? "completed-card" : ""}`}
                                key={item.id}
                            >
                                <div className="member-header">
                                    <span className="avatar">
                                        {member?.avatar_emoji || "🏫"}
                                    </span>

                                    <div>
                                        <h3>{item.title}</h3>
                                        <span
                                            className={`status-pill ${isComplete ? "status-success" : "status-warning"
                                                }`}
                                        >
                                            {isComplete ? "Complete" : item.category}
                                        </span>
                                    </div>
                                </div>

                                {item.due_date && <p>Due: {item.due_date}</p>}
                                {member?.name && <p>For: {member.name}</p>}
                                {item.notes && <p>{item.notes}</p>}

                                <div className="card-actions">
                                    {!isComplete && (
                                        <button
                                            className="secondary-button"
                                            onClick={() => handleComplete(item)}
                                        >
                                            Complete
                                        </button>
                                    )}

                                    <button
                                        className="secondary-button"
                                        onClick={() => startEdit(item)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="danger-button"
                                        onClick={() => handleDelete(item)}
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