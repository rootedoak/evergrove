import { supabase } from "../../lib/supabase"

export async function sendMorningBriefToUser(userId) {
    if (!userId) {
        throw new Error("userId is required")
    }

    const {
        data: { session },
        error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) throw sessionError
    if (!session?.access_token) {
        throw new Error("No active admin session.")
    }

    const response = await fetch("/api/admin/send-user-morning-brief", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
            userId
        })
    })

    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
        throw new Error(result.error || "Unable to send morning brief.")
    }

    return result
}