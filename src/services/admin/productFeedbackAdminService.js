import { supabase } from "../../lib/supabase"

export async function getProductFeedback() {
    const { data, error } = await supabase
        .from("product_feedback")
        .select(`
            id,
            ticket_number,
            feedback_type,
            status,
            priority,
            category,
            subject,
            message,
            app_version,
            page_path,
            source,
            created_at,
            attachment_path,
            attachment_name,
            attachment_type,
            attachment_size,
            households (
                id,
                name
            )
        `)
        .order("created_at", { ascending: false })

    if (error) throw error

    return data ?? []
}

export async function getProductFeedbackDetail(id) {
    if (!id) {
        throw new Error("Feedback id is required")
    }

    const { data, error } = await supabase
        .from("product_feedback")
        .select(`
            id,
            ticket_number,
            household_id,
            user_id,
            feedback_type,
            status,
            priority,
            assigned_to,
            category,
            subject,
            message,
            app_version,
            page_path,
            source,
            attachment_path,
            attachment_name,
            attachment_type,
            attachment_size,
            created_at,
            updated_at,
            households (
                id,
                name
            ),
            release_feedback (
                app_releases (
                    id,
                    version,
                    channel,
                    status
                )
            )
        `)
        .eq("id", id)
        .single()

    if (error) throw error

    return data
}

export async function getFeedbackAttachmentUrl(path) {
    if (!path) return null

    const { data, error } = await supabase.storage
        .from("feedback-attachments")
        .createSignedUrl(path, 60 * 10)

    if (error) throw error

    return data?.signedUrl ?? null
}

export async function createProductFeedback({
    subject,
    message,
    feedbackType = "bug",
    priority = "normal",
    category = "product",
    status = "new",
    householdId = null,
    userId = null,
    appVersion = null,
    pagePath = null
}) {
    const normalizedSubject = subject?.trim()
    const normalizedMessage = message?.trim()

    if (!normalizedSubject) {
        throw new Error("Subject is required")
    }

    if (!normalizedMessage) {
        throw new Error("Description is required")
    }

    const { data, error } = await supabase
        .from("product_feedback")
        .insert({
            subject: normalizedSubject,
            message: normalizedMessage,
            feedback_type: feedbackType,
            priority,
            category,
            status,
            household_id: householdId || null,
            user_id: userId || null,
            app_version: appVersion || null,
            page_path: pagePath || null,
            source: "internal"
        })
        .select(`
            id,
            ticket_number
        `)
        .single()

    if (error) throw error

    return data
}

export function formatTicketNumber(ticketNumber) {
    if (!ticketNumber) return "EG-??????"

    return `EG-${String(ticketNumber).padStart(6, "0")}`
}