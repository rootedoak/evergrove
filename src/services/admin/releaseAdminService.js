import { supabase } from "../../lib/supabase"

export async function getReleases() {
    const { data, error } = await supabase
        .from("app_releases")
        .select(`
            *,
            release_feedback (
                id
            )
        `)
        .order("created_at", { ascending: false })

    if (error) throw error

    return (data ?? []).map(release => ({
        ...release,
        ticketCount: release.release_feedback?.length ?? 0
    }))
}

export async function updateRelease(id, updates) {
    const { data, error } = await supabase
        .from("app_releases")
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function publishRelease(id) {
    return updateRelease(id, {
        status: "published",
        published_at: new Date().toISOString()
    })
}

export async function getReleaseTickets(releaseId) {
    const { data, error } = await supabase
        .from("release_feedback")
        .select(`
            id,
            feedback_id,
            product_feedback (
                id,
                ticket_number,
                subject,
                message,
                feedback_type,
                status,
                priority,
                created_at
            )
        `)
        .eq("release_id", releaseId)

    if (error) throw error

    return (data ?? [])
        .map(row => row.product_feedback)
        .filter(Boolean)
        .sort((a, b) => Number(a.ticket_number) - Number(b.ticket_number))
}

export async function getRelease(id) {
    const { data, error } = await supabase
        .from("app_releases")
        .select("*")
        .eq("id", id)
        .single()

    if (error) throw error

    return data
}