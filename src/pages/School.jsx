import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Plus } from "lucide-react"

import {
    completeSchoolItem,
    createSchoolItem,
    deleteSchoolItem,
    getSchoolItems,
    updateSchoolItem
} from "../services/schoolService"
import { getFamilyMembers } from "../services/familyService"

import AppPage from "../components/ui/AppPage"
import PageHeader from "../components/ui/PageHeader"
import SectionCard from "../components/ui/SectionCard"
import Button from "../components/ui/Button"
import InsightCard from "../components/dashboard/InsightCard"
import ActionMenu from "../components/ui/ActionMenu"

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
        <SectionCard
            title={title}
            subtitle={subtitle}
            count={items.length}
        >
            {items.length === 0 ? (
                <p className="dashboard-empty">{emptyText}</p>
            ) : (
                <div className="eg-stack">
                    {items.map(item => renderSchoolRow(item))}
                </div>
            )}
        </SectionCard>
    )
}

export default function School() {
    const [searchParams] = useSearchParams()
    const dueDateParam = searchParams.get("dueDate")

    const [items, setItems] = useState([])
    const [familyMembers, setFamilyMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [showCompleted, setShowCompleted] = useState(false)
    const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState("all")

    const [schoolMenuOpen, setSchoolMenuOpen] = useState(null)

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

        if (dueDateParam) {
            setForm({
                ...initialForm,
                due_date: dueDateParam
            })
            setEditingId(null)
            setShowForm(true)
        }
    }, [dueDateParam])

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
                        <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={() => handleComplete(item)}
                        >
                            Complete
                        </Button>
                    )}

                    <ActionMenu
                        title={item.title}
                        open={schoolMenuOpen === item.id}
                        onOpenChange={isOpen =>
                            setSchoolMenuOpen(isOpen ? item.id : null)
                        }
                        ariaLabel="Open school item actions"
                        actions={[
                            {
                                label: "Edit",
                                onClick: () => startEdit(item)
                            },
                            {
                                label: "Delete",
                                danger: true,
                                onClick: () => handleDelete(item)
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
                eyebrow="School"
                title="School Hub"
                subtitle={`${activeCount} active • ${groupedItems.thisWeek.length} this week • ${studentCount} students`}
                action={
                    <Button
                        size="sm"
                        onClick={() => {
                            if (showForm) resetForm()
                            else setShowForm(true)
                        }}
                    >
                        <Plus size={16} />
                        {showForm ? "Cancel" : "Add"}
                    </Button>
                }
            />

            <div className="eg-stack">
                <InsightCard
                    insight={{
                        title:
                            groupedItems.dueNow.length > 0
                                ? `${groupedItems.dueNow.length} school item${groupedItems.dueNow.length === 1 ? "" : "s"} need attention`
                                : groupedItems.thisWeek.length > 0
                                    ? `${groupedItems.thisWeek.length} school item${groupedItems.thisWeek.length === 1 ? "" : "s"} due this week`
                                    : "School is caught up",
                        description:
                            groupedItems.dueNow.length > 0
                                ? "Review the most urgent school items first."
                                : groupedItems.thisWeek.length > 0
                                    ? "You have a few school items coming up soon."
                                    : "No urgent school items need attention right now.",
                        actionLabel:
                            groupedItems.dueNow.length > 0 || groupedItems.thisWeek.length > 0
                                ? "Review Items"
                                : "Add Item"
                    }}
                    onAction={() => {
                        if (groupedItems.dueNow.length === 0 && groupedItems.thisWeek.length === 0) {
                            setShowForm(true)
                        }
                    }}
                />

                {showForm && (
                    <SectionCard
                        title={editingId ? "Edit School Item" : "Add School Item"}
                        subtitle="Track forms, events, supplies, payments, and school reminders."
                    >
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
                                    {familyMembers
                                        .filter(member => member.role === "child")
                                        .map(member => (
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

                            <Button
                                className="full-width"
                                type="submit"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Save Changes"
                                        : "Save School Item"}
                            </Button>
                        </form>
                    </SectionCard>
                )}

                <SectionCard
                    title="School Items"
                    subtitle="Filter by student and review what needs attention."
                    action={
                        <div className="eg-filter-chips">
                            <button
                                type="button"
                                className={selectedFamilyMemberId === "all" ? "active" : ""}
                                onClick={() => setSelectedFamilyMemberId("all")}
                            >
                                All
                            </button>

                            {familyMembers
                                .filter(member => member.role === "child")
                                .map(member => (
                                    <button
                                        key={member.id}
                                        type="button"
                                        className={selectedFamilyMemberId === member.id ? "active" : ""}
                                        onClick={() => setSelectedFamilyMemberId(member.id)}
                                    >
                                        {member.avatar_emoji ? `${member.avatar_emoji} ` : ""}
                                        {member.name}
                                    </button>
                                ))}
                        </div>
                    }
                >
                    {loading ? (
                        <p>Loading school items...</p>
                    ) : visibleItems.length === 0 ? (
                        <p className="dashboard-empty">No school items found for this filter.</p>
                    ) : (
                        <div className="eg-stack">
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
                                <SectionCard
                                    title="Completed"
                                    subtitle="Finished school items."
                                    count={groupedItems.completed.length}
                                    action={
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            type="button"
                                            onClick={() => setShowCompleted(current => !current)}
                                        >
                                            {showCompleted ? "Hide" : "Show"}
                                        </Button>
                                    }
                                >
                                    {showCompleted && (
                                        <SchoolSection
                                            title="Completed Items"
                                            subtitle="Finished school items."
                                            items={groupedItems.completed}
                                            emptyText="No completed school items."
                                            renderSchoolRow={renderSchoolRow}
                                        />
                                    )}
                                </SectionCard>
                            )}
                        </div>
                    )}
                </SectionCard>
            </div>
        </AppPage>
    )
}