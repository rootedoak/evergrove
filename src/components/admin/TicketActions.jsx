import Button from "../ui/Button"
import { updateFeedbackStatus } from "../../services/admin/productFeedbackActionService"

export default function TicketActions({ ticket, onStatusChanged }) {
    async function changeStatus(nextStatus) {
        try {
            await updateFeedbackStatus(ticket, nextStatus)

            onStatusChanged?.()
        } catch (error) {
            console.error(error)
            alert(error.message)
        }
    }

    return (
        <div className="admin-ticket-actions">
            <Button
                size="sm"
                onClick={() => changeStatus("reviewing")}
            >
                Review
            </Button>

            <Button
                size="sm"
                variant="secondary"
                onClick={() => changeStatus("planned")}
            >
                Plan
            </Button>

            <Button
                size="sm"
                onClick={() => changeStatus("fixed")}
            >
                Mark Fixed
            </Button>

            <Button
                size="sm"
                variant="ghost"
                onClick={() => changeStatus("closed")}
            >
                Close
            </Button>
        </div>
    )
}