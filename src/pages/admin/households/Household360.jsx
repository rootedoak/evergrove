import { Link, useNavigate, useParams } from "react-router-dom"

import {
    useEffect,
    useState
} from "react"

import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"

import useHousehold360 from "../../../hooks/admin/useHousehold360"
import AdminPageHeader from "../../../components/admin/AdminPageHeader"

import { formatTicketNumber } from "../../../services/admin/productFeedbackAdminService"

import {
    assignPromoCodeToHouseholdAdmin,
    getPromoCodesAdmin
} from "../../../services/admin/promoCodeService"

import {
    exportHouseholdData,
    removeFamilyMember,
    resendPendingInvite,
    updatePendingInviteEmail
} from "../../../services/admin/householdAdminService"

export default function Household360() {
    const navigate = useNavigate()
    const { householdId } = useParams()
    const {
        data,
        loading,
        error,
        refresh,
        savingBilling,
        changeBillingExemption
    } = useHousehold360(householdId)

    const [editingMember, setEditingMember] =
        useState(null)

    const [editedEmail, setEditedEmail] =
        useState("")

    const [savingEmail, setSavingEmail] =
        useState(false)

    const [billingExemptReason, setBillingExemptReason] =
        useState("")

    const [promoCodes, setPromoCodes] =
        useState([])

    const [loadingPromoCodes, setLoadingPromoCodes] =
        useState(false)

    const [showPromotionForm, setShowPromotionForm] =
        useState(false)

    const [selectedPromoCodeId, setSelectedPromoCodeId] =
        useState("")

    const [assigningPromotion, setAssigningPromotion] =
        useState(false)

    useEffect(() => {
        let active = true

        async function loadPromoCodes() {
            try {
                setLoadingPromoCodes(true)

                const result =
                    await getPromoCodesAdmin()

                if (!active) return

                setPromoCodes(
                    (result ?? []).filter(
                        promo =>
                            promo.status === "active" &&
                            [
                                "beta_access",
                                "lifetime",
                                "extended_trial"
                            ].includes(
                                promo.offer_type ??
                                promo.offerType
                            )
                    )
                )
            } catch (err) {
                console.error(
                    "Failed to load promotions:",
                    err
                )
            } finally {
                if (active) {
                    setLoadingPromoCodes(false)
                }
            }
        }

        loadPromoCodes()

        return () => {
            active = false
        }
    }, [])

    async function handleAssignPromotion() {
        if (!selectedPromoCodeId) {
            alert("Select a promotion.")
            return
        }

        const selectedPromotion =
            promoCodes.find(
                promo =>
                    promo.id ===
                    selectedPromoCodeId
            )

        const confirmed = window.confirm(
            `Assign ${selectedPromotion?.name ||
            "this promotion"
            } to ${data?.household?.name || "this household"}?`
        )

        if (!confirmed) return

        try {
            setAssigningPromotion(true)

            await assignPromoCodeToHouseholdAdmin({
                householdId,
                promoCodeId:
                    selectedPromoCodeId
            })

            setSelectedPromoCodeId("")
            setShowPromotionForm(false)

            await refresh()

            alert(
                "Promotion assigned successfully."
            )
        } catch (err) {
            console.error(
                "Failed to assign promotion:",
                err
            )

            alert(
                err.message ||
                "Unable to assign promotion."
            )
        } finally {
            setAssigningPromotion(false)
        }
    }

    async function handleExportHouseholdData() {
        try {
            const exportData = await exportHouseholdData(householdId)

            const blob = new Blob(
                [JSON.stringify(exportData, null, 2)],
                { type: "application/json" }
            )

            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")

            link.href = url
            link.download = `evergrove-household-${householdId}-export.json`
            link.click()

            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(err)
            alert("Unable to export household data.")
        }
    }

    async function handleRemoveFamilyMember(member) {
        if (member.userId) {
            alert("Authenticated users cannot be removed from HQ.")
            return
        }

        const confirmed = window.confirm(
            `Remove ${member.name} from this household?\n\nThis only removes the family member profile. It does not delete or modify any authenticated Supabase user.`
        )

        if (!confirmed) return

        try {
            await removeFamilyMember(member.id, householdId)
            await refresh()
        } catch (err) {
            console.error(err)
            alert(err.message || "Unable to remove family member profile.")
        }
    }

    async function handleSaveInviteEmail() {
        if (!editingMember) {
            return
        }

        try {
            setSavingEmail(true)

            await updatePendingInviteEmail({
                familyMemberId: editingMember.id,
                householdId,
                inviteEmail: editedEmail
            })

            setEditingMember(null)
            setEditedEmail("")

            await refresh()
        } catch (err) {
            console.error(err)
            alert(
                err.message ||
                "Unable to update email."
            )
        } finally {
            setSavingEmail(false)
        }
    }

    async function handleResendInvite(member) {
        try {
            await resendPendingInvite(member.id)

            alert(
                `Invitation resent to ${member.inviteEmail ||
                member.email
                }.`
            )
        } catch (err) {
            console.error(
                "Failed to resend invitation:",
                err
            )

            alert(
                err.message ||
                "Unable to resend invitation."
            )
        }
    }

    async function handleGrantFreeForLife() {
        const reason = billingExemptReason.trim()

        if (!reason) {
            alert(
                "Enter a reason before granting Free for Life access."
            )
            return
        }

        const confirmed = window.confirm(
            "Grant this household permanent Free for Life access?"
        )

        if (!confirmed) return

        try {
            await changeBillingExemption({
                billingExempt: true,
                reason
            })

            setBillingExemptReason("")
        } catch (err) {
            console.error(
                "Failed to grant billing exemption:",
                err
            )

            alert(
                err.message ||
                "Unable to grant Free for Life access."
            )
        }
    }

    async function handleRemoveFreeForLife() {
        const confirmed = window.confirm(
            "Remove Free for Life access from this household?\n\nThe household will return to beta billing status."
        )

        if (!confirmed) return

        try {
            await changeBillingExemption({
                billingExempt: false
            })
        } catch (err) {
            console.error(
                "Failed to remove billing exemption:",
                err
            )

            alert(
                err.message ||
                "Unable to remove Free for Life access."
            )
        }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <AdminEmptyState>
                    Loading household...
                </AdminEmptyState>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="admin-page">
                <AdminEmptyState>
                    Household could not be loaded.
                </AdminEmptyState>
            </div>
        )
    }

    const {
        household,
        members,
        supportTickets = [],
        usageEvents = [],
        adoption = []
    } = data

    return (
        <div className="admin-page">
            <div className="admin-breadcrumbs">
                <Link to="/admin/households">Households</Link>
                <span>/</span>
                <span>{household.name}</span>
            </div>

            <AdminPageHeader
                eyebrow="Household 360"
                title={household.name}
                description="Complete operational view of this household."
                actions={
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={handleExportHouseholdData}
                    >
                        Export Data
                    </button>
                }
            />

            <section className="admin-grid admin-grid-4">
                <AdminCard title="Status">
                    <AdminStatusChip status={statusForChip(household.status)}>
                        {formatLabel(household.status)}
                    </AdminStatusChip>
                </AdminCard>

                <AdminCard title="Members">
                    <div className="admin-big-number">
                        {household.memberCount}
                    </div>
                </AdminCard>

                <AdminCard title="Open Tickets">
                    <div className="admin-big-number">
                        {household.openTicketCount ?? 0}
                    </div>
                    <p className="admin-muted">
                        {household.ticketCount ?? 0} total tickets
                    </p>
                </AdminCard>

                <AdminCard title="Last Active">
                    <p className="admin-muted">
                        {formatDate(household.lastActiveAt)}
                    </p>
                </AdminCard>
            </section>

            <AdminCard eyebrow="Monetization" title="Billing">
                <div className="admin-billing-panel">
                    <div className="admin-member-details-grid">
                        <AdminMiniDetail
                            label="Billing Status"
                            value={formatLabel(
                                household.billingStatus
                            )}
                        />

                        <AdminMiniDetail
                            label="Beta Household"
                            value={household.isBeta ? "Yes" : "No"}
                        />

                        <AdminMiniDetail
                            label="Free for Life"
                            value={
                                household.billingExempt
                                    ? "Active"
                                    : "No"
                            }
                        />

                        <AdminMiniDetail
                            label="Billing Period Ends"
                            value={
                                household.billingPeriodEndsAt
                                    ? formatDate(
                                        household.billingPeriodEndsAt
                                    )
                                    : "—"
                            }
                        />

                        <AdminMiniDetail
                            label="Promotion"
                            value={
                                household.promotion?.name ||
                                "None assigned"
                            }
                        />
                    </div>

                    <div className="admin-member-empty-note">
                        <p>
                            <strong>Assigned Promotion</strong>
                        </p>

                        {household.promotion ? (
                            <>
                                <p>
                                    {household.promotion.name}
                                </p>

                                <p className="admin-muted">
                                    Code:{" "}
                                    <strong>
                                        {household.promotion.code}
                                    </strong>
                                </p>

                                <p className="admin-muted">
                                    Offer:{" "}
                                    {formatLabel(
                                        household.promotion.offerType
                                    )}
                                </p>

                                <p className="admin-muted">
                                    Applied{" "}
                                    {household.promotion.redeemedAt
                                        ? formatDateTime(
                                            household.promotion.redeemedAt
                                        )
                                        : "at an unknown time"}
                                </p>
                            </>
                        ) : showPromotionForm ? (
                            <div className="admin-member-email-editor">
                                <label>
                                    <span>Promotion</span>

                                    <select
                                        value={selectedPromoCodeId}
                                        disabled={
                                            assigningPromotion ||
                                            loadingPromoCodes
                                        }
                                        onChange={event =>
                                            setSelectedPromoCodeId(
                                                event.target.value
                                            )
                                        }
                                    >
                                        <option value="">
                                            {loadingPromoCodes
                                                ? "Loading promotions..."
                                                : "Select a promotion"}
                                        </option>

                                        {promoCodes.map(promo => {
                                            const offerType =
                                                promo.offer_type ??
                                                promo.offerType

                                            return (
                                                <option
                                                    key={promo.id}
                                                    value={promo.id}
                                                >
                                                    {promo.name} —{" "}
                                                    {formatLabel(
                                                        offerType
                                                    )}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </label>

                                {promoCodes.length === 0 &&
                                    !loadingPromoCodes && (
                                        <p className="admin-muted">
                                            No eligible active promotions
                                            are available.
                                        </p>
                                    )}

                                <div className="admin-inline-actions">
                                    <button
                                        type="button"
                                        className="primary-button"
                                        disabled={
                                            assigningPromotion ||
                                            !selectedPromoCodeId
                                        }
                                        onClick={handleAssignPromotion}
                                    >
                                        {assigningPromotion
                                            ? "Assigning..."
                                            : "Apply Promotion"}
                                    </button>

                                    <button
                                        type="button"
                                        className="secondary-button"
                                        disabled={assigningPromotion}
                                        onClick={() => {
                                            setShowPromotionForm(false)
                                            setSelectedPromoCodeId("")
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="admin-inline-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        setShowPromotionForm(true)
                                    }
                                >
                                    Assign Promotion
                                </button>
                            </div>
                        )}
                    </div>
                    {household.billingExempt ? (
                        <div className="admin-member-empty-note">
                            <p>
                                <strong>Exemption reason</strong>
                            </p>

                            <p className="admin-muted">
                                {household.billingExemptReason ||
                                    "No reason recorded."}
                            </p>

                            <p className="admin-muted">
                                Granted{" "}
                                {household.billingExemptAt
                                    ? formatDateTime(
                                        household.billingExemptAt
                                    )
                                    : "at an unknown time"}
                            </p>

                            <div className="admin-inline-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    disabled={savingBilling}
                                    onClick={handleRemoveFreeForLife}
                                >
                                    {savingBilling
                                        ? "Saving..."
                                        : "Remove Free for Life"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="admin-member-email-editor">
                            <label>
                                <span>Exemption reason</span>

                                <input
                                    type="text"
                                    value={billingExemptReason}
                                    placeholder="Example: Early beta household"
                                    onChange={event =>
                                        setBillingExemptReason(
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <div className="admin-inline-actions">
                                <button
                                    type="button"
                                    className="primary-button"
                                    disabled={
                                        savingBilling ||
                                        !billingExemptReason.trim()
                                    }
                                    onClick={handleGrantFreeForLife}
                                >
                                    {savingBilling
                                        ? "Saving..."
                                        : "Grant Free for Life"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </AdminCard>

            <AdminCard eyebrow="People" title="Members">
                <div className="admin-member-list">
                    {members.map(member => {
                        const preferences = member.preferences

                        return (
                            <div
                                key={member.id}
                                className="admin-member-row admin-member-row-expanded"
                            >
                                <div className="admin-member-main">
                                    <div>
                                        {member.userId ? (
                                            <button
                                                type="button"
                                                className="admin-member-link"
                                                onClick={() => navigate(`/admin/users/${member.userId}`)}
                                            >
                                                {member.name}
                                            </button>
                                        ) : (
                                            <strong className="admin-member-name">
                                                {member.name}
                                            </strong>
                                        )}

                                        {editingMember?.id === member.id ? (
                                            <div className="admin-member-email-editor">
                                                <input
                                                    type="email"
                                                    value={editedEmail}
                                                    onChange={event =>
                                                        setEditedEmail(event.target.value)
                                                    }
                                                />

                                                <div className="admin-inline-actions">
                                                    <button
                                                        type="button"
                                                        className="primary-button"
                                                        disabled={savingEmail}
                                                        onClick={handleSaveInviteEmail}
                                                    >
                                                        Save
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="secondary-button"
                                                        onClick={() => {
                                                            setEditingMember(null)
                                                            setEditedEmail("")
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : member.email ? (
                                            <p>{member.email}</p>
                                        ) : (
                                            <p className="admin-muted">
                                                Household profile only
                                            </p>
                                        )}
                                    </div>

                                    <div className="admin-member-actions">
                                        <AdminStatusChip status={getMemberTypeStatus(member)}>
                                            {getMemberTypeLabel(member)}
                                        </AdminStatusChip>

                                        {!member.userId &&
                                            member.inviteStatus === "pending" && (
                                                <button
                                                    type="button"
                                                    className="text-action-button"
                                                    onClick={() => {
                                                        setEditingMember(member)
                                                        setEditedEmail(
                                                            member.inviteEmail || ""
                                                        )
                                                    }}
                                                >
                                                    Edit Email
                                                </button>
                                            )}

                                        {!member.userId &&
                                            member.inviteStatus === "pending" && (
                                                <button
                                                    type="button"
                                                    className="text-action-button"
                                                    onClick={() => handleResendInvite(member)}
                                                >
                                                    Resend Invite
                                                </button>
                                            )}

                                        {!member.userId && (
                                            <button
                                                type="button"
                                                className="text-action-button danger-text"
                                                onClick={() => handleRemoveFamilyMember(member)}
                                            >
                                                Remove Profile
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {preferences ? (
                                    <div className="admin-member-details-grid">
                                        <AdminMiniDetail
                                            label="Onboarding"
                                            value={preferences.has_completed_onboarding ? "Complete" : "Incomplete"}
                                        />

                                        <AdminMiniDetail
                                            label="Walkthrough"
                                            value={preferences.has_completed_guided_walkthrough ? "Complete" : "Incomplete"}
                                        />

                                        <AdminMiniDetail
                                            label="Timeline Window"
                                            value={`${preferences.timeline_window_days ?? "—"} days`}
                                        />

                                        <AdminMiniDetail
                                            label="Timezone"
                                            value={preferences.timezone || "—"}
                                        />

                                        <AdminMiniDetail
                                            label="Tasks Inbox"
                                            value={preferences.inbox_tasks ? "On" : "Off"}
                                        />

                                        <AdminMiniDetail
                                            label="Events Inbox"
                                            value={preferences.inbox_calendar_events ? "On" : "Off"}
                                        />

                                        <AdminMiniDetail
                                            label="Meals Inbox"
                                            value={preferences.inbox_meals ? "On" : "Off"}
                                        />

                                        <AdminMiniDetail
                                            label="Shopping Inbox"
                                            value={preferences.inbox_shopping ? "On" : "Off"}
                                        />
                                    </div>
                                ) : (
                                    <p className="admin-muted admin-member-empty-note">
                                        No experience or notification preferences found for this profile.
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
            </AdminCard>

            <section className="admin-grid admin-grid-2">

                <AdminCard title="Recent Support">
                    {supportTickets.length === 0 ? (
                        <AdminEmptyState>No support tickets for this household.</AdminEmptyState>
                    ) : (
                        <div className="admin-dashboard-list">
                            {supportTickets.map(ticket => (
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
                    {usageEvents.length === 0 ? (
                        <AdminEmptyState>No usage events for this household.</AdminEmptyState>
                    ) : (
                        <div className="admin-dashboard-list">
                            {usageEvents.map(event => (
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
            </section>
        </div>
    )
}

function getMemberTypeLabel(member) {
    if (member.inviteStatus === "pending") {
        return "Pending Invite"
    }

    return member.userId
        ? "Linked Account"
        : "Profile Only"
}

function getMemberTypeStatus(member) {
    if (member.inviteStatus === "pending") {
        return "planned"
    }

    return member.userId
        ? "fixed"
        : "neutral"
}

function AdminMiniDetail({ label, value }) {
    return (
        <div className="admin-mini-detail">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    )
}

function formatDate(value) {
    if (!value) return "Unknown"

    return new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    })
}

function formatLabel(value) {
    if (!value) return "Unknown"

    return value
        .replaceAll("-", " ")
        .replaceAll("_", " ")
        .replace(/\b\w/g, char => char.toUpperCase())
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

function statusForChip(status) {
    if (status === "healthy") return "fixed"
    if (status === "needs-attention") return "planned"
    if (status === "at-risk") return "error"

    return "neutral"
}