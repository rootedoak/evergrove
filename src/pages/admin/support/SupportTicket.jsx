import { Link, useParams } from "react-router-dom"

import { useState } from "react"
import Button from "../../../components/ui/Button"
import LinkReleaseModal from "../../../components/admin/LinkReleaseModal"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"

import useProductFeedbackDetail from "../../../hooks/admin/useProductFeedbackDetail"
import { formatTicketNumber } from "../../../services/admin/productFeedbackAdminService"
import TicketActions from "../../../components/admin/TicketActions"
import TicketTimeline from "../../../components/admin/TicketTimeline"
import useProductFeedbackHistory from "../../../hooks/admin/useProductFeedbackHistory"

import TicketConversation from "../../../components/admin/TicketConversation"
import useProductFeedbackMessages from "../../../hooks/admin/useProductFeedbackMessages"

import AdminRelationshipCard from "../../../components/admin/AdminRelationshipCard"

export default function SupportTicket() {
    const { feedbackId } = useParams()
    const {
        ticket,
        loading,
        error,
        refreshTicket
    } = useProductFeedbackDetail(feedbackId)

    const {
        history,
        loading: historyLoading,
        refreshHistory
    } = useProductFeedbackHistory(feedbackId)

    const {
        messages,
        loading: messagesLoading,
        refreshMessages
    } = useProductFeedbackMessages(feedbackId)

    const [showLinkReleaseModal, setShowLinkReleaseModal] = useState(false)

    const [optimisticRelease, setOptimisticRelease] = useState(null)

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

    const linkedRelease =
        optimisticRelease ||
        ticket.release_feedback?.[0]?.app_releases ||
        null

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
                        onStatusChanged={async () => {
                            await refreshTicket()
                            await refreshHistory()
                        }}
                    />
                }
            />

            <section className="admin-grid admin-grid-auto">
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

                <AdminCard title="Assigned To">
                    <p className="admin-muted">
                        {ticket.assigned_to ? "Assigned" : "Unassigned"}
                    </p>
                </AdminCard>

                <AdminCard title="Submitted">
                    <p className="admin-muted">
                        {formatDateTime(ticket.created_at)}
                    </p>
                </AdminCard>

                <AdminCard title="Release">
                    <AdminRelationshipCard
                        title="Release"
                        primary={
                            linkedRelease
                                ? `${linkedRelease.version} ${formatLabel(linkedRelease.channel)}`
                                : null
                        }
                        secondary={
                            linkedRelease
                                ? formatLabel(linkedRelease.status)
                                : null
                        }
                        status={linkedRelease?.status}
                        statusLabel={
                            linkedRelease
                                ? formatLabel(linkedRelease.status)
                                : null
                        }
                        empty={!linkedRelease}
                        emptyLabel="No release linked"
                        actionLabel={
                            linkedRelease
                                ? "Open Release"
                                : "Link Release"
                        }
                        onClick={() => {
                            if (linkedRelease) {
                                // route will exist after Release Workspace
                                return
                            }

                            setShowLinkReleaseModal(true)
                        }}
                    />
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

            {ticket.attachment_path && (
                <AdminCard title="Attachment">
                    {!ticket.attachment_url ? (
                        <AdminEmptyState>
                            Attachment could not be loaded.
                        </AdminEmptyState>
                    ) : (
                        <div className="admin-ticket-attachment">
                            {ticket.attachment_type?.startsWith("image/") && (
                                <a
                                    href={ticket.attachment_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="admin-ticket-attachment__preview-link"
                                >
                                    <img
                                        src={ticket.attachment_url}
                                        alt={
                                            ticket.attachment_name ||
                                            "Feedback attachment"
                                        }
                                        className="admin-ticket-attachment__preview"
                                    />
                                </a>
                            )}

                            <div className="admin-ticket-attachment__details">
                                <div>
                                    <strong>
                                        {ticket.attachment_name ||
                                            "Feedback attachment"}
                                    </strong>

                                    <span className="admin-muted">
                                        {formatFileSize(
                                            ticket.attachment_size
                                        )}
                                    </span>
                                </div>

                                <a
                                    href={ticket.attachment_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="admin-secondary-button"
                                >
                                    Open Attachment
                                </a>
                            </div>
                        </div>
                    )}
                </AdminCard>
            )}

            <AdminCard title="Conversation">
                <TicketConversation
                    feedbackId={feedbackId}
                    messages={messages}
                    loading={messagesLoading}
                    onMessageAdded={refreshMessages}
                />
            </AdminCard>

            <AdminCard title="Timeline">
                <TicketTimeline
                    history={history}
                    loading={historyLoading}
                />
            </AdminCard>

            <LinkReleaseModal
                open={showLinkReleaseModal}
                onClose={() => setShowLinkReleaseModal(false)}
                feedbackId={ticket.id}
                onLinked={async (release) => {
                    setOptimisticRelease(release)
                    await refreshHistory()
                }}
            />
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

function formatFileSize(value) {
    if (!value && value !== 0) return "—"

    if (value < 1024) {
        return `${value} B`
    }

    if (value < 1024 * 1024) {
        return `${Math.round(value / 1024)} KB`
    }

    return `${(
        value /
        (1024 * 1024)
    ).toFixed(1)} MB`
}