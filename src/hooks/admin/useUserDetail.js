import { useEffect, useState } from "react"

import {
    getUserDetail,
    getUserPreferences,
    getUserSupportTickets,
    getUserUsageEvents,
    getUserAdoptionEvents,
    getUserLegalStatus
} from "../../services/admin/userAdminService"

export default function useUserDetail(userId) {
    const [adoptionEvents, setAdoptionEvents] = useState([])

    const [user, setUser] = useState(null)
    const [tickets, setTickets] = useState([])
    const [events, setEvents] = useState([])
    const [preferences, setPreferences] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [legal, setLegal] = useState(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            if (!userId) return

            setLoading(true)
            setError(null)

            try {
                const [
                    userDetail,
                    userPreferences,
                    supportTickets,
                    usageEvents,
                    userAdoptionEvents,
                    userLegalStatus
                ] = await Promise.all([
                    getUserDetail(userId),
                    getUserPreferences(userId),
                    getUserSupportTickets(userId),
                    getUserUsageEvents(userId),
                    getUserAdoptionEvents(userId),
                    getUserLegalStatus(userId)
                ])

                if (!cancelled) {
                    setUser(userDetail)
                    setPreferences(userPreferences)
                    setTickets(supportTickets)
                    setEvents(usageEvents)
                    setAdoptionEvents(userAdoptionEvents)
                    setLegal(userLegalStatus)
                }
            } catch (err) {
                console.error("Failed to load user detail:", err)

                if (!cancelled) {
                    setError(err)
                    setUser(null)
                    setPreferences(null)
                    setTickets([])
                    setEvents([])
                    setAdoptionEvents([])
                    setLegal(null)
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
        preferences,
        tickets,
        events,
        legal,
        loading,
        adoptionEvents,
        error
    }
}