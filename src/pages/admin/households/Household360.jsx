import { Link, useParams } from "react-router-dom"

import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"

import useHousehold360 from "../../../hooks/admin/useHousehold360"
import AdminPageHeader from "../../../components/admin/AdminPageHeader"

export default function Household360() {
    const { householdId } = useParams()
    const { data, loading, error } = useHousehold360(householdId)

    if (loading) {
        return (
            <div className="admin-page">
                <AdminEmptyState>
                    Loading household...
                </AdminEmptyState>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="admin-page">
                <AdminEmptyState>
                    Household could not be loaded.
                </AdminEmptyState>
            </div>
        )
    }

    const { household, members } = data

    return (
        <div className="admin-page">
            <div className="admin-breadcrumbs">
                <Link to="/admin/households">Households</Link>
                <span>/</span>
                <span>{household.name}</span>
            </div>

            <AdminPageHeader
                eyebrow="Household 360"
                title={household.name}
                description="Complete operational view of this household."
            />

            <section className="admin-grid admin-grid-4">
                <AdminCard title="Status">
                    <AdminStatusChip status="healthy">
                        Healthy
                    </AdminStatusChip>
                </AdminCard>

                <AdminCard title="Members">
                    <div className="admin-big-number">
                        {household.memberCount}
                    </div>
                </AdminCard>

                <AdminCard title="Created">
                    <p className="admin-muted">
                        {formatDate(household.createdAt)}
                    </p>
                </AdminCard>

                <AdminCard title="Support">
                    <AdminStatusChip status="neutral">
                        No open issues
                    </AdminStatusChip>
                </AdminCard>
            </section>

            <AdminCard eyebrow="People" title="Members">
                <div className="admin-member-list">
                    {members.map(member => (
                        <div
                            key={member.id}
                            className="admin-member-row"
                        >
                            <div>
                                <strong>{member.name}</strong>

                                {member.email && (
                                    <p>{member.email}</p>
                                )}
                            </div>

                            <AdminStatusChip
                                status={member.userId ? "beta" : "neutral"}
                            >
                                {member.userId ? "User" : "Profile"}
                            </AdminStatusChip>
                        </div>
                    ))}
                </div>
            </AdminCard>
        </div>
    )
}

function formatDate(value) {
    if (!value) return "Unknown"

    return new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    })
}