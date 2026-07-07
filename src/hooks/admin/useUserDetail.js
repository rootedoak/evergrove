import { useEffect, useState } from "react"

import {
    getUserDetail,
    getUserSupportTickets,
    getUserUsageEvents
} from "../../services/admin/userAdminService"

export default function useUserDetail(userId) {
    const [user, setUser] = useState(null)
    const [tickets, setTickets] = useState([])
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            if (!userId) return

            setLoading(true)
            setError(null)

            try {
                const [
                    userDetail,
                    supportTickets,
                    usageEvents
                ] = await Promise.all([
                    getUserDetail(userId),
                    getUserSupportTickets(userId),
                    getUserUsageEvents(userId)
                ])

                if (!cancelled) {
                    setUser(userDetail)
                    setTickets(supportTickets)
                    setEvents(usageEvents)
                }
            } catch (err) {
                console.error("Failed to load user detail:", err)

                if (!cancelled) {
                    setError(err)
                    setUser(null)
                    setTickets([])
                    setEvents([])
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        load()

        return () => {
            cancelled = true
        }
    }, [userId])

    return {
        user,
        tickets,
        events,
        loading,
        error
    }
}