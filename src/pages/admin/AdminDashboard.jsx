import { useState } from "react"

import "../../styles/hq-ui.css"

import usePlatformSummary from "../../hooks/admin/usePlatformSummary"
import usePlatformSearch from "../../hooks/admin/usePlatformSearch"

import AdminCard from "../../components/admin/AdminCard"
import AdminStatCard from "../../components/admin/AdminStatCard"
import AdminEmptyState from "../../components/admin/AdminEmptyState"
import AdminActionCard from "../../components/admin/AdminActionCard"
import AdminPageHeader from "../../components/admin/AdminPageHeader"

import useAdminAnalytics from "../../hooks/admin/useAdminAnalytics"
import AnalyticsInsightCard from "../../components/admin/dashboard/AnalyticsInsightCard"

import useDashboardSupport from "../../hooks/admin/useDashboardSupport"

export default function AdminDashboard() {
    const { summary, loading } = usePlatformSummary()
    const {
        analytics,
        loading: analyticsLoading
    } = useAdminAnalytics(30)

    const {
        tickets,
        releases,
        loading: dashboardLoading
    } = useDashboardSupport()

    const [search, setSearch] = useState("")
    const { results, loading: searching } = usePlatformSearch(search)

    return (
        <div className="admin-page">
            <AdminPageHeader
                eyebrow="Dashboard"
                title="Good Evening, Matt"
                description="Here's what's happening across Evergrove today."
            />

            <section className="admin-grid admin-grid-4">
                <AdminStatCard
                    label="Beta Households"
                    value={loading ? "..." : summary?.householdCount ?? 0}
                />

                <AdminStatCard
                    label="Users"
                    value={loading ? "..." : summary?.userCount ?? 0}
                />

                <AdminStatCard
                    label="Active Today"
                    value={
                        loading
                            ? "..."
                            : summary?.activeToday ?? "Not tracked yet"
                    }
                />

                <AdminStatCard
                    label="Open Issues"
                    value={loading ? "..." : summary?.openIssues ?? 0}
                />
            </section>

            <section className="admin-grid admin-grid-2">
                <AdminCard
                    eyebrow="Product Intelligence"
                    title="Product Pulse"
                >

                    {analyticsLoading ? (

                        <AdminEmptyState>
                            Loading product insights...
                        </AdminEmptyState>

                    ) : analytics.insights.length === 0 ? (

                        <AdminEmptyState>
                            No insights available yet.
                        </AdminEmptyState>

                    ) : (

                        <div className="admin-insight-stack">

                            {analytics.insights
                                .slice(0, 3)
                                .map((insight, index) => (

                                    <AnalyticsInsightCard
                                        key={index}
                                        tone={insight.tone}
                                        title={insight.title}
                                        description={insight.description}
                                        footer={insight.footer}
                                    />

                                ))}

                        </div>

                    )}

                </AdminCard>

                <AdminCard eyebrow="Support" title="Household Lookup">
                    <input
                        className="admin-input"
                        type="search"
                        placeholder="Search households..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />

                    <div className="admin-search-results">
                        {!search && (
                            <AdminEmptyState>
                                Start typing to search households.
                            </AdminEmptyState>
                        )}

                        {searching && (
                            <AdminEmptyState>
                                Searching...
                            </AdminEmptyState>
                        )}

                        {!searching && search && results.length === 0 && (
                            <AdminEmptyState>
                                No households found.
                            </AdminEmptyState>
                        )}

                        {!searching && results.map(household => (
                            <div
                                key={household.id}
                                className="admin-search-result"
                            >
                                <strong>{household.name}</strong>

                                <div>
                                    {household.memberCount} members
                                </div>

                                {household.members.length > 0 && (
                                    <small>
                                        {household.members.slice(0, 4).join(", ")}
                                    </small>
                                )}
                            </div>
                        ))}
                    </div>
                </AdminCard>
            </section>

            <AdminCard
                eyebrow="Support"
                title="Recent Tickets"
            >

                {dashboardLoading ? (

                    <AdminEmptyState>
                        Loading tickets...
                    </AdminEmptyState>

                ) : tickets.length === 0 ? (

                    <AdminEmptyState>
                        No support tickets.
                    </AdminEmptyState>

                ) : (

                    <div className="admin-dashboard-list">

                        {tickets.map(ticket => (

                            <div
                                key={ticket.id}
                                className="admin-dashboard-row"
                            >
                                <div>

                                    <strong>
                                        EG-{String(ticket.ticket_number).padStart(4, "0")}
                                    </strong>

                                    <div>
                                        {ticket.subject || "No subject"}
                                    </div>

                                </div>

                                <span className={`admin-status ${ticket.status}`}>
                                    {ticket.status}
                                </span>

                            </div>

                        ))}

                    </div>

                )}

            </AdminCard>

            <AdminCard
                eyebrow="Releases"
                title="Upcoming Releases"
            >

                {loading ? (

                    <AdminEmptyState>
                        Loading releases...
                    </AdminEmptyState>

                ) : releases.length === 0 ? (

                    <AdminEmptyState>
                        No upcoming releases.
                    </AdminEmptyState>

                ) : (

                    <div className="admin-dashboard-list">

                        {releases.map(release => (

                            <div
                                key={release.id}
                                className="admin-dashboard-row"
                            >

                                <div>

                                    <strong>
                                        {release.version}
                                    </strong>

                                    <div>
                                        {release.ticketCount} linked tickets
                                    </div>

                                </div>

                                <span>
                                    {release.status}
                                </span>

                            </div>

                        ))}

                    </div>

                )}

            </AdminCard>

        </div>
    )
}