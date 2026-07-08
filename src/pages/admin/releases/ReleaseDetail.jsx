import { Link, useParams } from "react-router-dom"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"
import Button from "../../../components/ui/Button"

import useReleaseDetail from "../../../hooks/admin/useReleaseDetail"
import { publishRelease } from "../../../services/admin/releaseAdminService"
import { formatTicketNumber } from "../../../services/admin/productFeedbackAdminService"

import { useState } from "react"
import CreateReleaseModal from "../../../components/admin/CreateReleaseModal"

export default function ReleaseDetail() {
    const { releaseId } = useParams()

    const {
        release,
        tickets,
        loading,
        error,
        refreshRelease
    } = useReleaseDetail(releaseId)

    const [showEditModal, setShowEditModal] = useState(false)

    const bugs = tickets.filter(
        ticket => ticket.feedback_type === "bug"
    ).length

    const features = tickets.filter(
        ticket => ticket.feedback_type === "feature"
    ).length

    const ideas = tickets.filter(
        ticket => ticket.feedback_type === "idea"
    ).length

    const questions = tickets.filter(
        ticket => ticket.feedback_type === "question"
    ).length

    if (loading) {
        return (
            <div className="admin-page">
                <AdminEmptyState>Loading release...</AdminEmptyState>
            </div>
        )
    }

    if (error || !release) {
        return (
            <div className="admin-page">
                <AdminEmptyState>Release could not be loaded.</AdminEmptyState>
            </div>
        )
    }

    async function handlePublish() {
        if (!window.confirm(`Publish ${release.version}?`)) return

        try {
            await publishRelease(release.id)
            await refreshRelease()
        } catch (err) {
            console.error(err)
            alert(err.message || "Could not publish release.")
        }
    }

    return (
        <div className="admin-page">
            <div className="admin-breadcrumbs">
                <Link to="/admin/releases">Releases</Link>
                <span>/</span>
                <span>{release.version}</span>
            </div>

            <AdminPageHeader
                eyebrow="Release"
                title={release.version}
                description={release.title || release.summary || "Evergrove release"}
                actions={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setShowEditModal(true)}
                        >
                            Edit Release
                        </Button>

                        {release.status !== "published" && (
                            <Button onClick={handlePublish}>
                                Publish Release
                            </Button>
                        )}
                    </>
                }
            />

            <CreateReleaseModal
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                release={release}
                onUpdated={async () => {
                    await refreshRelease()
                    setShowEditModal(false)
                }}
            />

            <section className="admin-grid admin-grid-6">
                <AdminCard title="Channel">
                    <AdminStatusChip status="beta">
                        {formatLabel(release.channel)}
                    </AdminStatusChip>
                </AdminCard>

                <AdminCard title="Status">
                    <AdminStatusChip status={release.status}>
                        {formatLabel(release.status)}
                    </AdminStatusChip>
                </AdminCard>

                <AdminCard title="Tickets">
                    <strong>{tickets.length}</strong>
                    <p className="admin-muted">Total linked</p>
                </AdminCard>

                <AdminCard title="Bugs">
                    <strong>{bugs}</strong>
                    <p className="admin-muted">Fixed</p>
                </AdminCard>

                <AdminCard title="Features">
                    <strong>{features}</strong>
                    <p className="admin-muted">Included</p>
                </AdminCard>

                <AdminCard title="Ideas">
                    <strong>{ideas}</strong>
                    <p className="admin-muted">Implemented</p>
                </AdminCard>

                <AdminCard title="Published">
                    <strong>{release.published_at ? formatDate(release.published_at) : "—"}</strong>
                    <p className="admin-muted">Release date</p>
                </AdminCard>
            </section>

            <section className="admin-grid admin-grid-2">
                <AdminCard title="Release Notes">
                    {release.summary ? (
                        <p className="admin-ticket-message">
                            {release.summary}
                        </p>
                    ) : (
                        <AdminEmptyState>No release notes yet.</AdminEmptyState>
                    )}
                </AdminCard>

                <AdminCard title="Linked Support Tickets">
                    {tickets.length === 0 ? (
                        <AdminEmptyState>No tickets linked to this release.</AdminEmptyState>
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