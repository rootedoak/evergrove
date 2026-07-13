import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
    Eye,
    Megaphone,
    MousePointerClick,
    Plus,
    XCircle
} from "lucide-react"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"

import useDiscoverMessages from "../../../hooks/admin/useDiscoverMessages"

import {
    getDiscoverMessageStatus
} from "../../../services/admin/discoverMessageAdminService"

export default function DiscoverMessages() {
    const {
        messages,
        loading,
        error
    } = useDiscoverMessages()

    const [statusFilter, setStatusFilter] =
        useState("all")

    const visibleMessages = useMemo(() => {
        if (statusFilter === "all") {
            return messages
        }

        return messages.filter(message =>
            getDiscoverMessageStatus(message) ===
            statusFilter
        )
    }, [messages, statusFilter])

    const totals = useMemo(() => {
        return messages.reduce(
            (summary, message) => {
                const status =
                    getDiscoverMessageStatus(message)

                summary.total += 1
                summary[status] += 1

                return summary
            },
            {
                total: 0,
                draft: 0,
                scheduled: 0,
                active: 0,
                expired: 0
            }
        )
    }, [messages])

    return (
        <div className="admin-page">
            <AdminPageHeader
                eyebrow="Communications"
                title="Discover"
                description="Create and track important messages shown directly inside Evergrove."
                actions={
                    <Link
                        to="/admin/discover/new"
                        className="admin-primary-button"
                    >
                        <Plus size={17} />
                        New Message
                    </Link>
                }
            />

            <section className="admin-grid admin-grid-auto">
                <MetricCard
                    label="Total"
                    value={totals.total}
                    icon={Megaphone}
                />

                <MetricCard
                    label="Active"
                    value={totals.active}
                    icon={Eye}
                />

                <MetricCard
                    label="Scheduled"
                    value={totals.scheduled}
                    icon={MousePointerClick}
                />

                <MetricCard
                    label="Drafts"
                    value={totals.draft}
                    icon={XCircle}
                />
            </section>

            <AdminCard title="Messages">
                <div className="admin-filter-row">
                    {[
                        ["all", "All"],
                        ["active", "Active"],
                        ["scheduled", "Scheduled"],
                        ["draft", "Drafts"],
                        ["expired", "Expired"]
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            className={
                                statusFilter === value
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setStatusFilter(value)
                            }
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <AdminEmptyState>
                        Loading Discover messages...
                    </AdminEmptyState>
                ) : error ? (
                    <AdminEmptyState>
                        Discover messages could not be loaded.
                    </AdminEmptyState>
                ) : visibleMessages.length === 0 ? (
                    <AdminEmptyState>
                        No Discover messages match this view.
                    </AdminEmptyState>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Message</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Seen</th>
                                    <th>Dismissed</th>
                                    <th>CTA Clicks</th>
                                    <th>Created</th>
                                </tr>
                            </thead>

                            <tbody>
                                {visibleMessages.map(message => {
                                    const status =
                                        getDiscoverMessageStatus(
                                            message
                                        )

                                    return (
                                        <tr key={message.id}>
                                            <td>
                                                <Link
                                                    to={`/admin/discover/${message.id}`}
                                                >
                                                    <strong>
                                                        {message.title}
                                                    </strong>
                                                </Link>

                                                <p>
                                                    {formatLabel(
                                                        message.message_type
                                                    )}
                                                </p>
                                            </td>

                                            <td>
                                                <AdminStatusChip
                                                    status={
                                                        statusTone(
                                                            status
                                                        )
                                                    }
                                                >
                                                    {formatLabel(status)}
                                                </AdminStatusChip>
                                            </td>

                                            <td>
                                                {message.priority}
                                            </td>

                                            <td>
                                                <MetricFraction
                                                    value={message.metrics.seenCount}
                                                    total={message.metrics.eligibleCount}
                                                />
                                            </td>

                                            <td>
                                                <MetricFraction
                                                    value={message.metrics.dismissedCount}
                                                    total={message.metrics.eligibleCount}
                                                />
                                            </td>

                                            <td>
                                                <MetricFraction
                                                    value={message.metrics.actionClickCount}
                                                    total={message.metrics.eligibleCount}
                                                />
                                            </td>

                                            <td>
                                                {formatDate(
                                                    message.created_at
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminCard>
        </div>
    )
}

function MetricCard({
    label,
    value,
    icon: Icon
}) {
    return (
        <AdminCard>
            <div className="discover-admin-metric">
                <div className="discover-admin-metric__icon">
                    <Icon size={20} />
                </div>

                <div>
                    <span>{label}</span>
                    <strong>{value}</strong>
                </div>
            </div>
        </AdminCard>
    )
}

function formatLabel(value) {
    if (!value) return "Unknown"

    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        )
}

function formatDate(value) {
    if (!value) return "—"

    return new Date(value).toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    )
}

function statusTone(status) {
    if (status === "active") return "success"
    if (status === "scheduled") return "warning"
    if (status === "expired") return "neutral"
    return "beta"
}

function MetricFraction({ value, total }) {
    const percentage =
        total > 0
            ? Math.round(
                (value / total) * 100
            )
            : 0

    return (
        <div className="discover-metric-fraction">
            <strong>
                {value} / {total}
            </strong>

            <span>{percentage}%</span>
        </div>
    )
}