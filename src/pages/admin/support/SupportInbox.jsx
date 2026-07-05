import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminTable from "../../../components/admin/AdminTable"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"

import useProductFeedback from "../../../hooks/admin/useProductFeedback"
import { formatTicketNumber } from "../../../services/admin/productFeedbackAdminService"
import { useNavigate } from "react-router-dom"

export default function SupportInbox() {
    const navigate = useNavigate()
    const { feedback, loading, error } = useProductFeedback()

    const columns = [
        {
            key: "ticket",
            label: "Ticket",
            render: row => formatTicketNumber(row.ticket_number)
        },
        {
            key: "subject",
            label: "Subject",
            render: row => (
                <div>
                    <strong>{row.subject || row.message.slice(0, 60)}</strong>
                    <p className="admin-muted">
                        {row.feedback_type}
                        {row.category ? ` · ${row.category}` : ""}
                    </p>
                </div>
            )
        },
        {
            key: "household",
            label: "Household",
            render: row => row.households?.name || "Unknown"
        },
        {
            key: "version",
            label: "Version",
            render: row => row.app_version || "—"
        },
        {
            key: "status",
            label: "Status",
            render: row => (
                <AdminStatusChip status={row.status}>
                    {formatStatus(row.status)}
                </AdminStatusChip>
            )
        },
        {
            key: "created",
            label: "Created",
            render: row => formatDate(row.created_at)
        }
    ]

    return (
        <div className="admin-page">
            <AdminPageHeader
                eyebrow="Support"
                title="Support Inbox"
                description="Feedback, bugs, ideas, and questions submitted by Evergrove users."
            />

            <AdminCard title="Tickets">
                {loading && (
                    <AdminEmptyState>
                        Loading tickets...
                    </AdminEmptyState>
                )}

                {error && (
                    <AdminEmptyState>
                        Support tickets could not be loaded.
                    </AdminEmptyState>
                )}

                {!loading && !error && (
                    <AdminTable
                        columns={columns}
                        rows={feedback}
                        emptyMessage="No support tickets found."
                        onRowClick={(ticket) => navigate(`/admin/support/${ticket.id}`)}
                    />
                )}
            </AdminCard>
        </div>
    )
}

function formatStatus(status) {
    if (!status) return "Unknown"

    return status
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