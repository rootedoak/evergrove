import { useEffect, useState } from "react"
import { getActivities } from "../services/activityService"

export default function useActivities() {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function loadActivities() {
        try {
            setError(null)
            const data = await getActivities()
            setActivities(data)
        } catch (error) {
            console.error(error)
            setError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadActivities()
    }, [])

    return {
        activities,
        loading,
        error,
        refreshActivities: loadActivities
    }
}