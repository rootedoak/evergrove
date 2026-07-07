import { Link, useParams } from "react-router-dom"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"
import AdminRelationshipCard from "../../../components/admin/AdminRelationshipCard"

import useUserDetail from "../../../hooks/admin/useUserDetail"
import { formatTicketNumber } from "../../../services/admin/productFeedbackAdminService"

export default function UserProfile() {
    const { userId } = useParams()
    const { user, tickets, events, loading, error } = useUserDetail(userId)

    if (loading) {
        return (
            <div className="admin-page">
                <AdminEmptyState>Loading user profile...</AdminEmptyState>
            </div>
        )
    }

    if (error || !user) {
        return (
            <div className="admin-page">
                <AdminEmptyState>User profile could not be loaded.</AdminEmptyState>
            </div>
        )
    }

    return (
        <div className="admin-page">
            <div className="admin-breadcrumbs">
                <Link to="/admin/users">Users</Link>
                <span>/</span>
                <span>{user.name}</span>
            </div>

            <AdminPageHeader
                eyebrow="Customer 360"
                title={user.name}
                description={user.household_name || "Evergrove user"}
            />

            <section className="admin-grid admin-grid-4">
                <AdminCard title="Usage Events">
                    <strong>{user.usage_event_count ?? 0}</strong>
                    <p className="admin-muted">Tracked activity</p>
                </AdminCard>

                <AdminCard title="Support Tickets">
                    <strong>{user.ticket_count ?? 0}</strong>
                    <p className="admin-muted">Submitted tickets</p>
                </AdminCard>

                <AdminCard title="Last Active">
                    <strong>{formatDate(user.last_active_at)}</strong>
                    <p className="admin-muted">Most recent usage event</p>
                </AdminCard>

                <AdminCard title="Status">
                    <AdminStatusChip status={user.last_active_at ? "active" : "neutral"}>
                        {user.last_active_at ? "Active" : "No Activity"}
                    </AdminStatusChip>
                </AdminCard>
            </section>

            <section className="admin-grid admin-grid-2">
                <AdminCard title="Household">
                    <AdminRelationshipCard
                        title="Household"
                        primary={user.household_name || "No household"}
                        secondary={user.household_id}
                        actionLabel="Open Household"
                        onClick={() => {
                            window.location.href = `/admin/households/${user.household_id}`
                        }}
                        empty={!user.household_id}
                    />
                </AdminCard>

                <AdminCard title="Recent Support">
                    {tickets.length === 0 ? (
                        <AdminEmptyState>No support tickets for this user.</AdminEmptyState>
                    ) : (
                        <div className="admin-dashboard-list">
                            {tickets.map(ticket => (
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
            </section>

            <AdminCard title="Recent Activity">
                {events.length === 0 ? (
                    <AdminEmptyState>No usage events for this user.</AdminEmptyState>
                ) : (
                    <div className="admin-dashboard-list">
                        {events.map(event => (
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
        </div>
    )
}

function formatLabel(value) {
    if (!value) return "Unknown"

    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, char => char.toUpperCase())
}

function formatDate(value) {
    if (!value) return "—"

    return new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    })
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