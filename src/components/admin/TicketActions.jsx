import Button from "../ui/Button"
import { updateFeedbackStatus } from "../../services/admin/productFeedbackActionService"

const statusActions = {
    new: [
        { label: "Review", status: "reviewing" }
    ],

    reviewing: [
        { label: "Plan", status: "planned", variant: "secondary" },
        { label: "Mark Fixed", status: "fixed" }
    ],

    planned: [
        { label: "Mark Fixed", status: "fixed" }
    ],

    fixed: [
        { label: "Close", status: "closed", variant: "secondary" }
    ],

    closed: [
        { label: "Reopen", status: "reviewing" }
    ]
}

export default function TicketActions({
    ticket,
    onStatusChanged
}) {
    const actions = statusActions[ticket?.status] || []

    async function handleStatusChange(nextStatus) {
        try {
            await updateFeedbackStatus(ticket, nextStatus)
            await onStatusChanged?.()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not update ticket.")
        }
    }

    if (!actions.length) {
        return null
    }

    return (
        <div className="admin-ticket-actions">
            {actions.map(action => (
                <Button
                    key={action.status}
                    size="sm"
                    variant={action.variant}
                    onClick={() => handleStatusChange(action.status)}
                >
                    {action.label}
                </Button>
            ))}
        </div>
    )
}