import { useState } from "react"

export default function FloatingQuickActions({
    assistantSuggestions = [],
    onAddAssistantTask,
    onAddTask,
    onAddEvent,
    onAddMeal,
    onAddShopping,
    onAddAnnouncement,
}) {
    const [open, setOpen] = useState(false)
    const [showAssistant, setShowAssistant] = useState(false)

    const hasSuggestions = assistantSuggestions.length > 0
    const suggestionCount = assistantSuggestions.reduce(
        (count, suggestion) => count + suggestion.tasks.length,
        0
    )

    function close() {
        setOpen(false)
        setShowAssistant(false)
    }

    function handleAction(callback) {
        close()
        callback?.()
    }

    async function handleAddAssistantTask(taskTitle) {
        await onAddAssistantTask?.(taskTitle)
    }

    return (
        <div className="dashboard-fab-wrapper">
            {open && !showAssistant && (
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

                        {hasSuggestions && (
                            <button
                                type="button"
                                className="quick-action-assistant"
                                onClick={() => setShowAssistant(true)}
                            >
                                <span className="assistant-menu-icon">💡</span>

                                <div>
                                    <strong>Evergrove Assistant</strong>
                                    <small>Ideas to help your family</small>
                                </div>

                                <em>{suggestionCount}</em>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {open && showAssistant && (
                <div
                    className="dashboard-fab-menu-backdrop"
                    onClick={close}
                >
                    <div
                        className="assistant-bottom-sheet"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="sheet-handle" />

                        <div className="assistant-sheet-header">
                            <div>
                                <p className="card-kicker">💡 Evergrove Assistant</p>
                                <h3>Ideas to help your family stay ahead</h3>
                            </div>

                            <button
                                type="button"
                                className="assistant-sheet-close"
                                onClick={close}
                                aria-label="Close assistant"
                            >
                                ×
                            </button>
                        </div>

                        <div className="assistant-suggestion-list">
                            {assistantSuggestions.map(suggestion => (
                                <div
                                    key={suggestion.id}
                                    className="assistant-suggestion-card"
                                >
                                    <div className="assistant-suggestion-header">
                                        <span>{suggestion.icon}</span>

                                        <div>
                                            <strong>
                                                {suggestion.name} is in {suggestion.daysAway} days
                                            </strong>

                                            <p>
                                                Families usually start planning around now.
                                                Evergrove has a few ideas to help you get ready.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="assistant-task-list">
                                        {suggestion.tasks.map(taskTitle => (
                                            <div
                                                key={`${suggestion.id}-${taskTitle}`}
                                                className="assistant-task-row"
                                            >
                                                <span>{taskTitle}</span>

                                                <button
                                                    type="button"
                                                    className="secondary-button"
                                                    onClick={() => handleAddAssistantTask(taskTitle)}
                                                >
                                                    Add To-Do
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
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

                {!open && hasSuggestions && (
                    <span className="fab-assistant-indicator">💡</span>
                )}
            </button>
        </div>
    )
}