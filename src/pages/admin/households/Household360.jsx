import { Link, useParams } from "react-router-dom"

import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"

import useHousehold360 from "../../../hooks/admin/useHousehold360"
import AdminPageHeader from "../../../components/admin/AdminPageHeader"

import { formatTicketNumber } from "../../../services/admin/productFeedbackAdminService"

import { exportHouseholdData } from "../../../services/admin/householdAdminService"

export default function Household360() {
    const { householdId } = useParams()
    const { data, loading, error } = useHousehold360(householdId)

    async function handleExportHouseholdData() {
        try {
            const exportData = await exportHouseholdData(householdId)

            const blob = new Blob(
                [JSON.stringify(exportData, null, 2)],
                { type: "application/json" }
            )

            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")

            link.href = url
            link.download = `evergrove-household-${householdId}-export.json`
            link.click()

            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(err)
            alert("Unable to export household data.")
        }
    }

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

    const {
        household,
        members,
        supportTickets = [],
        usageEvents = [],
        adoption = []
    } = data

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
                actions={
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={handleExportHouseholdData}
                    >
                        Export Data
                    </button>
                }
            />

            <section className="admin-grid admin-grid-4">
                <AdminCard title="Status">
                    <AdminStatusChip status={statusForChip(household.status)}>
                        {formatLabel(household.status)}
                    </AdminStatusChip>
                </AdminCard>

                <AdminCard title="Members">
                    <div className="admin-big-number">
                        {household.memberCount}
                    </div>
                </AdminCard>

                <AdminCard title="Open Tickets">
                    <div className="admin-big-number">
                        {household.openTicketCount ?? 0}
                    </div>
                    <p className="admin-muted">
                        {household.ticketCount ?? 0} total tickets
                    </p>
                </AdminCard>

                <AdminCard title="Last Active">
                    <p className="admin-muted">
                        {formatDate(household.lastActiveAt)}
                    </p>
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

            <section className="admin-grid admin-grid-2">
                <AdminCard title="Product Adoption">
                    {adoption.length === 0 ? (
                        <AdminEmptyState>No adopted features yet.</AdminEmptyState>
                    ) : (
                        <div className="admin-adoption-grid">
                            {adoption.map(item => (
                                <div
                                    key={item.feature}
                                    className="admin-adoption-item active"
                                >
                                    <span>✓</span>
                                    <strong>{item.feature}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </AdminCard>

                <AdminCard title="Recent Support">
                    {supportTickets.length === 0 ? (
                        <AdminEmptyState>No support tickets for this household.</AdminEmptyState>
                    ) : (
                        <div className="admin-dashboard-list">
                            {supportTickets.map(ticket => (
                                <Link
                                    key={ticket.id}
                                    to={`/admin/support/${ticket.id}`}
                                    className="admin-dashboard-row admin-dashboard-link-row"
                                >
                                    <div>
                                        <strong>{formatTicketNumber(ticket.ticket_number)}</strong>
                                        <div className="admin-muted">
                                            {ticket.subject || ticket.message?.slice(0, 60)}
                                        </div>
                                    </div>

                                    <AdminStatusChip status={ticket.status}>
                                        {formatLabel(ticket.status)}
                                    </AdminStatusChip>
                                </Link>
                            ))}
                        </div>
                    )}
                </AdminCard>

                <AdminCard title="Recent Activity">
                    {usageEvents.length === 0 ? (
                        <AdminEmptyState>No usage events for this household.</AdminEmptyState>
                    ) : (
                        <div className="admin-dashboard-list">
                            {usageEvents.map(event => (
                                <div
                                    key={event.id}
                                    className="admin-dashboard-row"
                                >
                                    <div>
                                        <strong>{formatLabel(event.event_type)}</strong>
                                        <div className="admin-muted">
                                            {event.entity_type || "Event"}
                                        </div>
                                    </div>

                                    <span className="admin-muted">
                                        {formatDateTime(event.created_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </AdminCard>
            </section>
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

function formatLabel(value) {
    if (!value) return "Unknown"

    return value
        .replaceAll("-", " ")
        .replaceAll("_", " ")
        .replace(/\b\w/g, char => char.toUpperCase())
}

function formatDateTime(value) {
    if (!value) return "—"

    return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    })
}

function statusForChip(status) {
    if (status === "healthy") return "fixed"
    if (status === "needs-attention") return "planned"
    if (status === "at-risk") return "error"

    return "neutral"
}