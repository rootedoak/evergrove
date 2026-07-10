import { useState } from "react"
import { Link, useParams } from "react-router-dom"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"
import AdminRelationshipCard from "../../../components/admin/AdminRelationshipCard"

import useUserDetail from "../../../hooks/admin/useUserDetail"
import { formatTicketNumber } from "../../../services/admin/productFeedbackAdminService"
import { sendMorningBriefToUser } from "../../../services/admin/morningBriefAdminService"

export default function UserProfile() {
    const { userId } = useParams()
    const [sendingMorningBrief, setSendingMorningBrief] = useState(false)
    const [morningBriefResult, setMorningBriefResult] = useState(null)
    const { user, preferences, tickets, events, adoptionEvents, loading, error } = useUserDetail(userId)

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

    const healthScore = calculateHealthScore({
        user,
        preferences,
        tickets,
        events
    })

    const adoption = getFeatureAdoption(adoptionEvents)

    const sessionCount = events.filter(event =>
        event.event_type === "session_started"
    ).length

    const activeDayCount = events.filter(event =>
        event.event_type === "daily_active"
    ).length

    const openTicketCount = tickets.filter(ticket =>
        ["new", "reviewing", "planned"].includes(ticket.status)
    ).length
    async function handleSendMorningBrief() {
        setSendingMorningBrief(true)
        setMorningBriefResult(null)

        try {
            const result = await sendMorningBriefToUser(userId)
            setMorningBriefResult(result)
        } catch (error) {
            console.error(error)
            alert(error.message || "Unable to send morning brief.")
        } finally {
            setSendingMorningBrief(false)
        }
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

            <section className="admin-profile-section">
                <div className="admin-profile-section-header">
                    <h2>Overview</h2>
                </div>

                <div className="admin-grid admin-grid-4">
                    <AdminCard title="Sessions">
                        <strong>{sessionCount}</strong>
                        <p className="admin-muted">Recent app opens</p>
                    </AdminCard>

                    <AdminCard title="Active Days">
                        <strong>{activeDayCount}</strong>
                        <p className="admin-muted">Tracked active days</p>
                    </AdminCard>

                    <AdminCard title="Open Tickets">
                        <strong>{openTicketCount}</strong>
                        <p className="admin-muted">Needs attention</p>
                    </AdminCard>

                    <AdminCard title="Last Active">
                        <strong>{formatDate(user.last_active_at)}</strong>
                        <p className="admin-muted">Most recent usage event</p>
                    </AdminCard>
                </div>
            </section>

            <section className="admin-profile-section">
                <div className="admin-profile-section-header">
                    <h2>Customer Success</h2>
                </div>

                <div className="admin-grid admin-grid-2">
                    <AdminCard title="Customer Health">
                        <div className="admin-detail-list">
                            <DetailItem label="Health Score" value={`${healthScore} / 100`} />
                            <DetailItem
                                label="Status"
                                value={
                                    <AdminStatusChip status={healthStatus(healthScore)}>
                                        {healthLabel(healthScore)}
                                    </AdminStatusChip>
                                }
                            />
                            <DetailItem label="Sessions" value={sessionCount} />
                            <DetailItem label="Active Days" value={activeDayCount} />
                            <DetailItem label="Open Tickets" value={openTicketCount} />
                        </div>
                    </AdminCard>

                    <AdminCard title="Feature Engagement">
                        <div className="admin-adoption-grid">
                            {adoption.map(feature => (
                                <div
                                    key={feature.label}
                                    className={`admin-adoption-item ${feature.status}`}
                                >
                                    <span>{getAdoptionIcon(feature.status)}</span>

                                    <div>
                                        <strong>{feature.label}</strong>
                                        <p className="admin-muted">{feature.labelText}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AdminCard>
                </div>
            </section>

            <section className="admin-profile-section">
                <div className="admin-profile-section-header">
                    <h2>Customer Profile</h2>
                </div>

                <div className="admin-grid admin-grid-3">
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

                    <AdminCard title="Experience">
                        {!preferences ? (
                            <AdminEmptyState>No preference data found.</AdminEmptyState>
                        ) : (
                            <div className="admin-detail-list">
                                <DetailItem label="Onboarding" value={preferences.has_completed_onboarding ? "Complete" : "Incomplete"} />
                                <DetailItem label="Walkthrough" value={preferences.has_completed_guided_walkthrough ? "Complete" : "Incomplete"} />
                                <DetailItem label="Walkthrough Version" value={preferences.guided_walkthrough_version ?? "—"} />
                                <DetailItem label="Dashboard Window" value={`${preferences.dashboard_window_days ?? "—"} days`} />
                                <DetailItem label="Timeline Window" value={`${preferences.timeline_window_days ?? "—"} days`} />
                                <DetailItem label="Task View" value={formatLabel(preferences.task_default_view)} />
                            </div>
                        )}
                    </AdminCard>

                    <AdminCard title="Notifications">
                        {!preferences ? (
                            <AdminEmptyState>No notification preference data found.</AdminEmptyState>
                        ) : (
                            <div className="admin-detail-list">
                                <DetailItem label="Tasks" value={formatEnabled(preferences.inbox_tasks)} />
                                <DetailItem label="Calendar" value={formatEnabled(preferences.inbox_calendar)} />
                                <DetailItem label="Trips" value={formatEnabled(preferences.inbox_trips)} />
                                <DetailItem label="School" value={formatEnabled(preferences.inbox_school)} />
                                <DetailItem label="Activities" value={formatEnabled(preferences.inbox_activities)} />
                                <DetailItem label="Reminders" value={formatEnabled(preferences.inbox_reminders)} />
                            </div>
                        )}

                        <div className="admin-ticket-actions" style={{ marginTop: 16 }}>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleSendMorningBrief}
                                disabled={sendingMorningBrief}
                            >
                                {sendingMorningBrief ? "Sending..." : "Send Morning Brief"}
                            </button>
                        </div>

                        {morningBriefResult && (
                            <p className="admin-muted" style={{ marginTop: 10 }}>
                                Sent to {morningBriefResult.sentUsers} user(s).{" "}
                                Skipped {morningBriefResult.skippedUsers}.{" "}
                                Failed {morningBriefResult.failedUsers}.

                                {morningBriefResult.errors?.length > 0 && (
                                    <span>
                                        {" "}Error: {morningBriefResult.errors[0].error}
                                    </span>
                                )}
                            </p>
                        )}
                    </AdminCard>
                </div>
            </section>

            <section className="admin-profile-section">
                <div className="admin-profile-section-header">
                    <h2>Customer History</h2>
                </div>

                <div className="admin-grid admin-grid-2">
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

                    <AdminCard title="Recent Activity">
                        {events.length === 0 ? (
                            <AdminEmptyState>No usage events for this user.</AdminEmptyState>
                        ) : (
                            <div className="admin-dashboard-list">
                                {events.map(event => (
                                    <div key={event.id} className="admin-dashboard-row">
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

function formatDateTime(value) {
    if (!value) return "—"

    return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    })
}

function DetailItem({ label, value }) {
    return (
        <div className="admin-detail-item">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    )
}

function formatEnabled(value) {
    return value === false ? "Disabled" : "Enabled"
}

function calculateHealthScore({ user, preferences, tickets, events }) {
    let score = 0

    const openTickets = tickets.filter(ticket =>
        ["new", "reviewing", "planned"].includes(ticket.status)
    ).length

    const sessions = events.filter(event =>
        event.event_type === "session_started"
    ).length

    const dailyActiveEvents = events.filter(event =>
        event.event_type === "daily_active"
    )

    if (user.last_active_at) score += 20
    if (preferences?.has_completed_onboarding) score += 20
    if (preferences?.has_completed_guided_walkthrough) score += 15
    if (openTickets === 0) score += 20
    if (sessions >= 10) score += 15
    if (dailyActiveEvents.length >= 3) score += 10

    return Math.min(score, 100)
}

function healthLabel(score) {
    if (score >= 80) return "Healthy"
    if (score >= 50) return "Needs Attention"
    return "At Risk"
}

function healthStatus(score) {
    if (score >= 80) return "fixed"
    if (score >= 50) return "planned"
    return "error"
}

function getFeatureAdoption(events) {
    const features = [
        {
            label: "Tasks",
            eventTypes: ["task_created", "task_updated", "task_completed"]
        },
        {
            label: "Calendar",
            eventTypes: [
                "calendar_event_created",
                "calendar_event_updated",
                "activity_created"
            ]
        },
        {
            label: "Meals",
            eventTypes: ["meal_created", "meal_updated", "meal_planned"]
        },
        {
            label: "Shopping",
            eventTypes: [
                "grocery_item_created",
                "grocery_item_checked",
                "shopping_item_added"
            ]
        },
        {
            label: "Trips",
            eventTypes: ["trip_created", "trip_updated"]
        },
        {
            label: "Announcements",
            eventTypes: ["announcement_created"]
        }
    ]

    return features.map(feature => {
        const matchingEvents = events.filter(event =>
            feature.eventTypes.includes(event.event_type)
        )

        const latestEvent = matchingEvents[0]
        const lastUsedAt = latestEvent?.created_at ?? null
        const daysSinceUsed = getDaysSince(lastUsedAt)

        return {
            label: feature.label,
            lastUsedAt,
            daysSinceUsed,
            status: getAdoptionStatus(daysSinceUsed),
            labelText: getAdoptionLabel(daysSinceUsed)
        }
    })
}

function getDaysSince(value) {
    if (!value) return null

    const then = new Date(value)
    const now = new Date()
    const diffMs = now.getTime() - then.getTime()

    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function getAdoptionStatus(daysSinceUsed) {
    if (daysSinceUsed === null) return "neutral"
    if (daysSinceUsed <= 7) return "fixed"
    if (daysSinceUsed <= 30) return "planned"
    if (daysSinceUsed <= 60) return "error"

    return "neutral"
}

function getAdoptionLabel(daysSinceUsed) {
    if (daysSinceUsed === null) return "Not used in 60 days"
    if (daysSinceUsed === 0) return "Used today"
    if (daysSinceUsed === 1) return "Used yesterday"
    return `Used ${daysSinceUsed} days ago`
}

function getAdoptionIcon(status) {
    if (status === "fixed") return "✓"
    if (status === "planned") return "!"
    if (status === "error") return "×"
    return "—"
}