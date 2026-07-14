import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatCard from "../../../components/admin/AdminStatCard"

import useAdminAnalytics from "../../../hooks/admin/useAdminAnalytics"

import AnalyticsBarChart from "../../../components/admin/analytics/AnalyticsBarChart"
import AnalyticsLineChart from "../../../components/admin/analytics/AnalyticsLineChart"

import AnalyticsInsightCard from "../../../components/admin/dashboard/AnalyticsInsightCard"

import { useState } from "react"
import AnalyticsTimeFilter from "../../../components/admin/dashboard/AnalyticsTimeFilter"
import AnalyticsKpiCard from "../../../components/admin/dashboard/AnalyticsKpiCard"

export default function Analytics() {
    const [days, setDays] = useState(30)

    const { analytics, loading } = useAdminAnalytics(days)

    if (loading) {
        return (
            <div className="admin-page">
                <AdminEmptyState>
                    Loading analytics...
                </AdminEmptyState>
            </div>
        )
    }

    const support = analytics.supportMetrics

    return (
        <div className="admin-page">

            <AdminPageHeader
                eyebrow="Insights"
                title="Analytics"
                description="Understand how households are using Evergrove."
                actions={
                    <AnalyticsTimeFilter
                        value={days}
                        onChange={setDays}
                    />
                }
            />

            <section className="admin-grid admin-grid-3">
                <AnalyticsKpiCard
                    title="App Sessions"
                    value={analytics.engagement?.sessions ?? 0}
                    subtitle="Last 30 days"
                    icon="sessions"
                />

                <AnalyticsKpiCard
                    title="DAU"
                    value={analytics.engagement?.dau ?? 0}
                    subtitle="Active users today"
                    icon="dau"
                />

                <AnalyticsKpiCard
                    title="WAU"
                    value={analytics.engagement?.wau ?? 0}
                    subtitle="Active users in 7 days"
                    icon="wau"
                />

                <AnalyticsKpiCard
                    title="MAU"
                    value={analytics.engagement?.mau ?? 0}
                    subtitle="Active users in 30 days"
                    icon="mau"
                />

                <AnalyticsKpiCard
                    title="Sessions / User"
                    value={analytics.engagement?.sessionsPerActiveUser ?? 0}
                    subtitle="Last 30 days"
                    icon="sessionsPerUser"
                />

                <AnalyticsKpiCard
                    title="Active Days / Week"
                    value={analytics.engagement?.averageActiveDaysPerWeek ?? 0}
                    subtitle="Average per active user"
                    icon="activeDays"
                />

                <AnalyticsKpiCard
                    title="Onboarding"
                    value={`${analytics.onboarding?.onboardingRate ?? 0}%`}
                    subtitle={`${analytics.onboarding?.onboardingCompleted ?? 0} of ${analytics.onboarding?.totalUsers ?? 0} users`}
                    icon="dau"
                />

                <AnalyticsKpiCard
                    title="Walkthrough"
                    value={`${analytics.onboarding?.walkthroughRate ?? 0}%`}
                    subtitle={`${analytics.onboarding?.walkthroughCompleted ?? 0} of ${analytics.onboarding?.totalUsers ?? 0} users`}
                    icon="activeDays"
                />

            </section>

            <AdminCard title="Launch Mode">
                {!analytics.launchMode ? (
                    <AdminEmptyState>
                        No launch-mode data available.
                    </AdminEmptyState>
                ) : (
                    <>
                        <div className="admin-simple-list">
                            <div className="admin-simple-row">
                                <span>Installed app</span>

                                <strong>
                                    {
                                        analytics.launchMode
                                            .installedPwaSessions
                                    }
                                </strong>
                            </div>

                            <div className="admin-simple-row">
                                <span>Browser</span>

                                <strong>
                                    {
                                        analytics.launchMode
                                            .browserSessions
                                    }
                                </strong>
                            </div>

                            <div className="admin-simple-row">
                                <span>Unknown</span>

                                <strong>
                                    {
                                        analytics.launchMode
                                            .unknownSessions
                                    }
                                </strong>
                            </div>
                        </div>

                        <div className="admin-card-footnote">
                            Installed app usage:{" "}
                            <strong>
                                {analytics.launchMode.pwaRate}%
                            </strong>
                            {" "}
                            of classified sessions
                        </div>
                    </>
                )}
            </AdminCard>

            <AnalyticsLineChart
                title="New Households"
                description="Households created each day in the selected period."
                data={analytics.householdGrowth}
                xKey="date"
                yKey="households"
            />

            <section className="admin-grid admin-grid-2">
                {analytics.insights.map((insight, index) => (
                    <AnalyticsInsightCard
                        key={index}
                        tone={insight.tone}
                        title={insight.title}
                        description={insight.description}
                        footer={insight.footer}
                    />
                ))}
            </section>

            <section className="admin-grid admin-grid-2">

                <AnalyticsBarChart
                    title="Feature Adoption"
                    description="Usage events by feature over the last 30 days."
                    data={analytics.featureUsage}
                    xKey="feature"
                    yKey="count"
                />

                <AdminCard title="Support Health">

                    {!support ? (
                        <AdminEmptyState>
                            No support data.
                        </AdminEmptyState>
                    ) : (
                        <div className="admin-simple-list">

                            <div className="admin-simple-row">
                                <span>Open</span>

                                <strong>
                                    {support.byStatus.open ?? 0}
                                </strong>
                            </div>

                            <div className="admin-simple-row">
                                <span>Resolved</span>

                                <strong>
                                    {support.byStatus.resolved ?? 0}
                                </strong>
                            </div>

                            <div className="admin-simple-row">
                                <span>Feature Requests</span>

                                <strong>
                                    {support.byType.feature ?? 0}
                                </strong>
                            </div>

                            <div className="admin-simple-row">
                                <span>Bugs</span>

                                <strong>
                                    {support.byType.bug ?? 0}
                                </strong>
                            </div>

                        </div>
                    )}

                </AdminCard>

                <AnalyticsBarChart
                    title="Feature Adoption %"
                    description="Percent of active households using each feature in the selected period."
                    data={analytics.featureUsage}
                    xKey="feature"
                    yKey="adoption"
                />

            </section>

            <AnalyticsLineChart
                title="Daily Active Households"
                description="Households with recorded activity over the last 14 days."
                data={analytics.dailyActiveHouseholds}
                xKey="date"
                yKey="activeHouseholds"
            />

            <AnalyticsLineChart
                title="Daily App Sessions"
                description="How many times users opened Evergrove each day."
                data={analytics.dailyAppSessions}
                xKey="date"
                yKey="sessions"
            />

        </div>
    )
}