import { supabase } from "../../lib/supabase"

export async function getProductFeedbackDetail(id) {
    if (!id) {
        throw new Error("Feedback id is required")
    }

    const { data, error } = await supabase
        .from("product_feedback")
        .select(`
        *,
        households (
            id,
            name
        ),
        release_feedback (
            id,
            release_id,
            app_releases (
                id,
                version,
                channel,
                status,
                title
            )
        )
    `)
        .eq("id", id)
        .single()

    if (error) throw error

    return data
}