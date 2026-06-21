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
        <div className="dashboard-fab-wrapper">
            {open && (
                <div
                    className="dashboard-fab-menu-backdrop"
                    onClick={close}
                >
                    <div
                        className="dashboard-fab-menu"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => handleAction(onAddTask)}
                        >
                            <span>✅</span>
                            To-Do
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAction(onAddEvent)}
                        >
                            <span>📅</span>
                            Calendar Event
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAction(onAddMeal)}
                        >
                            <span>🍽️</span>
                            Meal
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAction(onAddShopping)}
                        >
                            <span>🛒</span>
                            Shopping Item
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAction(onAddAnnouncement)}
                        >
                            <span>📢</span>
                            Announcement
                        </button>
                    </div>
                </div>
            )}

            <button
                type="button"
                className="floating-action-button"
                aria-label="Open quick actions"
                onClick={() => setOpen(current => !current)}
            >
                {open ? "×" : "+"}
            </button>
        </div>
    )
}