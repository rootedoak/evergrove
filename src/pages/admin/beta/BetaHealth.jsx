import { Link } from "react-router-dom"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"

import useBetaHealth from "../../../hooks/admin/useBetaHealth"

export default function BetaHealth() {
    const { users, loading } = useBetaHealth()

    const healthy = users.filter(user => user.health.status === "healthy").length
    const atRisk = users.filter(user => user.health.status === "at-risk").length
    const dormant = users.filter(user => user.health.status === "dormant").length

    return (
        <div className="admin-page">
            <AdminPageHeader
                eyebrow="Beta Testing"
                title="Beta Health"
                description="See which beta users are active, at risk, or dormant."
            />

            <section className="admin-grid admin-grid-3">
                <AdminCard title="Healthy">
                    <strong>{healthy}</strong>
                    <p className="admin-muted">Recently active users</p>
                </AdminCard>

                <AdminCard title="At Risk">
                    <strong>{atRisk}</strong>
                    <p className="admin-muted">Needs attention</p>
                </AdminCard>

                <AdminCard title="Dormant">
                    <strong>{dormant}</strong>
                    <p className="admin-muted">Inactive users</p>
                </AdminCard>
            </section>

            <AdminCard title="Beta Users">
                {loading ? (
                    <AdminEmptyState>Loading beta health...</AdminEmptyState>
                ) : users.length === 0 ? (
                    <AdminEmptyState>No beta users found.</AdminEmptyState>
                ) : (
                    <div className="admin-dashboard-list">
                        {users.map(user => (
                            <Link
                                key={user.family_member_id}
                                to={`/admin/users/${user.user_id}`}
                                className="admin-dashboard-row admin-dashboard-link-row"
                            >
                                <div>
                                    <strong>{user.name}</strong>

                                    <div className="admin-muted">
                                        {user.household_name ?? "No household"} · {user.health.reason}
                                    </div>
                                </div>

                                <AdminStatusChip status={statusForChip(user.health.status)}>
                                    {user.health.label}
                                </AdminStatusChip>
                            </Link>
                        ))}
                    </div>
                )}
            </AdminCard>
        </div>
    )
}

function statusForChip(status) {
    if (status === "healthy") return "fixed"
    if (status === "at-risk") return "planned"
    if (status === "dormant") return "closed"

    return "neutral"
}