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

export async function assignFeedbackToMe(ticket) {
    if (!ticket?.id) {
        throw new Error("Ticket is required")
    }

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error("No authenticated user")

    const { error } = await supabase
        .from("product_feedback")
        .update({
            assigned_to: user.id,
            updated_at: new Date().toISOString()
        })
        .eq("id", ticket.id)

    if (error) throw error

    await addFeedbackHistoryEvent({
        feedbackId: ticket.id,
        eventType: "assigned",
        title: "Ticket Assigned",
        description: "Ticket assigned to current admin.",
        oldValue: ticket.assigned_to,
        newValue: user.id,
        visibleToUser: false
    })
}