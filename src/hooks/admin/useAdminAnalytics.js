import { useEffect, useState } from "react"

import {
    generateAnalyticsInsights,
    getDailyActiveHouseholds,
    getDailyAppSessions,
    getDashboardKpis,
    getEngagementMetrics,
    getFeatureUsage,
    getOnboardingMetrics,
    getSupportMetrics
} from "../../services/admin/analyticsService"

export default function useAdminAnalytics(days = 30) {
    const [analytics, setAnalytics] = useState({
        kpis: null,
        featureUsage: [],
        dailyActiveHouseholds: [],
        dailyAppSessions: [],
        engagement: null,
        supportMetrics: null,
        insights: [],
        getOnboardingMetrics,
        onboarding: null
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
                onboarding,
                featureUsage,
                dailyActiveHouseholds,
                dailyAppSessions,
                supportMetrics
            ] = await Promise.all([
                getDashboardKpis({ days }),
                getEngagementMetrics(),
                getOnboardingMetrics(),
                getFeatureUsage({ days }),
                getDailyActiveHouseholds({ days }),
                getDailyAppSessions({ days }),
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
                dailyAppSessions,
                onboarding,
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