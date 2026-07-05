import { Link, useParams } from "react-router-dom"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"

import useProductFeedbackDetail from "../../../hooks/admin/useProductFeedbackDetail"
import { formatTicketNumber } from "../../../services/admin/productFeedbackAdminService"
import TicketActions from "../../../components/admin/TicketActions"

export default function SupportTicket() {
    const { feedbackId } = useParams()
    const {
        ticket,
        loading,
        error,
        refreshTicket
    } = useProductFeedbackDetail(feedbackId)

    if (loading) {
        return (
            <div className="admin-page">
                <AdminEmptyState>
                    Loading support ticket...
                </AdminEmptyState>
            </div>
        )
    }

    if (error || !ticket) {
        return (
            <div className="admin-page">
                <AdminEmptyState>
                    Support ticket could not be loaded.
                </AdminEmptyState>
            </div>
        )
    }

    return (
        <div className="admin-page">
            <div className="admin-breadcrumbs">
                <Link to="/admin/support">Support</Link>
                <span>/</span>
                <span>{formatTicketNumber(ticket.ticket_number)}</span>
            </div>

            <AdminPageHeader
                eyebrow="Support Ticket"
                title={formatTicketNumber(ticket.ticket_number)}
                description={ticket.subject || ticket.message?.slice(0, 90)}
                actions={
                    <TicketActions
                        ticket={ticket}
                        onStatusChanged={refreshTicket}
                    />
                }
            />

            <section className="admin-grid admin-grid-4">
                <AdminCard title="Type">
                    <AdminStatusChip status="beta">
                        {formatLabel(ticket.feedback_type)}
                    </AdminStatusChip>
                </AdminCard>

                <AdminCard title="Status">
                    <AdminStatusChip status={ticket.status}>
                        {formatLabel(ticket.status)}
                    </AdminStatusChip>
                </AdminCard>

                <AdminCard title="Priority">
                    <AdminStatusChip status={priorityStatus(ticket.priority)}>
                        {formatLabel(ticket.priority)}
                    </AdminStatusChip>
                </AdminCard>

                <AdminCard title="Submitted">
                    <p className="admin-muted">
                        {formatDateTime(ticket.created_at)}
                    </p>
                </AdminCard>
            </section>

            <section className="admin-grid admin-grid-2">
                <AdminCard title="Reporter Context">
                    <div className="admin-detail-list">
                        <DetailItem
                            label="Household"
                            value={
                                ticket.households?.id ? (
                                    <Link to={`/admin/households/${ticket.households.id}`}>
                                        {ticket.households.name}
                                    </Link>
                                ) : (
                                    "Unknown"
                                )
                            }
                        />

                        <DetailItem
                            label="Version"
                            value={ticket.app_version || "—"}
                        />

                        <DetailItem
                            label="Page"
                            value={ticket.page_path || "—"}
                        />

                        <DetailItem
                            label="Source"
                            value={formatLabel(ticket.source || "unknown")}
                        />
                    </div>
                </AdminCard>

                <AdminCard title="Internal Notes">
                    <AdminEmptyState>
                        Internal notes will be added in the next support sprint.
                    </AdminEmptyState>
                </AdminCard>
            </section>

            <AdminCard title="Description">
                <p className="admin-ticket-message">
                    {ticket.message}
                </p>
            </AdminCard>
        </div>
    )
}

function DetailItem({ label, value }) {
    return (
        <div className="admin-detail-item">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    )
}

function formatLabel(value) {
    if (!value) return "Unknown"

    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, char => char.toUpperCase())
}

function formatDateTime(value) {
    if (!value) return "—"

    return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    })
}

function priorityStatus(priority) {
    if (priority === "urgent" || priority === "high") return "error"
    if (priority === "low") return "neutral"
    return "warning"
}