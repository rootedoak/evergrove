import { supabase } from "../../lib/supabase"

export async function getBetaHealthUsers() {
    const { data, error } = await supabase
        .from("admin_user_summary")
        .select("*")
        .order("last_active_at", { ascending: false, nullsFirst: false })

    if (error) throw error

    return (data ?? []).map(user => ({
        ...user,
        health: getUserHealth(user)
    }))
}

function getUserHealth(user) {
    if (!user.last_active_at) {
        return {
            status: "dormant",
            label: "Dormant",
            reason: "No tracked activity yet"
        }
    }

    const lastActive = new Date(user.last_active_at)
    const now = new Date()

    const daysInactive = Math.floor(
        (now - lastActive) / (1000 * 60 * 60 * 24)
    )

    const openTickets = Number(user.ticket_count ?? 0)

    if (daysInactive >= 14) {
        return {
            status: "dormant",
            label: "Dormant",
            reason: `${daysInactive} days inactive`
        }
    }

    if (daysInactive >= 7 || openTickets >= 2) {
        return {
            status: "at-risk",
            label: "At Risk",
            reason:
                daysInactive >= 7
                    ? `${daysInactive} days inactive`
                    : `${openTickets} support tickets`
        }
    }

    return {
        status: "healthy",
        label: "Healthy",
        reason: "Recently active"
    }
}