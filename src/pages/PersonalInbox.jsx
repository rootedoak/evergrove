import { useState } from "react"
import { useNavigate } from "react-router-dom"

import usePersonalInbox from "../hooks/usePersonalInbox"
import ThoughtCaptureSheet from "../components/ThoughtCaptureSheet"

import {
    convertThoughtToTask,
    convertThoughtToReminder,
    updatePersonalInboxItem
} from "../services/personalInboxService"

function getTodayString() {
    const today = new Date()

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-")
}

function formatDate(dateString) {
    if (!dateString) return ""

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
    })
}

function getInboxIcon(itemType) {
    if (itemType === "thought") return "💭"
    if (itemType === "task") return "✅"
    if (itemType === "calendar_event") return "📅"
    if (itemType === "school") return "🎒"
    if (itemType === "trip") return "🧳"
    if (itemType === "meal" || itemType === "meal_plan") return "🍽️"
    if (itemType === "shopping") return "🛒"
    if (itemType === "reminder") return "🔔"
    return "🌿"
}

function getItemMeta(item) {
    const parts = []

    if (item.item_type) {
        parts.push(
            item.item_type
                .replaceAll("_", " ")
                .replace(/\b\w/g, letter => letter.toUpperCase())
        )
    }

    if (item.due_date) {
        parts.push(`Due ${formatDate(item.due_date)}`)
    }

    return parts.join(" · ")
}

export default function PersonalInbox() {
    const navigate = useNavigate()

    const {
        items,
        loading: inboxLoading,
        refreshInbox,
        markRead,
        removeItem
    } = usePersonalInbox()

    const [selectedItem, setSelectedItem] = useState(null)

    const [editingThought, setEditingThought] = useState(null)
    const [editThoughtTitle, setEditThoughtTitle] = useState("")
    const [editThoughtBody, setEditThoughtBody] = useState("")
    const [savingThoughtEdit, setSavingThoughtEdit] = useState(false)

    const unreadCount = items.filter(item => item.status === "unread").length

    const thoughtItems = items.filter(item => item.item_type === "thought")

    const [showThoughtCapture, setShowThoughtCapture] = useState(false)

    const notificationItems = items.filter(
        item => item.item_type !== "thought"
    )

    const loading = inboxLoading

    function getInboxDestination(item) {
        const type = item.related_type || item.item_type

        if (type === "task") return "/tasks"
        if (type === "calendar_event") return "/calendar"
        if (type === "school") return "/school"
        if (type === "trip") return "/trips"
        if (type === "meal_plan") return "/meals"
        if (type === "meal") return "/meals"
        if (type === "shopping") return "/shopping"

        return null
    }

    async function handleOpenInboxItem(item) {
        if (item.status === "unread") {
            await markRead(item.id)
        }

        setSelectedItem(null)

        const type = item.related_type || item.item_type

        if (type === "task") {
            navigate("/tasks", {
                state: {
                    taskId: item.related_id
                }
            })
            return
        }

        if (type === "calendar_event") {
            navigate("/calendar", {
                state: {
                    calendarEventId: item.related_id
                }
            })
            return
        }

        if (type === "meal_plan" || type === "meal") {
            navigate("/meals", {
                state: {
                    mealPlanId: item.related_id
                }
            })
            return
        }

        const destination = getInboxDestination(item)

        if (destination) {
            navigate(destination)
        }
    }

    async function handleMarkRead(item) {
        await markRead(item.id)
        setSelectedItem(null)
    }

    async function handleDeleteItem(item) {
        await removeItem(item.id)
        setSelectedItem(null)
    }

    async function handleArchiveThought(item) {
        await removeItem(item.id)
        setSelectedItem(null)
    }

    async function handleConvertThoughtToTask(item) {
        try {
            const task = await convertThoughtToTask(item)

            await refreshInbox()

            navigate("/tasks", {
                state: {
                    taskId: task.id
                }
            })
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not convert thought to To-Do.")
        }
    }

    async function handleConvertThoughtToReminder(item) {
        try {
            await convertThoughtToReminder(item)
            await refreshInbox()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not convert thought to reminder.")
        }
    }

    async function handleScheduleThought(item) {
        navigate("/calendar", {
            state: {
                openCalendarEventForm: true,
                selectedDate: getTodayString(),
                thoughtToConvert: {
                    id: item.id,
                    title: item.title,
                    body: item.body || item.message || null
                }
            }
        })
    }

    async function handleCreateReminder(event) {
        event.preventDefault()
        setSavingReminder(true)

        try {
            await addReminder({
                title: reminderForm.title.trim(),
                notes: reminderForm.notes.trim() || null,
                frequency: reminderForm.frequency,
                next_due: reminderForm.next_due
            })

            setReminderForm({
                title: "",
                notes: "",
                frequency: "monthly",
                next_due: getTodayString()
            })
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not create reminder.")
        } finally {
            setSavingReminder(false)
        }
    }

    function startEditingThought(item) {
        setEditingThought(item)
        setEditThoughtTitle(item.title || "")
        setEditThoughtBody(item.body || item.message || "")
    }

    function cancelEditingThought() {
        setEditingThought(null)
        setEditThoughtTitle("")
        setEditThoughtBody("")
    }

    async function saveEditingThought() {
        if (!editingThought) return
        if (!editThoughtTitle.trim()) return

        setSavingThoughtEdit(true)

        try {
            await updatePersonalInboxItem(editingThought.id, {
                title: editThoughtTitle,
                body: editThoughtBody
            })

            cancelEditingThought()
            await refreshInbox()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not update thought.")
        } finally {
            setSavingThoughtEdit(false)
        }
    }

    return (
        <div className="page-shell">
            <header className="page-header">
                <div>
                    <p className="dashboard-household-name">
                        Personal
                    </p>

                    <h2>Personal Inbox</h2>

                    <p>
                        Reminders, nudges, and updates meant for you.
                    </p>
                </div>
            </header>

            <section className="card">
                <p className="card-kicker">Notifications</p>

                <h3>Notifications</h3>

                {loading ? (
                    <p className="dashboard-empty">
                        Loading inbox...
                    </p>
                ) : notificationItems.length === 0 ? (
                    <p className="dashboard-empty">
                        Your inbox is clear.
                    </p>
                ) : (
                    <div className="inbox-list">
                        {notificationItems.map(item => {
                            if (item.item_type === "thought") {
                                return (
                                    <div key={item.id} className="thought-note-card">
                                        <div className="thought-note-header">
                                            <span>💭 Thought</span>
                                        </div>

                                        <h3>{item.title}</h3>

                                        {(item.body || item.message) && (
                                            <p>{item.body || item.message}</p>
                                        )}

                                        <div className="thought-note-actions">
                                            <button type="button">
                                                ✓ To-Do
                                            </button>

                                            <button type="button">
                                                📅 Event
                                            </button>

                                            <button type="button">
                                                🔔 Reminder
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleArchiveThought(item)}
                                            >
                                                Archive
                                            </button>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <div
                                    key={item.id}
                                    className={
                                        item.status === "unread"
                                            ? "inbox-item unread"
                                            : "inbox-item"
                                    }
                                >
                                    <div className="inbox-item-icon">
                                        {getInboxIcon(item.item_type)}
                                    </div>

                                    <button
                                        type="button"
                                        className="inbox-item-main"
                                        onClick={() => handleOpenInboxItem(item)}
                                    >
                                        <div className="inbox-item-topline">
                                            <strong>{item.title}</strong>

                                            {item.status === "unread" && (
                                                <span>Unread</span>
                                            )}
                                        </div>

                                        {item.message && (
                                            <p>{item.message}</p>
                                        )}

                                        <small>
                                            {getItemMeta(item)}
                                        </small>
                                    </button>

                                    <div className="inbox-item-actions">
                                        <button
                                            type="button"
                                            className="inbox-item-menu"
                                            onClick={() =>
                                                setSelectedItem(
                                                    selectedItem?.id === item.id
                                                        ? null
                                                        : item
                                                )
                                            }
                                            aria-label="Inbox item actions"
                                        >
                                            ⋯
                                        </button>

                                        {selectedItem?.id === item.id && (
                                            <div className="inbox-inline-menu">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenInboxItem(item)}
                                                >
                                                    Open
                                                </button>

                                                {item.status === "unread" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMarkRead(item)}
                                                    >
                                                        Mark Read
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    className="danger-text"
                                                    onClick={() => handleDeleteItem(item)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
            <section className="card">
                <div className="thoughts-header">
                    <div>
                        <p className="card-kicker">My Thoughts</p>
                        <h3>Capture now. Organize later.</h3>
                    </div>

                    <button
                        type="button"
                        className="thought-capture-button"
                        onClick={() => setShowThoughtCapture(true)}
                    >
                        + Capture
                    </button>
                </div>

                {thoughtItems.length === 0 ? (
                    <p className="dashboard-empty">
                        Nothing on your mind right now.
                    </p>
                ) : (
                    <div className="thought-list-wrapper">
                        <div className="thought-list">
                            {thoughtItems.map(item => {
                                const isEditing = editingThought?.id === item.id

                                return (
                                    <div key={item.id} className="thought-note-card">
                                        <div className="thought-note-header">
                                            💭 Thought
                                        </div>

                                        {isEditing ? (
                                            <>
                                                <div className="thought-capture-form">
                                                    <label>
                                                        Title
                                                        <input
                                                            value={editThoughtTitle}
                                                            onChange={(event) =>
                                                                setEditThoughtTitle(event.target.value)
                                                            }
                                                            autoFocus
                                                        />
                                                    </label>

                                                    <label>
                                                        Notes
                                                        <textarea
                                                            value={editThoughtBody}
                                                            onChange={(event) =>
                                                                setEditThoughtBody(event.target.value)
                                                            }
                                                            placeholder="Add details..."
                                                        />
                                                    </label>
                                                </div>

                                                <div className="thought-note-actions">
                                                    <button
                                                        type="button"
                                                        onClick={saveEditingThought}
                                                        disabled={
                                                            savingThoughtEdit ||
                                                            !editThoughtTitle.trim()
                                                        }
                                                    >
                                                        {savingThoughtEdit ? "Saving..." : "Save"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={cancelEditingThought}
                                                        disabled={savingThoughtEdit}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h3>{item.title}</h3>

                                                {(item.body || item.message) && (
                                                    <p>{item.body || item.message}</p>
                                                )}

                                                <div className="thought-note-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditingThought(item)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleConvertThoughtToTask(item)}
                                                    >
                                                        To-Do
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleScheduleThought(item)}
                                                    >
                                                        Schedule
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleConvertThoughtToReminder(item)}
                                                    >
                                                        Reminder
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleArchiveThought(item)}
                                                    >
                                                        Archive
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </section>

            <ThoughtCaptureSheet
                open={showThoughtCapture}
                onClose={() => setShowThoughtCapture(false)}
                onCreated={refreshInbox}
            />

        </div>
    )
}