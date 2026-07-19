import { useState } from "react"
import { useNavigate } from "react-router-dom"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminTable from "../../../components/admin/AdminTable"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"

import useProductFeedback from "../../../hooks/admin/useProductFeedback"
import { formatTicketNumber } from "../../../services/admin/productFeedbackAdminService"

const statuses = ["active", "all", "new", "reviewing", "planned", "fixed", "closed"]

export default function SupportInbox() {
    const navigate = useNavigate()
    const [statusFilter, setStatusFilter] = useState("active")
    const { feedback, loading, error } = useProductFeedback()

    const activeStatuses = ["new", "reviewing", "planned", "fixed"]

    const statusCounts = statuses.reduce((counts, status) => {
        if (status === "all") {
            counts[status] = feedback.length
        } else if (status === "active") {
            counts[status] = feedback.filter(ticket =>
                activeStatuses.includes(ticket.status)
            ).length
        } else {
            counts[status] = feedback.filter(ticket => ticket.status === status).length
        }

        return counts
    }, {})

    const filteredTickets =
        statusFilter === "all"
            ? feedback
            : statusFilter === "active"
                ? feedback.filter(ticket => activeStatuses.includes(ticket.status))
                : feedback.filter(ticket => ticket.status === statusFilter)

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
                    <strong>{row.subject || row.message?.slice(0, 60)}</strong>
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
            render: row => {
                if (row.source === "internal") {
                    return "Evergrove"
                }

                return row.households?.name || "Unknown"
            }
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
                    {formatLabel(row.status)}
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
                actions={
                    <button
                        type="button"
                        className="admin-primary-button"
                        onClick={() => navigate("/admin/support/new")}
                    >
                        New Ticket
                    </button>
                }
            />

            <div className="admin-filter-row">
                {statuses.map(status => (
                    <button
                        key={status}
                        type="button"
                        className={statusFilter === status ? "active" : ""}
                        onClick={() => setStatusFilter(status)}
                    >
                        {formatLabel(status)} ({statusCounts[status] ?? 0})
                    </button>
                ))}
            </div>

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
                        rows={filteredTickets}
                        emptyMessage="No support tickets found."
                        onRowClick={(ticket) => navigate(`/admin/support/${ticket.id}`)}
                    />
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