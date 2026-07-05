import { useState } from "react"
import usePlatformSummary from "../../hooks/admin/usePlatformSummary"
import usePlatformSearch from "../../hooks/admin/usePlatformSearch"

import AdminCard from "../../components/admin/AdminCard"
import AdminStatCard from "../../components/admin/AdminStatCard"
import AdminEmptyState from "../../components/admin/AdminEmptyState"
import AdminActionCard from "../../components/admin/AdminActionCard"
import AdminPageHeader from "../../components/admin/AdminPageHeader"

export default function AdminDashboard() {
    const { summary, loading } = usePlatformSummary()
    const [search, setSearch] = useState("")
    const { results, loading: searching } = usePlatformSearch(search)

    return (
        <div className="admin-page">
            <AdminPageHeader
                eyebrow="Control Center"
                title="Evergrove HQ"
                description="Monitor beta health, support households, and manage platform operations."
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
                <AdminCard eyebrow="Needs Attention" title="Operational Alerts">
                    <AdminEmptyState>
                        No alerts yet. We’ll surface onboarding issues, failed push notifications,
                        client errors, and data cleanup warnings here.
                    </AdminEmptyState>
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

            <AdminCard eyebrow="Quick Actions" title="Admin Tools">
                <div className="admin-action-grid">
                    <AdminActionCard
                        title="Manage Households"
                        description="Review households, members, and beta status."
                    />

                    <AdminActionCard
                        title="User Administration"
                        description="Find users and troubleshoot account issues."
                    />

                    <AdminActionCard
                        title="Analytics"
                        description="Review engagement and retention signals."
                    />

                    <AdminActionCard
                        title="Feature Flags"
                        description="Control beta features by household or globally."
                    />

                    <AdminActionCard
                        title="Releases"
                        description="Track versions, release notes, and deployment history."
                    />

                    <AdminActionCard
                        title="Maintenance"
                        description="Run cleanup checks and support utilities."
                    />
                </div>
            </AdminCard>
        </div>
    )
}