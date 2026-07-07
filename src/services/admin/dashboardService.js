import { supabase } from "../../lib/supabase"

export async function getRecentSupportTickets(limit = 5) {
    const { data, error } = await supabase
        .from("product_feedback")
        .select(`
            id,
            ticket_number,
            subject,
            status,
            priority,
            created_at
        `)
        .order("created_at", { ascending: false })
        .limit(limit)

    if (error) throw error

    return data || []
}

export async function getUpcomingReleases(limit = 3) {
    const { data, error } = await supabase
        .from("app_releases")
        .select(`
            id,
            version,
            title,
            status,
            release_feedback (
                feedback_id
            )
        `)
        .order("created_at", { ascending: false })
        .limit(limit)

    if (error) throw error

    return (data || []).map(release => ({
        ...release,
        ticketCount: release.release_feedback?.length ?? 0
    }))
}