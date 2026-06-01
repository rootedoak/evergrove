import { useEffect, useMemo, useState } from "react"
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

function formatDate(dateString) {
    if (!dateString) return "No due date"

    return createLocalDate(dateString).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    })
}

function formatCategory(category) {
    const labels = {
        general: "General",
        form: "Form",
        field_trip: "Field Trip",
        conference: "Conference",
        supply: "Supply",
        spirit_day: "Spirit Day",
        event: "Event",
        payment: "Payment"
    }

    return labels[category] || category || "School"
}

function sortItems(items) {
    return [...items].sort((a, b) => {
        if (!a.due_date && !b.due_date) return a.title.localeCompare(b.title)
        if (!a.due_date) return 1
        if (!b.due_date) return -1

        const dateDiff = createLocalDate(a.due_date) - createLocalDate(b.due_date)
        if (dateDiff !== 0) return dateDiff

        return a.title.localeCompare(b.title)
    })
}

function groupSchoolItems(items) {
    const groups = {
        dueNow: [],
        thisWeek: [],
        later: [],
        completed: []
    }

    items.forEach(item => {
        if (item.completed) {
            groups.completed.push(item)
            return
        }

        const daysUntil = getDaysUntil(item.due_date)

        if (daysUntil !== null && daysUntil <= 0) {
            groups.dueNow.push(item)
            return
        }

        if (daysUntil !== null && daysUntil <= 7) {
            groups.thisWeek.push(item)
            return
        }

        groups.later.push(item)
    })

    return groups
}

function SchoolSection({
    title,
    subtitle,
    items,
    emptyText,
    renderSchoolRow
}) {
    return (
        <section className="school-command-section">
            <div className="school-section-header">
                <div>
                    <h3>{title}</h3>
                    {subtitle && <p>{subtitle}</p>}
                </div>

                <span>{items.length}</span>
            </div>

            {items.length === 0 ? (
                <p className="dashboard-empty">{emptyText}</p>
            ) : (
                <div className="school-command-list">
                    {items.map(item => renderSchoolRow(item))}
                </div>
            )}
        </section>
    )
}

export default function School() {
    const [items, setItems] = useState([])
    const [familyMembers, setFamilyMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [showCompleted, setShowCompleted] = useState(false)
    const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState("all")

    const visibleItems = useMemo(() => {
        return items.filter(item => {
            if (selectedFamilyMemberId === "all") return true
            return item.family_member_id === selectedFamilyMemberId
        })
    }, [items, selectedFamilyMemberId])

    const groupedItems = useMemo(() => {
        return groupSchoolItems(sortItems(visibleItems))
    }, [visibleItems])

    const activeCount =
        groupedItems.dueNow.length +
        groupedItems.thisWeek.length +
        groupedItems.later.length

    const studentCount = familyMembers.filter(member => member.role === "child").length

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
        window.scrollTo({ top: 0, behavior: "smooth" })
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
            alert(error.message || "Could not save school item.")
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
            alert(error.message || "Could not complete school item.")
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
            alert(error.message || "Could not delete school item.")
        }
    }

    function renderSchoolRow(item) {
        const member = item.family_members
        const isComplete = item.completed

        return (
            <div
                className={`school-command-row ${isComplete ? "school-command-row-complete" : ""}`}
                key={item.id}
            >
                <span className="school-command-icon">
                    {member?.avatar_emoji || "🎒"}
                </span>

                <div className="school-command-main">
                    <strong>{item.title}</strong>

                    <p>
                        {member?.name || "School"}
                        {item.due_date ? ` • Due ${formatDate(item.due_date)}` : ""}
                        {item.category ? ` • ${formatCategory(item.category)}` : ""}
                    </p>

                    {item.notes && <small>{item.notes}</small>}
                </div>

                <div className="school-command-status">
                    <span
                        className={`status-pill ${isComplete ? "status-success" : "status-warning"}`}
                    >
                        {isComplete ? "Complete" : formatCategory(item.category)}
                    </span>
                </div>

                <div className="school-command-actions">
                    {!isComplete && (
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => handleComplete(item)}
                        >
                            Complete
                        </button>
                    )}

                    <button
                        className="secondary-button"
                        type="button"
                        onClick={() => startEdit(item)}
                    >
                        Edit
                    </button>

                    <button
                        className="danger-button"
                        type="button"
                        onClick={() => handleDelete(item)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="school-command-page">
            <header className="calendar-header school-command-header">
                <div>
                    <p className="dashboard-household-name">School</p>
                    <h2>School Hub</h2>

                    <p className="school-header-summary">
                        {activeCount} active • {groupedItems.thisWeek.length} this week •{" "}
                        {studentCount} students
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
                    {showForm ? "Cancel" : "+ Add School Item"}
                </button>
            </header>

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

                        <button
                            className="primary-button full-width"
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Save Changes"
                                    : "Save School Item"}
                        </button>
                    </form>
                </section>
            )}

            <section className="card school-command-card">
                <div className="school-command-toolbar">
                    <div>
                        <p className="card-kicker">Filter</p>
                        <h3>School Items</h3>
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
                    <p>Loading school items...</p>
                ) : visibleItems.length === 0 ? (
                    <p className="dashboard-empty">No school items found for this filter.</p>
                ) : (
                    <>
                        <SchoolSection
                            title="Due Now"
                            subtitle="Needs attention first."
                            items={groupedItems.dueNow}
                            emptyText="Nothing due now."
                            renderSchoolRow={renderSchoolRow}
                        />

                        <SchoolSection
                            title="This Week"
                            subtitle="Due in the next 7 days."
                            items={groupedItems.thisWeek}
                            emptyText="Nothing due this week."
                            renderSchoolRow={renderSchoolRow}
                        />

                        <SchoolSection
                            title="Later"
                            subtitle="Upcoming school items."
                            items={groupedItems.later}
                            emptyText="No later school items."
                            renderSchoolRow={renderSchoolRow}
                        />

                        {groupedItems.completed.length > 0 && (
                            <section className="school-command-section">
                                <button
                                    className="completed-toggle"
                                    type="button"
                                    onClick={() => setShowCompleted(current => !current)}
                                >
                                    <span>
                                        {showCompleted ? "Hide" : "Show"} Completed
                                    </span>

                                    <strong>{groupedItems.completed.length}</strong>
                                </button>

                                {showCompleted && (
                                    <SchoolSection
                                        title="Completed"
                                        subtitle="Finished school items."
                                        items={groupedItems.completed}
                                        emptyText="No completed school items."
                                        renderSchoolRow={renderSchoolRow}
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