import { useState } from "react"
import {
    CalendarDays,
    CheckSquare,
    Megaphone,
    Plus,
    ShoppingCart,
    Sparkles,
    Utensils,
    X,
} from "lucide-react"

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
                <div className="eg-bottom-sheet-backdrop" onClick={close}>
                    <div className="eg-bottom-sheet" onClick={event => event.stopPropagation()}>
                        <div className="eg-sheet-handle" />

                        <div className="eg-sheet-header">
                            <div>
                                <h3>Quick Add</h3>
                                <p>Add something to Evergrove</p>
                            </div>

                            <button type="button" className="eg-icon-button" onClick={close}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="eg-quick-action-list">
                            <QuickAction icon={<CheckSquare />} label="To-Do" onClick={() => handleAction(onAddTask)} />
                            <QuickAction icon={<CalendarDays />} label="Calendar Event" onClick={() => handleAction(onAddEvent)} />
                            <QuickAction icon={<Utensils />} label="Meal" onClick={() => handleAction(onAddMeal)} />
                            <QuickAction icon={<ShoppingCart />} label="Shopping Item" onClick={() => handleAction(onAddShopping)} />
                            <QuickAction icon={<Megaphone />} label="Announcement" onClick={() => handleAction(onAddAnnouncement)} />

                            {hasSuggestions && (
                                <button
                                    type="button"
                                    className="eg-quick-action-row assistant"
                                    onClick={() => setShowAssistant(true)}
                                >
                                    <span>
                                        <Sparkles size={22} />
                                    </span>

                                    <div>
                                        <strong>Evergrove Assistant</strong>
                                        <small>Ideas to help your family</small>
                                    </div>

                                    <em>{suggestionCount}</em>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {open && showAssistant && (
                <div className="eg-bottom-sheet-backdrop" onClick={close}>
                    <div className="eg-bottom-sheet" onClick={event => event.stopPropagation()}>
                        <div className="eg-sheet-handle" />

                        <div className="eg-sheet-header">
                            <div>
                                <h3>Evergrove Assistant</h3>
                                <p>Ideas to help your family stay ahead</p>
                            </div>

                            <button type="button" className="eg-icon-button" onClick={close}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="assistant-suggestion-list">
                            {assistantSuggestions.map(suggestion => (
                                <div key={suggestion.id} className="assistant-suggestion-card">
                                    <div className="assistant-suggestion-header">
                                        <span>{suggestion.icon}</span>

                                        <div>
                                            <strong>
                                                {suggestion.name} is in {suggestion.daysAway} days
                                            </strong>

                                            <p>
                                                Families usually start planning around now.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="assistant-task-list">
                                        {suggestion.tasks.map(taskTitle => (
                                            <div key={`${suggestion.id}-${taskTitle}`} className="assistant-task-row">
                                                <span>{taskTitle}</span>

                                                <button
                                                    type="button"
                                                    className="eg-button-secondary"
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
                className="eg-fab"
                aria-label="Open quick actions"
                onClick={() => setOpen(current => !current)}
            >
                {open ? <X size={30} /> : <Plus size={32} />}

                {!open && hasSuggestions && (
                    <span className="fab-assistant-indicator">💡</span>
                )}
            </button>
        </div>
    )
}

function QuickAction({ icon, label, onClick }) {
    return (
        <button type="button" className="eg-quick-action-row" onClick={onClick}>
            <span>{icon}</span>
            <strong>{label}</strong>
        </button>
    )
}