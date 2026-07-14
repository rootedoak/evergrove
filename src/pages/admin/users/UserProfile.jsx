import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
    Bell,
    CalendarDays,
    Check,
    CheckCircle2,
    CircleAlert,
    ClipboardCheck,
    Clock3,
    FileCheck2,
    GraduationCap,
    Mail,
    Map,
    Repeat2,
    Send,
    ShieldCheck,
    Sparkles
} from "lucide-react"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"
import AdminRelationshipCard from "../../../components/admin/AdminRelationshipCard"

import useUserDetail from "../../../hooks/admin/useUserDetail"

import {
    formatTicketNumber
} from "../../../services/admin/productFeedbackAdminService"

import {
    sendMorningBriefToUser
} from "../../../services/admin/morningBriefAdminService"

const LEGAL_DOCUMENT_LABELS = {
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    beta: "Beta Program Agreement",
    ai_automation: "AI & Automation",
    acceptable_use: "Acceptable Use Policy"
}

const ACCEPTANCE_METHOD_LABELS = {
    signup: "Account Creation",
    account_creation: "Account Creation",
    in_app_gate: "In-App Confirmation",
    onboarding: "Onboarding",
    admin: "Recorded by Admin"
}

export default function UserProfile() {
    const { userId } = useParams()

    const [sendingMorningBrief, setSendingMorningBrief] =
        useState(false)

    const [morningBriefResult, setMorningBriefResult] =
        useState(null)

    const {
        user,
        preferences,
        tickets,
        events,
        adoptionEvents,
        legal,
        pushStatus,
        launchMode,
        loading,
        error
    } = useUserDetail(userId)

    if (loading) {
        return (
            <div className="admin-page">
                <AdminEmptyState>
                    Loading user profile...
                </AdminEmptyState>
            </div>
        )
    }

    if (error || !user) {
        return (
            <div className="admin-page">
                <AdminEmptyState>
                    User profile could not be loaded.
                </AdminEmptyState>
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

    const sessionCount = events.filter(
        event => event.event_type === "session_started"
    ).length

    const activeDayCount = events.filter(
        event => event.event_type === "daily_active"
    ).length

    const openTicketCount = tickets.filter(ticket =>
        ["new", "reviewing", "planned"].includes(
            ticket.status
        )
    ).length

    const experienceItems = getExperienceItems(preferences)
    const notificationItems =
        getNotificationItems(preferences)

    async function handleSendMorningBrief() {
        setSendingMorningBrief(true)
        setMorningBriefResult(null)

        try {
            const result =
                await sendMorningBriefToUser(userId)

            setMorningBriefResult(result)
        } catch (sendError) {
            console.error(sendError)

            alert(
                sendError.message ||
                "Unable to send morning brief."
            )
        } finally {
            setSendingMorningBrief(false)
        }
    }

    return (
        <div className="admin-page admin-user-profile-page">
            <div className="admin-breadcrumbs">
                <Link to="/admin/users">Users</Link>
                <span>/</span>
                <span>{user.name}</span>
            </div>

            <AdminPageHeader
                eyebrow="Customer 360"
                title={user.name}
                description={
                    user.household_name ||
                    "Evergrove user"
                }
            />

            <section className="admin-profile-section">
                <div className="admin-profile-section-header">
                    <div>
                        <h2>Overview</h2>
                        <p className="admin-muted">
                            Recent engagement and account activity.
                        </p>
                    </div>
                </div>

                <div className="admin-grid admin-grid-4">
                    <MetricCard
                        value={sessionCount}
                        label="Sessions"
                        detail="Recent app opens"
                    />

                    <MetricCard
                        value={activeDayCount}
                        label="Active Days"
                        detail="Tracked active days"
                    />

                    <MetricCard
                        value={openTicketCount}
                        label="Open Tickets"
                        detail="Needs attention"
                    />

                    <MetricCard
                        value={formatDate(user.last_active_at)}
                        label="Last Active"
                        detail="Most recent usage event"
                        compact
                    />
                </div>
            </section>

            <section className="admin-profile-section">
                <div className="admin-profile-section-header">
                    <div>
                        <h2>Customer Success</h2>
                        <p className="admin-muted">
                            Health, adoption, and recent product use.
                        </p>
                    </div>
                </div>

                <div className="admin-grid admin-grid-2">
                    <AdminCard title="Customer Health">
                        <div className="admin-health-summary">
                            <div className="admin-health-score">
                                <strong>{healthScore}</strong>
                                <span>/ 100</span>
                            </div>

                            <AdminStatusChip
                                status={healthStatus(healthScore)}
                            >
                                {healthLabel(healthScore)}
                            </AdminStatusChip>
                        </div>

                        <div className="admin-health-signals">
                            <HealthSignal
                                label="Recent activity"
                                active={Boolean(
                                    user.last_active_at
                                )}
                            />

                            <HealthSignal
                                label="Onboarding complete"
                                active={
                                    preferences
                                        ?.has_completed_onboarding ===
                                    true
                                }
                            />

                            <HealthSignal
                                label="Walkthrough complete"
                                active={
                                    preferences
                                        ?.has_completed_guided_walkthrough ===
                                    true
                                }
                            />

                            <HealthSignal
                                label="No open support issues"
                                active={openTicketCount === 0}
                            />
                        </div>
                    </AdminCard>

                    <AdminCard title="Feature Engagement">
                        <div className="admin-adoption-grid">
                            {adoption.map(feature => (
                                <div
                                    key={feature.label}
                                    className={
                                        `admin-adoption-item ${feature.status}`
                                    }
                                >
                                    <span>
                                        {getAdoptionIcon(
                                            feature.status
                                        )}
                                    </span>

                                    <div>
                                        <strong>
                                            {feature.label}
                                        </strong>

                                        <p className="admin-muted">
                                            {feature.labelText}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AdminCard>
                </div>
            </section>

            <section className="admin-profile-section">
                <div className="admin-profile-section-header">
                    <div>
                        <h2>Account</h2>
                        <p className="admin-muted">
                            Household, setup, communications, and trust.
                        </p>
                    </div>
                </div>

                <div className="admin-grid admin-grid-2 admin-account-grid">
                    <AdminCard title="Household">
                        <AdminRelationshipCard
                            title="Household"
                            primary={
                                user.household_name ||
                                "No household"
                            }
                            secondary={user.household_id}
                            actionLabel="Open Household"
                            onClick={() => {
                                window.location.href =
                                    `/admin/households/${user.household_id}`
                            }}
                            empty={!user.household_id}
                        />
                    </AdminCard>

                    <AdminCard title="Experience">
                        {!preferences ? (
                            <AdminEmptyState>
                                No preference data found.
                            </AdminEmptyState>
                        ) : (
                            <>
                                <div className="admin-experience-grid">
                                    {experienceItems.map(item => {
                                        const Icon = item.icon

                                        return (
                                            <article
                                                key={item.label}
                                                className={
                                                    `admin-experience-item ${item.status}`
                                                }
                                            >
                                                <span
                                                    className="admin-experience-item__icon"
                                                    aria-hidden="true"
                                                >
                                                    <Icon size={18} />
                                                </span>

                                                <div>
                                                    <strong>
                                                        {item.label}
                                                    </strong>

                                                    <span>
                                                        {item.value}
                                                    </span>
                                                </div>
                                            </article>
                                        )
                                    })}
                                </div>

                                <div className="admin-card-footnote">
                                    Default task view:{" "}
                                    <strong>
                                        {formatLabel(
                                            preferences
                                                .task_default_view
                                        )}
                                    </strong>
                                </div>
                            </>
                        )}
                    </AdminCard>

                    <AdminCard title="Notifications">
                        {!preferences ? (
                            <AdminEmptyState>
                                No notification preference data found.
                            </AdminEmptyState>
                        ) : (
                            <div className="admin-notification-grid">
                                {notificationItems.map(item => {
                                    const Icon = item.icon

                                    return (
                                        <article
                                            key={item.label}
                                            className={
                                                item.enabled
                                                    ? "admin-notification-item enabled"
                                                    : "admin-notification-item disabled"
                                            }
                                        >
                                            <span
                                                className="admin-notification-item__icon"
                                                aria-hidden="true"
                                            >
                                                <Icon size={17} />
                                            </span>

                                            <div>
                                                <strong>
                                                    {item.label}
                                                </strong>

                                                <span>
                                                    {item.enabled
                                                        ? "Enabled"
                                                        : "Disabled"}
                                                </span>
                                            </div>

                                            <span
                                                className="admin-notification-item__indicator"
                                                aria-label={
                                                    item.enabled
                                                        ? "Enabled"
                                                        : "Disabled"
                                                }
                                            >
                                                {item.enabled ? (
                                                    <Check size={14} />
                                                ) : (
                                                    "—"
                                                )}
                                            </span>
                                        </article>
                                    )
                                })}
                            </div>
                        )}

                        <div
                            className={
                                pushStatus?.hasSubscription
                                    ? "admin-push-status enabled"
                                    : "admin-push-status disabled"
                            }
                        >
                            <span
                                className="admin-notification-item__icon"
                                aria-hidden="true"
                            >
                                <Bell size={18} />
                            </span>

                            <div>
                                <strong>Push Notifications</strong>

                                <span>
                                    {pushStatus?.hasSubscription
                                        ? "Active subscription"
                                        : "No active subscription"}
                                </span>
                            </div>

                            <span
                                className="admin-notification-item__indicator"
                                aria-label={
                                    pushStatus?.hasSubscription
                                        ? "Enabled"
                                        : "Disabled"
                                }
                            >
                                {pushStatus?.hasSubscription ? (
                                    <Check size={14} />
                                ) : (
                                    "—"
                                )}
                            </span>
                            <span>
                                {pushStatus?.subscriptionCount > 0 && (
                                    <p className="admin-push-device-count">
                                        {pushStatus.subscriptionCount}
                                        {" "}
                                        {pushStatus.subscriptionCount === 1
                                            ? "registered device"
                                            : "registered devices"}
                                    </p>
                                )}
                            </span>
                        </div>

                        <div className="admin-morning-brief-panel">
                            <div>
                                <span className="admin-morning-brief-panel__icon">
                                    <Mail size={18} />
                                </span>

                                <div>
                                    <strong>
                                        Morning Brief
                                    </strong>

                                    <p className="admin-muted">
                                        Send a one-time test brief to
                                        this user.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleSendMorningBrief}
                                disabled={sendingMorningBrief}
                            >
                                <Send size={16} />

                                {sendingMorningBrief
                                    ? "Sending..."
                                    : "Send Brief"}
                            </button>
                        </div>

                        {morningBriefResult && (
                            <MorningBriefResult
                                result={morningBriefResult}
                            />
                        )}
                    </AdminCard>

                    <AdminCard title="Platform">
                        {!launchMode ? (
                            <AdminEmptyState>
                                No launch-mode data found.
                            </AdminEmptyState>
                        ) : (
                            <div className="admin-platform-panel">
                                <div className="admin-platform-status">
                                    <AdminStatusChip
                                        status={
                                            launchMode.status ===
                                                "installed_pwa"
                                                ? "fixed"
                                                : launchMode.status ===
                                                    "browser"
                                                    ? "planned"
                                                    : "neutral"
                                        }
                                    >
                                        {getLaunchModeLabel(
                                            launchMode.status
                                        )}
                                    </AdminStatusChip>

                                    <p className="admin-muted">
                                        {getLaunchModeDescription(
                                            launchMode
                                        )}
                                    </p>
                                </div>

                                <div className="admin-simple-list">
                                    <div className="admin-simple-row">
                                        <span>Installed app sessions</span>

                                        <strong>
                                            {
                                                launchMode
                                                    .installedPwaSessions
                                            }
                                        </strong>
                                    </div>

                                    <div className="admin-simple-row">
                                        <span>Browser sessions</span>

                                        <strong>
                                            {launchMode.browserSessions}
                                        </strong>
                                    </div>

                                    {launchMode.unknownSessions > 0 && (
                                        <div className="admin-simple-row">
                                            <span>
                                                Unclassified sessions
                                            </span>

                                            <strong>
                                                {
                                                    launchMode
                                                        .unknownSessions
                                                }
                                            </strong>
                                        </div>
                                    )}

                                    <div className="admin-simple-row">
                                        <span>
                                            Last installed-app launch
                                        </span>

                                        <strong>
                                            {formatDateTime(
                                                launchMode
                                                    .lastInstalledPwaAt
                                            )}
                                        </strong>
                                    </div>

                                    <div className="admin-simple-row">
                                        <span>
                                            Last browser launch
                                        </span>

                                        <strong>
                                            {formatDateTime(
                                                launchMode.lastBrowserAt
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </AdminCard>

                    <AdminCard title="Legal & Trust">
                        {!legal ? (
                            <AdminEmptyState>
                                No legal acceptance data found.
                            </AdminEmptyState>
                        ) : (
                            <LegalTrustPanel legal={legal} />
                        )}
                    </AdminCard>
                </div>
            </section>

            <section className="admin-profile-section">
                <div className="admin-profile-section-header">
                    <div>
                        <h2>Customer History</h2>
                        <p className="admin-muted">
                            Support conversations and recent usage.
                        </p>
                    </div>
                </div>

                <div className="admin-grid admin-grid-2">
                    <AdminCard title="Recent Support">
                        {tickets.length === 0 ? (
                            <AdminEmptyState>
                                No support tickets for this user.
                            </AdminEmptyState>
                        ) : (
                            <div className="admin-dashboard-list">
                                {tickets.map(ticket => (
                                    <Link
                                        key={ticket.id}
                                        to={
                                            `/admin/support/${ticket.id}`
                                        }
                                        className="admin-dashboard-row admin-dashboard-link-row"
                                    >
                                        <div>
                                            <strong>
                                                {formatTicketNumber(
                                                    ticket.ticket_number
                                                )}
                                            </strong>

                                            <div className="admin-muted">
                                                {ticket.subject ||
                                                    ticket.message?.slice(
                                                        0,
                                                        60
                                                    )}
                                            </div>
                                        </div>

                                        <AdminStatusChip
                                            status={ticket.status}
                                        >
                                            {formatLabel(
                                                ticket.status
                                            )}
                                        </AdminStatusChip>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </AdminCard>

                    <AdminCard title="Recent Activity">
                        {events.length === 0 ? (
                            <AdminEmptyState>
                                No usage events for this user.
                            </AdminEmptyState>
                        ) : (
                            <div className="admin-dashboard-list">
                                {events.map(event => (
                                    <div
                                        key={event.id}
                                        className="admin-dashboard-row"
                                    >
                                        <div>
                                            <strong>
                                                {formatLabel(
                                                    event.event_type
                                                )}
                                            </strong>

                                            <div className="admin-muted">
                                                {event.entity_type ||
                                                    "Event"}
                                            </div>
                                        </div>

                                        <span className="admin-muted">
                                            {formatDateTime(
                                                event.created_at
                                            )}
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

function MetricCard({
    value,
    label,
    detail,
    compact = false
}) {
    return (
        <AdminCard title={label}>
            <strong
                className={
                    compact
                        ? "admin-metric-value compact"
                        : "admin-metric-value"
                }
            >
                {value}
            </strong>

            <p className="admin-muted">
                {detail}
            </p>
        </AdminCard>
    )
}

function HealthSignal({ label, active }) {
    return (
        <div
            className={
                active
                    ? "admin-health-signal active"
                    : "admin-health-signal inactive"
            }
        >
            <span aria-hidden="true">
                {active ? (
                    <Check size={14} />
                ) : (
                    "—"
                )}
            </span>

            <strong>{label}</strong>
        </div>
    )
}

function LegalTrustPanel({ legal }) {
    return (
        <div className="admin-legal-panel">
            <div
                className={
                    legal.isCurrent
                        ? "admin-legal-hero current"
                        : "admin-legal-hero pending"
                }
            >
                <span
                    className="admin-legal-hero__icon"
                    aria-hidden="true"
                >
                    {legal.isCurrent ? (
                        <ShieldCheck size={24} />
                    ) : (
                        <CircleAlert size={24} />
                    )}
                </span>

                <div>
                    <span className="admin-legal-hero__eyebrow">
                        Legal status
                    </span>

                    <strong>
                        {legal.isCurrent
                            ? "Current"
                            : "Action Required"}
                    </strong>

                    <p>
                        {legal.isCurrent
                            ? "This user has accepted every current required policy."
                            : "This user is missing one or more required policy versions."}
                    </p>
                </div>
            </div>

            <div className="admin-legal-facts">
                <LegalFact
                    label="Required policies"
                    value={
                        `${legal.acceptedCount} of ${legal.requiredCount}`
                    }
                />

                <LegalFact
                    label="Adult eligibility"
                    value={
                        legal.adultEligibilityConfirmed
                            ? "Confirmed"
                            : "Not confirmed"
                    }
                />

                <LegalFact
                    label="Latest acceptance"
                    value={formatDateTime(
                        legal.latestAcceptanceAt
                    )}
                />

                <LegalFact
                    label="Method"
                    value={
                        ACCEPTANCE_METHOD_LABELS[
                        legal.latestAcceptanceMethod
                        ] ??
                        formatLabel(
                            legal.latestAcceptanceMethod
                        )
                    }
                />
            </div>

            {legal.acceptedDocuments?.length > 0 && (
                <div className="admin-legal-documents">
                    <span className="admin-card-section-label">
                        Accepted documents
                    </span>

                    {legal.acceptedDocuments.map(document => (
                        <article
                            key={document.id}
                            className="admin-legal-document-row"
                        >
                            <span aria-hidden="true">
                                <FileCheck2 size={17} />
                            </span>

                            <div>
                                <strong>
                                    {LEGAL_DOCUMENT_LABELS[
                                        document.document_type
                                    ] ?? document.title}
                                </strong>

                                <span>
                                    Version {document.version}
                                    {" · "}
                                    Accepted{" "}
                                    {formatDate(
                                        document.acceptance
                                            ?.accepted_at
                                    )}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {legal.missingDocuments?.length > 0 && (
                <div className="admin-legal-missing">
                    <span className="admin-card-section-label">
                        Missing acceptance
                    </span>

                    {legal.missingDocuments.map(document => (
                        <article key={document.id}>
                            <CircleAlert
                                size={16}
                                aria-hidden="true"
                            />

                            <span>
                                {document.title} v
                                {document.version}
                            </span>
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}

function LegalFact({ label, value }) {
    return (
        <div className="admin-legal-fact">
            <span>{label}</span>
            <strong>{value || "—"}</strong>
        </div>
    )
}

function MorningBriefResult({ result }) {
    const hasErrors =
        result.errors?.length > 0

    return (
        <div
            className={
                hasErrors
                    ? "admin-action-result error"
                    : "admin-action-result success"
            }
        >
            {hasErrors ? (
                <CircleAlert size={17} />
            ) : (
                <CheckCircle2 size={17} />
            )}

            <p>
                Sent to {result.sentUsers} user(s).{" "}
                Skipped {result.skippedUsers}.{" "}
                Failed {result.failedUsers}.
                {hasErrors && (
                    <>
                        {" "}
                        Error: {result.errors[0].error}
                    </>
                )}
            </p>
        </div>
    )
}

function getExperienceItems(preferences) {
    if (!preferences) return []

    return [
        {
            label: "Onboarding",
            value: preferences.has_completed_onboarding
                ? "Complete"
                : "Incomplete",
            status: preferences.has_completed_onboarding
                ? "complete"
                : "attention",
            icon: ClipboardCheck
        },
        {
            label: "Walkthrough",
            value:
                preferences
                    .has_completed_guided_walkthrough
                    ? `Complete · v${preferences
                        .guided_walkthrough_version ??
                    "—"
                    }`
                    : "Incomplete",
            status:
                preferences
                    .has_completed_guided_walkthrough
                    ? "complete"
                    : "attention",
            icon: Sparkles
        },
        {
            label: "Dashboard",
            value:
                `${preferences.dashboard_window_days ?? "—"} day window`,
            status: "neutral",
            icon: CalendarDays
        },
        {
            label: "Timeline",
            value:
                `${preferences.timeline_window_days ?? "—"} day window`,
            status: "neutral",
            icon: Clock3
        }
    ]
}

function getNotificationItems(preferences) {
    if (!preferences) return []

    return [
        {
            label: "Tasks",
            enabled: preferences.inbox_tasks !== false,
            icon: ClipboardCheck
        },
        {
            label: "Calendar",
            enabled: preferences.inbox_calendar !== false,
            icon: CalendarDays
        },
        {
            label: "Trips",
            enabled: preferences.inbox_trips !== false,
            icon: Map
        },
        {
            label: "School",
            enabled: preferences.inbox_school !== false,
            icon: GraduationCap
        },
        {
            label: "Activities",
            enabled: preferences.inbox_activities !== false,
            icon: Repeat2
        },
        {
            label: "Reminders",
            enabled: preferences.inbox_reminders !== false,
            icon: Bell
        }
    ]
}

function formatLabel(value) {
    if (!value) return "—"

    return String(value)
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

function formatDateTime(value) {
    if (!value) return "—"

    return new Date(value).toLocaleString(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    )
}

function calculateHealthScore({
    user,
    preferences,
    tickets,
    events
}) {
    let score = 0

    const openTickets = tickets.filter(ticket =>
        ["new", "reviewing", "planned"].includes(
            ticket.status
        )
    ).length

    const sessions = events.filter(
        event => event.event_type === "session_started"
    ).length

    const dailyActiveEvents = events.filter(
        event => event.event_type === "daily_active"
    )

    if (user.last_active_at) score += 20
    if (preferences?.has_completed_onboarding) score += 20

    if (
        preferences
            ?.has_completed_guided_walkthrough
    ) {
        score += 15
    }

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
            eventTypes: [
                "task_created",
                "task_updated",
                "task_completed"
            ]
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
            eventTypes: [
                "meal_created",
                "meal_updated",
                "meal_planned"
            ]
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
            eventTypes: [
                "trip_created",
                "trip_updated"
            ]
        },
        {
            label: "Announcements",
            eventTypes: [
                "announcement_created"
            ]
        }
    ]

    return features.map(feature => {
        const matchingEvents = events.filter(event =>
            feature.eventTypes.includes(
                event.event_type
            )
        )

        const latestEvent = matchingEvents[0]
        const lastUsedAt =
            latestEvent?.created_at ?? null

        const daysSinceUsed =
            getDaysSince(lastUsedAt)

        return {
            label: feature.label,
            lastUsedAt,
            daysSinceUsed,
            status:
                getAdoptionStatus(daysSinceUsed),
            labelText:
                getAdoptionLabel(daysSinceUsed)
        }
    })
}

function getDaysSince(value) {
    if (!value) return null

    const then = new Date(value)
    const now = new Date()

    const diffMs =
        now.getTime() - then.getTime()

    return Math.floor(
        diffMs / (1000 * 60 * 60 * 24)
    )
}

function getAdoptionStatus(daysSinceUsed) {
    if (daysSinceUsed === null) return "neutral"
    if (daysSinceUsed <= 7) return "fixed"
    if (daysSinceUsed <= 30) return "planned"
    if (daysSinceUsed <= 60) return "error"

    return "neutral"
}

function getAdoptionLabel(daysSinceUsed) {
    if (daysSinceUsed === null) {
        return "Not used in 60 days"
    }

    if (daysSinceUsed === 0) {
        return "Used today"
    }

    if (daysSinceUsed === 1) {
        return "Used yesterday"
    }

    return `Used ${daysSinceUsed} days ago`
}

function getAdoptionIcon(status) {
    if (status === "fixed") return "✓"
    if (status === "planned") return "!"
    if (status === "error") return "×"

    return "—"
}

function getLaunchModeLabel(status) {
    if (status === "installed_pwa") {
        return "Uses Installed App"
    }

    if (status === "browser") {
        return "Browser Only"
    }

    return "Not Yet Known"
}

function getLaunchModeDescription(launchMode) {
    if (launchMode.status === "installed_pwa") {
        return "This user has launched Evergrove from an installed app."
    }

    if (launchMode.status === "browser") {
        return "This user has only launched Evergrove from a browser."
    }

    return "No classified launch-mode sessions have been recorded yet."
}