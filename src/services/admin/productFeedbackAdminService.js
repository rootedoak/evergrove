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
            households (
                id,
                name
            )
        `)
        .order("created_at", { ascending: false })

    if (error) throw error

    return data ?? []
}

export function formatTicketNumber(ticketNumber) {
    if (!ticketNumber) return "EG-??????"

    return `EG-${String(ticketNumber).padStart(6, "0")}`
}