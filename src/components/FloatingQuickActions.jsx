import { useState } from "react"
import {
    CalendarDays,
    CheckSquare,
    Megaphone,
    Plus,
    ShoppingCart,
    Utensils,
    X,
} from "lucide-react"

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