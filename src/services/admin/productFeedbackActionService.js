import { supabase } from "../../lib/supabase"
import { addFeedbackHistoryEvent } from "./productFeedbackHistoryService"

export async function updateFeedbackStatus(ticket, nextStatus) {
    if (!ticket?.id) {
        throw new Error("Ticket is required")
    }

    if (!nextStatus) {
        throw new Error("Next status is required")
    }

    const previousStatus = ticket.status

    if (previousStatus === nextStatus) {
        return
    }

    const { error } = await supabase
        .from("product_feedback")
        .update({
            status: nextStatus,
            updated_at: new Date().toISOString(),
            resolved_at:
                nextStatus === "fixed" || nextStatus === "closed"
                    ? new Date().toISOString()
                    : null
        })
        .eq("id", ticket.id)

    if (error) throw error

    await addFeedbackHistoryEvent({
        feedbackId: ticket.id,
        eventType: "status_changed",
        title: "Status Changed",
        description: `Status changed from ${formatStatus(previousStatus)} to ${formatStatus(nextStatus)}.`,
        oldValue: previousStatus,
        newValue: nextStatus,
        visibleToUser: false
    })
}

function formatStatus(status) {
    if (!status) return "Unknown"

    return status
        .replaceAll("_", " ")
        .replace(/\b\w/g, char => char.toUpperCase())
}