import { supabase } from "../../lib/supabase"

import { createPersonalInboxItem } from "../personalInboxService"
import { formatTicketNumber } from "./productFeedbackAdminService"

export async function getFeedbackMessages(feedbackId) {
    if (!feedbackId) {
        throw new Error("Feedback id is required")
    }

    const { data, error } = await supabase
        .from("product_feedback_messages")
        .select("*")
        .eq("feedback_id", feedbackId)
        .order("created_at", { ascending: true })

    if (error) throw error

    return data ?? []
}

export async function addFeedbackMessage({
    feedbackId,
    message,
    visibleToUser = false
}) {
    if (!feedbackId) {
        throw new Error("Feedback id is required")
    }

    if (!message?.trim()) {
        throw new Error("Message is required")
    }

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error("No authenticated user")

    const { data: ticket, error: ticketError } = await supabase
        .from("product_feedback")
        .select(`
            id,
            ticket_number,
            household_id,
            user_id,
            subject,
            message
        `)
        .eq("id", feedbackId)
        .single()

    if (ticketError) throw ticketError

    const { error } = await supabase
        .from("product_feedback_messages")
        .insert({
            feedback_id: feedbackId,
            author_id: user.id,
            message: message.trim(),
            visible_to_user: visibleToUser
        })

    if (error) throw error

    if (visibleToUser && ticket?.user_id) {
        const ticketLabel = formatTicketNumber(ticket.ticket_number)

        await createPersonalInboxItem({
            household_id: ticket.household_id,
            user_id: ticket.user_id,
            item_type: "support",
            title: `Evergrove Support Update ${ticketLabel}`,
            message: message.trim(),
            related_type: "product_feedback",
            related_id: ticket.id
        })
    }
}