import { useEffect, useState } from "react"
import { getHousehold360 } from "../../services/admin/household360Service"

export default function useHousehold360(householdId) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)

            try {
                const result = await getHousehold360(householdId)

                if (!cancelled) {
                    setData(result)
                }
            } catch (err) {
                console.error("Failed to load Household 360:", err)

                if (!cancelled) {
                    setError(err)
                    setData(null)
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
    }, [householdId])

    return {
        data,
        loading,
        error
    }
}