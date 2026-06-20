import { useState } from "react"

export default function FloatingQuickActions({
    onAddTask,
    onAddEvent,
    onAddMeal,
    onAddShopping,
    onAddAnnouncement,
}) {
    const [open, setOpen] = useState(false)

    function close() {
        setOpen(false)
    }

    function handleAction(callback) {
        close()
        callback?.()
    }

    return (
        <>
            {open && (
                <div
                    className="fab-backdrop"
                    onClick={close}
                />
            )}

            {open && (
                <div className="fab-sheet">
                    <div className="fab-sheet-handle" />

                    <div className="fab-sheet-header">
                        <h3>Quick Add</h3>
                        <p>What would you like to add?</p>
                    </div>

                    <div className="fab-action-list">
                        <button type="button" onClick={() => handleAction(onAddTask)}>
                            <span>✅</span>
                            <strong>To-Do</strong>
                        </button>

                        <button type="button" onClick={() => handleAction(onAddEvent)}>
                            <span>📅</span>
                            <strong>Event</strong>
                        </button>

                        <button type="button" onClick={() => handleAction(onAddMeal)}>
                            <span>🍽️</span>
                            <strong>Meal</strong>
                        </button>

                        <button type="button" onClick={() => handleAction(onAddShopping)}>
                            <span>🛒</span>
                            <strong>Shopping</strong>
                        </button>

                        <button type="button" onClick={() => handleAction(onAddAnnouncement)}>
                            <span>📢</span>
                            <strong>Announcement</strong>
                        </button>
                    </div>
                </div>
            )}

            <button
                type="button"
                className={open ? "floating-action-button open" : "floating-action-button"}
                aria-label="Open quick actions"
                onClick={() => setOpen(current => !current)}
            >
                ✚
            </button>
        </>
    )
}