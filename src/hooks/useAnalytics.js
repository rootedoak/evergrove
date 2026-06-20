import { useEffect, useState } from "react"
import { getAnalyticsMetrics } from "../services/analyticsService"

export default function useAnalytics(days = 30) {
    const [metrics, setMetrics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        load()
    }, [days])

    async function load() {
        setLoading(true)

        try {
            const data = await getAnalyticsMetrics(days)
            setMetrics(data)
        } finally {
            setLoading(false)
        }
    }

    return {
        metrics,
        loading,
        refresh: load,
    }
}