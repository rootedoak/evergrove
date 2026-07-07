import { useEffect, useState } from "react"

import {
    generateAnalyticsInsights,
    getDailyActiveHouseholds,
    getDashboardKpis,
    getEngagementMetrics,
    getFeatureUsage,
    getSupportMetrics
} from "../../services/admin/analyticsService"

export default function useAdminAnalytics(days = 30) {
    const [analytics, setAnalytics] = useState({
        kpis: null,
        featureUsage: [],
        dailyActiveHouseholds: [],
        engagement: null,
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
                engagement,
                featureUsage,
                dailyActiveHouseholds,
                supportMetrics
            ] = await Promise.all([
                getDashboardKpis({ days }),
                getEngagementMetrics(),
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
                engagement,
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