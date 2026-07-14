import { useEffect, useState } from "react"

import {
    generateAnalyticsInsights,
    getDailyActiveHouseholds,
    getDailyAppSessions,
    getDashboardKpis,
    getEngagementMetrics,
    getFeatureUsage,
    getHouseholdGrowth,
    getLaunchModeMetrics,
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
        onboarding: null,
        householdGrowth: []
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
                dailyAppSessions,
                dailyActiveHouseholds,
                householdGrowth,
                supportMetrics,
                engagement,
                onboarding,
                launchMode
            ] = await Promise.all([
                getDashboardKpis({ days }),
                getFeatureUsage({ days }),
                getDailyAppSessions({ days }),
                getDailyActiveHouseholds({ days }),
                getHouseholdGrowth({ days }),
                getSupportMetrics({ days }),
                getEngagementMetrics(),
                getOnboardingMetrics(),
                getLaunchModeMetrics({ days })
            ])

            const insights = generateAnalyticsInsights({
                featureUsage,
                dailyActiveHouseholds,
                supportMetrics
            })

            setAnalytics({
                kpis,
                featureUsage,
                dailyAppSessions,
                dailyActiveHouseholds,
                householdGrowth,
                supportMetrics,
                engagement,
                onboarding,
                launchMode,
                insights: generateAnalyticsInsights({
                    featureUsage,
                    supportMetrics,
                    dailyActiveHouseholds
                })
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