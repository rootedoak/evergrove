import { useEffect, useState } from "react"
import { getPreferences } from "../services/preferenceService"

export default function usePreferences() {
    const [preferences, setPreferences] = useState(null)
    const [loading, setLoading] = useState(true)

    async function refreshPreferences() {
        try {
            const data = await getPreferences()
            setPreferences(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshPreferences()
    }, [])

    return {
        preferences,
        loading,
        refreshPreferences
    }
}