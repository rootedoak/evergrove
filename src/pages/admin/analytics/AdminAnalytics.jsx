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

            <section className="admin-grid admin-grid-4">

                <AnalyticsKpiCard
                    title="Active Households"
                    value={analytics.kpis?.activeHouseholds?.value ?? 0}
                    trend={`${analytics.kpis?.activeHouseholds?.change ?? 0}%`}
                    trendDirection={
                        analytics.kpis?.activeHouseholds?.direction
                    }
                    subtitle={`vs previous ${days} days`}
                />

                <AnalyticsKpiCard
                    title="Usage Events"
                    value={analytics.kpis?.events?.value ?? 0}
                    trend={`${analytics.kpis?.events?.change ?? 0}%`}
                    trendDirection={
                        analytics.kpis?.events?.direction
                    }
                    subtitle={`vs previous ${days} days`}
                />

                <AnalyticsKpiCard
                    title="Open Tickets"
                    value={analytics.supportMetrics?.openTickets ?? 0}
                    subtitle="Support queue"
                />

                <AnalyticsKpiCard
                    title="Tracked Features"
                    value={analytics.featureUsage.length}
                    subtitle="Receiving usage events"
                />

            </section>

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

            </section>

            <AnalyticsLineChart
                title="Daily Active Households"
                description="Households with recorded activity over the last 14 days."
                data={analytics.dailyActiveHouseholds}
                xKey="date"
                yKey="activeHouseholds"
            />

        </div>
    )
}