import { useState } from "react"
import { useNavigate } from "react-router-dom"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminTable from "../../../components/admin/AdminTable"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"

import useReleases from "../../../hooks/admin/useReleases"

import Button from "../../../components/ui/Button"
import CreateReleaseModal from "../../../components/admin/CreateReleaseModal"

export default function Releases() {
    const navigate = useNavigate()

    const {
        releases,
        loading,
        refreshReleases
    } = useReleases()

    const [showCreateModal, setShowCreateModal] = useState(false)

    const columns = [
        { key: "version", label: "Version" },
        {
            key: "channel",
            label: "Channel",
            render: row => (
                <AdminStatusChip status="beta">
                    {formatLabel(row.channel)}
                </AdminStatusChip>
            )
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
            key: "tickets",
            label: "Tickets",
            render: row => row.ticketCount ?? 0
        },
        {
            key: "published",
            label: "Published",
            render: row => row.published_at ? formatDate(row.published_at) : "—"
        }
    ]

    return (
        <div className="admin-page">
            <AdminPageHeader
                eyebrow="System"
                title="Releases"
                description="Create, track, and publish Evergrove releases."
                actions={
                    <Button
                        onClick={() => setShowCreateModal(true)}
                    >
                        New Release
                    </Button>
                }
            />

            <AdminCard title="Release History">
                {loading ? (
                    <AdminEmptyState>
                        Loading releases...
                    </AdminEmptyState>
                ) : (
                    <AdminTable
                        columns={columns}
                        rows={releases}
                        emptyMessage="No releases found."
                        onRowClick={(release) => navigate(`/admin/releases/${release.id}`)}
                    />
                )}
            </AdminCard>

            <CreateReleaseModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={async () => {
                    await refreshReleases()
                }}
            />
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
    return new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    })
}