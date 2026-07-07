import { useEffect, useState } from "react"

import {
    generateAnalyticsInsights,
    getDailyActiveHouseholds,
    getDashboardKpis,
    getFeatureUsage,
    getSupportMetrics
} from "../../services/admin/analyticsService"

export default function useAdminAnalytics(days = 30) {
    const [analytics, setAnalytics] = useState({
        kpis: null,
        featureUsage: [],
        dailyActiveHouseholds: [],
        supportMetrics: null,
        insights: []
    })

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function refreshAnalytics() {
        setLoading(true)
        setError(null)

        try {
            const [
                kpis,
                featureUsage,
                dailyActiveHouseholds,
                supportMetrics
            ] = await Promise.all([
                getDashboardKpis({ days }),
                getFeatureUsage({ days }),
                getDailyActiveHouseholds({ days }),
                getSupportMetrics({ days })
            ])

            const insights = generateAnalyticsInsights({
                featureUsage,
                dailyActiveHouseholds,
                supportMetrics
            })

            setAnalytics({
                kpis,
                featureUsage,
                dailyActiveHouseholds,
                supportMetrics,
                insights
            })
        } catch (err) {
            console.error("Failed to load admin analytics:", err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshAnalytics()
    }, [days])

    return {
        analytics,
        loading,
        error,
        refreshAnalytics
    }
}