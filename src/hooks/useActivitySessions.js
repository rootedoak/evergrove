import { useEffect, useState } from "react"
import { getActivitySessions } from "../services/activitySessionService"

export default function useActivitySessions() {
    const [activitySessions, setActivitySessions] = useState([])
    const [loading, setLoading] = useState(true)

    async function refreshActivitySessions() {
        try {
            const data = await getActivitySessions()
            setActivitySessions(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshActivitySessions()
    }, [])

    return {
        activitySessions,
        loading,
        refreshActivitySessions
    }
}