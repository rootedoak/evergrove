import { useState } from "react"

import usePersonalInbox from "../hooks/usePersonalInbox"
import usePersonalReminders from "../hooks/usePersonalReminders"
import { createPersonalInboxItem } from "../services/personalInboxService"

function getTodayString() {
    const today = new Date()

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-")
}

export default function PersonalInbox() {
    const {
        items,
        loading: inboxLoading,
        refreshInbox,
        markRead,
        removeItem
    } = usePersonalInbox()

    const {
        reminders,
        loading: remindersLoading,
        addReminder,
        removeReminder
    } = usePersonalReminders()

    const [reminderForm, setReminderForm] = useState({
        title: "",
        notes: "",
        frequency: "monthly",
        next_due: getTodayString()
    })

    const [savingReminder, setSavingReminder] = useState(false)

    const unreadCount = items.filter(item => item.status === "unread").length

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

    const loading = inboxLoading || remindersLoading

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
                <div className="section-header">
                    <div>
                        <p className="card-kicker">Inbox</p>
                        <h3>
                            {unreadCount} unread
                        </h3>
                    </div>
                </div>

                {loading ? (
                    <p>Loading inbox...</p>
                ) : items.length === 0 ? (
                    <p className="dashboard-empty">
                        Nothing in your inbox yet.
                    </p>
                ) : (
                    <div className="stack-list">
                        {items.map(item => (
                            <div
                                className={`list-row ${item.status === "unread" ? "unread-row" : ""}`}
                                key={item.id}
                            >
                                <div>
                                    <strong>{item.title}</strong>

                                    {item.message && <p>{item.message}</p>}

                                    <small>
                                        {item.item_type}
                                        {item.due_date ? ` • Due ${item.due_date}` : ""}
                                    </small>
                                </div>

                                <div className="row-actions">
                                    {item.status === "unread" && (
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() => markRead(item.id)}
                                        >
                                            Mark Read
                                        </button>
                                    )}

                                    <button
                                        className="danger-button"
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        Delete
                                    </button>
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
                                        {reminder.next_due ? ` • Next due ${reminder.next_due}` : ""}
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