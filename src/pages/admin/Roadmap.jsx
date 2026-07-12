import { useEffect, useMemo, useState } from "react"
import {
    Check,
    CheckCircle2,
    ChevronDown,
    CirclePause,
    Clock3,
    Edit3,
    Eye,
    EyeOff,
    ListTodo,
    Plus,
    Search,
    Trash2,
    X
} from "lucide-react"

import {
    createRoadmapItem,
    deleteRoadmapItem,
    getRoadmapItems,
    markRoadmapItemComplete,
    updateRoadmapItem
} from "../../services/admin/roadmapService"

import "../../styles/hq-ui.css"

const STATUS_OPTIONS = [
    { value: "backlog", label: "Backlog" },
    { value: "planned", label: "Planned" },
    { value: "in_progress", label: "In Progress" },
    { value: "on_hold", label: "On Hold" },
    { value: "complete", label: "Complete" },
    { value: "not_planned", label: "Not Planned" }
]

const PRIORITY_OPTIONS = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" }
]

const PRODUCT_AREAS = [
    "Command Center",
    "Calendar",
    "To-Dos",
    "Meals",
    "Shopping",
    "Trips",
    "Family",
    "Inbox",
    "Notifications",
    "Evergrove Intelligence",
    "Onboarding",
    "Growth",
    "Evergrove HQ",
    "Platform",
    "Trust & Security"
]

const EMPTY_FORM = {
    title: "",
    description: "",
    product_area: "Platform",
    status: "backlog",
    priority: "medium",
    target_release: "",
    internal_notes: "",
    customer_visible: true,
    sort_order: 0
}

export default function Roadmap() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("active")
    const [areaFilter, setAreaFilter] = useState("all")
    const [priorityFilter, setPriorityFilter] = useState("all")

    const [formOpen, setFormOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)

    useEffect(() => {
        loadRoadmap()
    }, [])

    async function loadRoadmap() {
        try {
            setLoading(true)
            setError("")

            const data = await getRoadmapItems()
            setItems(data)
        } catch (loadError) {
            console.error(loadError)
            setError(
                loadError.message ||
                "Evergrove could not load the product roadmap."
            )
        } finally {
            setLoading(false)
        }
    }

    const summary = useMemo(() => {
        return {
            total: items.length,
            inProgress: items.filter(
                item => item.status === "in_progress"
            ).length,
            planned: items.filter(
                item => item.status === "planned"
            ).length,
            backlog: items.filter(
                item => item.status === "backlog"
            ).length,
            complete: items.filter(
                item => item.status === "complete"
            ).length
        }
    }, [items])

    const productAreas = useMemo(() => {
        return Array.from(
            new Set([
                ...PRODUCT_AREAS,
                ...items
                    .map(item => item.product_area)
                    .filter(Boolean)
            ])
        ).sort((a, b) => a.localeCompare(b))
    }, [items])

    const filteredItems = useMemo(() => {
        const normalizedSearch = searchTerm
            .trim()
            .toLowerCase()

        return items.filter(item => {
            const matchesSearch =
                !normalizedSearch ||
                item.title
                    ?.toLowerCase()
                    .includes(normalizedSearch) ||
                item.description
                    ?.toLowerCase()
                    .includes(normalizedSearch) ||
                item.product_area
                    ?.toLowerCase()
                    .includes(normalizedSearch) ||
                item.target_release
                    ?.toLowerCase()
                    .includes(normalizedSearch)

            const matchesStatus =
                statusFilter === "all" ||
                (
                    statusFilter === "active" &&
                    !["complete", "not_planned"].includes(
                        item.status
                    )
                ) ||
                item.status === statusFilter

            const matchesArea =
                areaFilter === "all" ||
                item.product_area === areaFilter

            const matchesPriority =
                priorityFilter === "all" ||
                item.priority === priorityFilter

            return (
                matchesSearch &&
                matchesStatus &&
                matchesArea &&
                matchesPriority
            )
        })
    }, [
        items,
        searchTerm,
        statusFilter,
        areaFilter,
        priorityFilter
    ])

    const groupedItems = useMemo(() => {
        return STATUS_OPTIONS.map(status => ({
            ...status,
            items: filteredItems.filter(
                item => item.status === status.value
            )
        })).filter(group => group.items.length > 0)
    }, [filteredItems])

    function openCreateForm() {
        setEditingItem(null)
        setForm(EMPTY_FORM)
        setError("")
        setFormOpen(true)
    }

    function openEditForm(item) {
        setEditingItem(item)
        setForm({
            title: item.title ?? "",
            description: item.description ?? "",
            product_area: item.product_area ?? "Platform",
            status: item.status ?? "backlog",
            priority: item.priority ?? "medium",
            target_release: item.target_release ?? "",
            internal_notes: item.internal_notes ?? "",
            customer_visible:
                item.customer_visible ?? true,
            sort_order: item.sort_order ?? 0
        })
        setError("")
        setFormOpen(true)
    }

    function closeForm() {
        if (saving) return

        setFormOpen(false)
        setEditingItem(null)
        setForm(EMPTY_FORM)
    }

    function handleFormChange(event) {
        const { name, value, type, checked } = event.target

        setForm(current => ({
            ...current,
            [name]: type === "checkbox"
                ? checked
                : value
        }))
    }

    async function handleSubmit(event) {
        event.preventDefault()

        if (!form.title.trim()) {
            setError("Roadmap items need a title.")
            return
        }

        try {
            setSaving(true)
            setError("")

            if (editingItem) {
                const updatedItem = await updateRoadmapItem(
                    editingItem.id,
                    form
                )

                setItems(current =>
                    current.map(item =>
                        item.id === updatedItem.id
                            ? updatedItem
                            : item
                    )
                )
            } else {
                const createdItem =
                    await createRoadmapItem(form)

                setItems(current => [
                    ...current,
                    createdItem
                ])
            }

            closeForm()
        } catch (saveError) {
            console.error(saveError)
            setError(
                saveError.message ||
                "Evergrove could not save this roadmap item."
            )
        } finally {
            setSaving(false)
        }
    }

    async function handleMarkComplete(item) {
        try {
            setError("")

            const updatedItem =
                await markRoadmapItemComplete(item.id)

            setItems(current =>
                current.map(currentItem =>
                    currentItem.id === updatedItem.id
                        ? updatedItem
                        : currentItem
                )
            )
        } catch (completeError) {
            console.error(completeError)
            setError(
                completeError.message ||
                "Evergrove could not complete this item."
            )
        }
    }

    async function handleDelete(item) {
        const confirmed = window.confirm(
            `Delete "${item.title}" from the roadmap?`
        )

        if (!confirmed) return

        try {
            setError("")

            await deleteRoadmapItem(item.id)

            setItems(current =>
                current.filter(
                    currentItem =>
                        currentItem.id !== item.id
                )
            )
        } catch (deleteError) {
            console.error(deleteError)
            setError(
                deleteError.message ||
                "Evergrove could not delete this item."
            )
        }
    }

    return (
        <div className="admin-page roadmap-page">
            <div className="admin-page-header roadmap-header">
                <div>
                    <p className="admin-eyebrow">
                        Product
                    </p>

                    <h1>Product Roadmap</h1>

                    <p className="admin-page-description">
                        Track what Evergrove does today,
                        what comes next, and what is
                        intentionally outside the product.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-primary-button"
                    onClick={openCreateForm}
                >
                    <Plus size={18} />
                    Add Roadmap Item
                </button>
            </div>

            {error && (
                <div className="admin-error-message">
                    {error}
                </div>
            )}

            <div className="roadmap-summary-grid">
                <RoadmapSummaryCard
                    label="Total Capabilities"
                    value={summary.total}
                    icon={ListTodo}
                />

                <RoadmapSummaryCard
                    label="In Progress"
                    value={summary.inProgress}
                    icon={Clock3}
                />

                <RoadmapSummaryCard
                    label="Planned"
                    value={summary.planned}
                    icon={ChevronDown}
                />

                <RoadmapSummaryCard
                    label="Backlog"
                    value={summary.backlog}
                    icon={CirclePause}
                />

                <RoadmapSummaryCard
                    label="Completed"
                    value={summary.complete}
                    icon={CheckCircle2}
                />
            </div>

            <div className="admin-card roadmap-filter-card">
                <div className="roadmap-search-field">
                    <Search size={18} />

                    <input
                        type="search"
                        value={searchTerm}
                        onChange={event =>
                            setSearchTerm(event.target.value)
                        }
                        placeholder="Search roadmap items"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={event =>
                        setStatusFilter(event.target.value)
                    }
                >
                    <option value="active">
                        Active roadmap
                    </option>

                    <option value="all">
                        All statuses
                    </option>

                    {STATUS_OPTIONS.map(status => (
                        <option
                            key={status.value}
                            value={status.value}
                        >
                            {status.label}
                        </option>
                    ))}
                </select>

                <select
                    value={areaFilter}
                    onChange={event =>
                        setAreaFilter(event.target.value)
                    }
                >
                    <option value="all">
                        All product areas
                    </option>

                    {productAreas.map(area => (
                        <option
                            key={area}
                            value={area}
                        >
                            {area}
                        </option>
                    ))}
                </select>

                <select
                    value={priorityFilter}
                    onChange={event =>
                        setPriorityFilter(event.target.value)
                    }
                >
                    <option value="all">
                        All priorities
                    </option>

                    {PRIORITY_OPTIONS.map(priority => (
                        <option
                            key={priority.value}
                            value={priority.value}
                        >
                            {priority.label}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="admin-card roadmap-empty-state">
                    Loading the Evergrove roadmap…
                </div>
            ) : groupedItems.length === 0 ? (
                <div className="admin-card roadmap-empty-state">
                    <ListTodo size={30} />

                    <h2>No roadmap items found</h2>

                    <p>
                        Try changing the filters or add a new
                        product capability.
                    </p>
                </div>
            ) : (
                <div className="roadmap-groups">
                    {groupedItems.map(group => (
                        <section
                            key={group.value}
                            className="roadmap-group"
                        >
                            <div className="roadmap-group-header">
                                <div>
                                    <h2>{group.label}</h2>

                                    <p>
                                        {group.items.length}
                                        {" "}
                                        {group.items.length === 1
                                            ? "item"
                                            : "items"}
                                    </p>
                                </div>
                            </div>

                            <div className="roadmap-item-list">
                                {group.items.map(item => (
                                    <RoadmapItem
                                        key={item.id}
                                        item={item}
                                        onEdit={openEditForm}
                                        onComplete={
                                            handleMarkComplete
                                        }
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {formOpen && (
                <RoadmapForm
                    form={form}
                    editingItem={editingItem}
                    saving={saving}
                    productAreas={productAreas}
                    onChange={handleFormChange}
                    onSubmit={handleSubmit}
                    onClose={closeForm}
                />
            )}
        </div>
    )
}

function RoadmapSummaryCard({
    label,
    value,
    icon: Icon
}) {
    return (
        <div className="admin-card roadmap-summary-card">
            <div className="roadmap-summary-icon">
                <Icon size={19} />
            </div>

            <div>
                <strong>{value}</strong>
                <span>{label}</span>
            </div>
        </div>
    )
}

function RoadmapItem({
    item,
    onEdit,
    onComplete,
    onDelete
}) {
    const statusLabel =
        STATUS_OPTIONS.find(
            status => status.value === item.status
        )?.label ?? item.status

    const priorityLabel =
        PRIORITY_OPTIONS.find(
            priority => priority.value === item.priority
        )?.label ?? item.priority

    return (
        <article className="admin-card roadmap-item-card">
            <div className="roadmap-item-main">
                <div className="roadmap-item-heading">
                    <div>
                        <h3>{item.title}</h3>

                        <div className="roadmap-item-meta">
                            <span>{item.product_area}</span>

                            <span
                                className={
                                    `roadmap-status roadmap-status-${item.status}`
                                }
                            >
                                {statusLabel}
                            </span>

                            <span
                                className={
                                    `roadmap-priority roadmap-priority-${item.priority}`
                                }
                            >
                                {priorityLabel}
                            </span>
                        </div>
                    </div>

                    <div className="roadmap-visibility">
                        {item.customer_visible ? (
                            <>
                                <Eye size={15} />
                                Customer visible
                            </>
                        ) : (
                            <>
                                <EyeOff size={15} />
                                Internal
                            </>
                        )}
                    </div>
                </div>

                {item.description && (
                    <p className="roadmap-item-description">
                        {item.description}
                    </p>
                )}

                <div className="roadmap-item-details">
                    {item.target_release && (
                        <span>
                            Target: {item.target_release}
                        </span>
                    )}

                    {item.completed_at && (
                        <span>
                            Completed:{" "}
                            {formatDate(item.completed_at)}
                        </span>
                    )}
                </div>

                {item.internal_notes && (
                    <div className="roadmap-internal-notes">
                        <strong>Internal notes</strong>
                        <p>{item.internal_notes}</p>
                    </div>
                )}
            </div>

            <div className="roadmap-item-actions">
                {item.status !== "complete" &&
                    item.status !== "not_planned" && (
                        <button
                            type="button"
                            className="admin-icon-button roadmap-complete-button"
                            onClick={() => onComplete(item)}
                            title="Mark complete"
                            aria-label={`Mark ${item.title} complete`}
                        >
                            <Check size={18} />
                        </button>
                    )}

                <button
                    type="button"
                    className="admin-icon-button"
                    onClick={() => onEdit(item)}
                    title="Edit roadmap item"
                    aria-label={`Edit ${item.title}`}
                >
                    <Edit3 size={18} />
                </button>

                <button
                    type="button"
                    className="admin-icon-button admin-danger-button"
                    onClick={() => onDelete(item)}
                    title="Delete roadmap item"
                    aria-label={`Delete ${item.title}`}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </article>
    )
}

function RoadmapForm({
    form,
    editingItem,
    saving,
    productAreas,
    onChange,
    onSubmit,
    onClose
}) {
    return (
        <div
            className="admin-modal-backdrop"
            role="presentation"
            onMouseDown={event => {
                if (event.target === event.currentTarget) {
                    onClose()
                }
            }}
        >
            <div
                className="admin-modal roadmap-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="roadmap-form-title"
            >
                <div className="admin-modal-header">
                    <div>
                        <p className="admin-eyebrow">
                            Product Roadmap
                        </p>

                        <h2 id="roadmap-form-title">
                            {editingItem
                                ? "Edit Roadmap Item"
                                : "Add Roadmap Item"}
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="admin-icon-button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close roadmap form"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form
                    className="roadmap-form"
                    onSubmit={onSubmit}
                >
                    <label className="admin-field">
                        <span>Title</span>

                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={onChange}
                            placeholder="What does or will Evergrove do?"
                            autoFocus
                        />
                    </label>

                    <label className="admin-field">
                        <span>Description</span>

                        <textarea
                            name="description"
                            value={form.description}
                            onChange={onChange}
                            rows={4}
                            placeholder="Describe the capability, customer problem, or intended outcome."
                        />
                    </label>

                    <div className="roadmap-form-grid">
                        <label className="admin-field">
                            <span>Product area</span>

                            <select
                                name="product_area"
                                value={form.product_area}
                                onChange={onChange}
                            >
                                {productAreas.map(area => (
                                    <option
                                        key={area}
                                        value={area}
                                    >
                                        {area}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="admin-field">
                            <span>Status</span>

                            <select
                                name="status"
                                value={form.status}
                                onChange={onChange}
                            >
                                {STATUS_OPTIONS.map(status => (
                                    <option
                                        key={status.value}
                                        value={status.value}
                                    >
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="admin-field">
                            <span>Priority</span>

                            <select
                                name="priority"
                                value={form.priority}
                                onChange={onChange}
                            >
                                {PRIORITY_OPTIONS.map(priority => (
                                    <option
                                        key={priority.value}
                                        value={priority.value}
                                    >
                                        {priority.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="admin-field">
                            <span>Target release</span>

                            <input
                                type="text"
                                name="target_release"
                                value={form.target_release}
                                onChange={onChange}
                                placeholder="Beta, v1.0, Q4 2026..."
                            />
                        </label>

                        <label className="admin-field">
                            <span>Sort order</span>

                            <input
                                type="number"
                                name="sort_order"
                                value={form.sort_order}
                                onChange={onChange}
                                min="0"
                            />
                        </label>
                    </div>

                    <label className="admin-field">
                        <span>Internal notes</span>

                        <textarea
                            name="internal_notes"
                            value={form.internal_notes}
                            onChange={onChange}
                            rows={3}
                            placeholder="Dependencies, decisions, or implementation notes."
                        />
                    </label>

                    <label className="admin-checkbox-field">
                        <input
                            type="checkbox"
                            name="customer_visible"
                            checked={form.customer_visible}
                            onChange={onChange}
                        />

                        <span>
                            This capability can be shown on a
                            future customer-facing roadmap
                        </span>
                    </label>

                    <div className="admin-modal-actions">
                        <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="admin-primary-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving…"
                                : editingItem
                                    ? "Save Changes"
                                    : "Add Roadmap Item"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function formatDate(value) {
    if (!value) return ""

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(new Date(value))
}