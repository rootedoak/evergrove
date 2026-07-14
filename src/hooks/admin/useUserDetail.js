import { useEffect, useState } from "react"

import {
    getUserAdoptionEvents,
    getUserDetail,
    getUserLaunchModeStatus,
    getUserLegalStatus,
    getUserPreferences,
    getUserPushStatus,
    getUserSupportTickets,
    getUserUsageEvents
} from "../../services/admin/userAdminService"

export default function useUserDetail(userId) {
    const [adoptionEvents, setAdoptionEvents] = useState([])

    const [user, setUser] = useState(null)
    const [tickets, setTickets] = useState([])
    const [events, setEvents] = useState([])
    const [preferences, setPreferences] = useState(null)
    const [pushStatus, setPushStatus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [launchMode, setLaunchMode] = useState(null)

    const [legal, setLegal] = useState(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            if (!userId) return

            setLoading(true)
            setError(null)

            try {
                const [
                    userData,
                    preferenceData,
                    ticketData,
                    eventData,
                    adoptionData,
                    legalData,
                    pushData,
                    launchModeData
                ] = await Promise.all([
                    getUserDetail(userId),
                    getUserPreferences(userId),
                    getUserSupportTickets(userId),
                    getUserUsageEvents(userId),
                    getUserAdoptionEvents(userId),
                    getUserLegalStatus(userId),
                    getUserPushStatus(userId),
                    getUserLaunchModeStatus(userId)
                ])

                if (!cancelled) {
                    setUser(userData)
                    setPreferences(preferenceData)
                    setTickets(ticketData)
                    setEvents(eventData)
                    setAdoptionEvents(adoptionData)
                    setLegal(legalData)
                    setPushStatus(pushData)
                    setLaunchMode(launchModeData)
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
                    setPushStatus(null)
                    setLaunchMode(null)
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
        adoptionEvents,
        legal,
        pushStatus,
        launchMode,
        loading,
        error
    }
}