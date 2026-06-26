import { useState } from "react"
import { useNavigate } from "react-router-dom"

import usePersonalInbox from "../hooks/usePersonalInbox"
import usePersonalReminders from "../hooks/usePersonalReminders"

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
        markRead,
        removeItem
    } = usePersonalInbox()

    const {
        reminders,
        loading: remindersLoading,
        addReminder,
        removeReminder
    } = usePersonalReminders()

    const [selectedItem, setSelectedItem] = useState(null)
    const [savingReminder, setSavingReminder] = useState(false)

    const [reminderForm, setReminderForm] = useState({
        title: "",
        notes: "",
        frequency: "monthly",
        next_due: getTodayString()
    })

    const unreadCount = items.filter(item => item.status === "unread").length
    const loading = inboxLoading || remindersLoading

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
                <p className="card-kicker">Inbox</p>
                <h3>
                    {unreadCount === 1
                        ? "1 unread"
                        : `${unreadCount} unread`}
                </h3>

                {loading ? (
                    <p className="dashboard-empty">
                        Loading inbox...
                    </p>
                ) : items.length === 0 ? (
                    <p className="dashboard-empty">
                        Your inbox is clear.
                    </p>
                ) : (
                    <div className="inbox-list">
                        {items.map(item => (
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
                        ))}
                    </div>
                )}
            </section>

            <section className="card form-card">
                <p className="card-kicker">Custom Reminder</p>
                <h3>Add Personal Reminder</h3>

                <form onSubmit={handleCreateReminder}>
                    <div className="form-grid">
                        <label>
                            Reminder
                            <input
                                required
                                value={reminderForm.title}
                                onChange={event =>
                                    setReminderForm({
                                        ...reminderForm,
                                        title: event.target.value
                                    })
                                }
                                placeholder="Do something nice for someone"
                            />
                        </label>

                        <label>
                            Frequency
                            <select
                                value={reminderForm.frequency}
                                onChange={event =>
                                    setReminderForm({
                                        ...reminderForm,
                                        frequency: event.target.value
                                    })
                                }
                            >
                                <option value="once">Once</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </label>

                        <label>
                            Next Due
                            <input
                                type="date"
                                value={reminderForm.next_due}
                                onChange={event =>
                                    setReminderForm({
                                        ...reminderForm,
                                        next_due: event.target.value
                                    })
                                }
                            />
                        </label>

                        <label className="full-width">
                            Notes
                            <textarea
                                rows="3"
                                value={reminderForm.notes}
                                onChange={event =>
                                    setReminderForm({
                                        ...reminderForm,
                                        notes: event.target.value
                                    })
                                }
                            />
                        </label>

                        <button
                            className="primary-button full-width"
                            type="submit"
                            disabled={savingReminder}
                        >
                            {savingReminder ? "Saving..." : "Save Reminder"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="card">
                <p className="card-kicker">Active Reminders</p>
                <h3>My Reminder Rules</h3>

                {reminders.length === 0 ? (
                    <p className="dashboard-empty">
                        No personal reminders yet.
                    </p>
                ) : (
                    <div className="stack-list">
                        {reminders.map(reminder => (
                            <div className="list-row" key={reminder.id}>
                                <div>
                                    <strong>{reminder.title}</strong>

                                    {reminder.notes && <p>{reminder.notes}</p>}

                                    <small>
                                        {reminder.frequency}
                                        {reminder.next_due
                                            ? ` • Next due ${reminder.next_due}`
                                            : ""}
                                    </small>
                                </div>

                                <button
                                    className="danger-button"
                                    type="button"
                                    onClick={() => removeReminder(reminder.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}