import { useCallback, useEffect, useState } from "react"
import { getHousehold360 } from "../../services/admin/household360Service"

export default function useHousehold360(householdId) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refresh = useCallback(async () => {
        if (!householdId) return

        setLoading(true)
        setError(null)

        try {
            const result = await getHousehold360(householdId)
            setData(result)
        } catch (err) {
            console.error("Failed to load Household 360:", err)
            setError(err)
            setData(null)
        } finally {
            setLoading(false)
        }
    }, [householdId])

    useEffect(() => {
        refresh()
    }, [refresh])

    return {
        data,
        loading,
        error,
        refresh
    }
}