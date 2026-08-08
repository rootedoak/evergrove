import { useEffect, useMemo, useState } from "react"
import {
    Check,
    Copy,
    ExternalLink,
    Link2,
    LoaderCircle,
    RefreshCw,
    Tag,
    TrendingUp,
    UserCheck,
    UserPlus,
    Users
} from "lucide-react"

import AppPage from "../../../components/ui/AppPage"
import PageHeader from "../../../components/ui/PageHeader"
import SectionCard from "../../../components/ui/SectionCard"
import Button from "../../../components/ui/Button"

import {
    buildReferralUrl,
    getReferralDashboard
} from "../../../services/referralService"

import {
    createPromoCodeAdmin,
    getPromoCodesAdmin,
    setPromoCodeStatusAdmin
} from "../../../services/admin/promoCodeService"

import PromoCodeForm from "./PromoCodeForm"

const funnelStages = [
    {
        key: "started",
        label: "Started",
        description: "Opened the referral flow",
        icon: Link2
    },
    {
        key: "accountCreated",
        label: "Accounts Created",
        description: "Created an Evergrove account",
        icon: UserPlus
    },
    {
        key: "householdCreated",
        label: "Households Created",
        description: "Created a new household",
        icon: Users
    },
    {
        key: "activated",
        label: "Activated",
        description: "Completed onboarding",
        icon: UserCheck
    }
]

const offerTypeLabels = {
    beta_access: "Beta Access",
    lifetime: "Lifetime Access",
    extended_trial: "Extended Trial",
    percent_discount: "Percentage Discount",
    fixed_discount: "Fixed Discount"
}

export default function Growth() {
    const [dashboard, setDashboard] = useState(null)
    const [promoCodes, setPromoCodes] = useState([])

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState("")

    const [copied, setCopied] = useState(false)
    const [copiedPromoCodeId, setCopiedPromoCodeId] =
        useState(null)

    const [updatingPromoCodeId, setUpdatingPromoCodeId] =
        useState(null)

    const [
        promoFormOpen,
        setPromoFormOpen
    ] = useState(false)

    const [
        creatingPromoCode,
        setCreatingPromoCode
    ] = useState(false)

    const [
        promoFormError,
        setPromoFormError
    ] = useState("")

    const referralLink = useMemo(() => {
        const referralCode =
            dashboard?.referral?.referral_code

        if (!referralCode) return ""

        return buildReferralUrl(referralCode)
    }, [dashboard])

    const totalConversions =
        dashboard?.conversions?.length ?? 0

    const activatedCount =
        dashboard?.totals?.activated ?? 0

    const activationRate =
        totalConversions > 0
            ? Math.round(
                (activatedCount / totalConversions) *
                100
            )
            : 0

    useEffect(() => {
        loadGrowthData()
    }, [])

    async function loadGrowthData({
        silent = false
    } = {}) {
        try {
            if (silent) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const [
                referralData,
                promoCodeData
            ] = await Promise.all([
                getReferralDashboard(),
                getPromoCodesAdmin()
            ])

            setDashboard(referralData)
            setPromoCodes(promoCodeData)
        } catch (loadError) {
            console.error(loadError)

            setError(
                loadError.message ||
                "We could not load growth data."
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    async function handleCopyReferral() {
        if (!referralLink) return

        try {
            await navigator.clipboard.writeText(
                referralLink
            )

            setCopied(true)

            window.setTimeout(() => {
                setCopied(false)
            }, 2000)
        } catch (copyError) {
            console.error(copyError)

            setError(
                "We could not copy the referral link."
            )
        }
    }

    function handleOpenReferral() {
        if (!referralLink) return

        window.open(
            referralLink,
            "_blank",
            "noopener,noreferrer"
        )
    }

    async function handleCopyPromoCode(promoCode) {
        try {
            await navigator.clipboard.writeText(
                promoCode.code
            )

            setCopiedPromoCodeId(promoCode.id)

            window.setTimeout(() => {
                setCopiedPromoCodeId(null)
            }, 2000)
        } catch (copyError) {
            console.error(copyError)

            setError(
                "We could not copy the promo code."
            )
        }
    }

    async function handleTogglePromoCode(
        promoCode
    ) {
        const nextStatus =
            promoCode.status === "active"
                ? "disabled"
                : "active"

        try {
            setUpdatingPromoCodeId(
                promoCode.id
            )

            setError("")

            const updatedPromoCode =
                await setPromoCodeStatusAdmin({
                    promoCodeId: promoCode.id,
                    status: nextStatus
                })

            setPromoCodes(currentPromoCodes =>
                currentPromoCodes.map(current =>
                    current.id === promoCode.id
                        ? updatedPromoCode
                        : current
                )
            )
        } catch (updateError) {
            console.error(updateError)

            setError(
                updateError.message ||
                "We could not update the promo code."
            )
        } finally {
            setUpdatingPromoCodeId(null)
        }
    }

    async function handleCreatePromoCode(values) {
        try {
            setCreatingPromoCode(true)
            setPromoFormError("")

            const createdPromoCode =
                await createPromoCodeAdmin(values)

            setPromoCodes(currentPromoCodes => [
                createdPromoCode,
                ...currentPromoCodes
            ])

            setPromoFormOpen(false)
        } catch (createError) {
            console.error(createError)

            setPromoFormError(
                createError.message ||
                "We could not create the promotion."
            )
        } finally {
            setCreatingPromoCode(false)
        }
    }

    function handleOpenPromoForm() {
        setPromoFormError("")
        setPromoFormOpen(true)
    }

    function handleClosePromoForm() {
        if (creatingPromoCode) return

        setPromoFormError("")
        setPromoFormOpen(false)
    }

    return (
        <AppPage>
            <PageHeader
                eyebrow="Company"
                title="Growth"
                description="The systems and metrics that help more families discover, adopt, and trust Evergrove."
            />

            <div className="growth-page">
                <section className="growth-hero">
                    <div className="growth-hero__icon">
                        <TrendingUp size={24} />
                    </div>

                    <span>Growth at Evergrove</span>

                    <h2>
                        Grow through trust, usefulness,
                        and families sharing something
                        that helps.
                    </h2>

                    <p>
                        Evergrove should earn growth
                        through a product families value,
                        a message they understand, and an
                        experience they feel comfortable
                        recommending.
                    </p>
                </section>

                {loading && (
                    <section className="growth-loading-card">
                        <LoaderCircle
                            size={28}
                            className="growth-spinner"
                        />

                        <div>
                            <strong>
                                Loading growth activity…
                            </strong>

                            <p>
                                We&apos;re gathering the
                                latest referral and promo
                                code data.
                            </p>
                        </div>
                    </section>
                )}

                {!loading && error && (
                    <section
                        className="growth-error-card"
                        role="alert"
                    >
                        <div>
                            <strong>
                                Growth data could not be
                                loaded.
                            </strong>

                            <p>{error}</p>
                        </div>

                        <Button
                            variant="secondary"
                            onClick={() =>
                                loadGrowthData()
                            }
                        >
                            <RefreshCw size={17} />
                            Try Again
                        </Button>
                    </section>
                )}

                {!loading && dashboard && (
                    <>
                        <SectionCard
                            title="Referral Program"
                            icon={Link2}
                            className="growth-referral-card"
                        >
                            <div className="growth-referral-layout">
                                <div>
                                    <p className="growth-referral-card__intro">
                                        Every household has
                                        one permanent referral
                                        link it can share with
                                        another family.
                                    </p>

                                    <div className="growth-referral-link">
                                        <span>
                                            Current household
                                            referral
                                        </span>

                                        <strong>
                                            {referralLink}
                                        </strong>
                                    </div>

                                    <div className="growth-referral-actions">
                                        <Button
                                            onClick={
                                                handleCopyReferral
                                            }
                                        >
                                            {copied ? (
                                                <>
                                                    <Check
                                                        size={
                                                            17
                                                        }
                                                    />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy
                                                        size={
                                                            17
                                                        }
                                                    />
                                                    Copy Link
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            onClick={
                                                handleOpenReferral
                                            }
                                        >
                                            <ExternalLink
                                                size={17}
                                            />
                                            Open Landing Page
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            onClick={() =>
                                                loadGrowthData({
                                                    silent: true
                                                })
                                            }
                                            disabled={
                                                refreshing
                                            }
                                        >
                                            <RefreshCw
                                                size={17}
                                                className={
                                                    refreshing
                                                        ? "growth-spinner"
                                                        : ""
                                                }
                                            />

                                            {refreshing
                                                ? "Refreshing..."
                                                : "Refresh"}
                                        </Button>
                                    </div>
                                </div>

                                <div className="growth-referral-summary">
                                    <span>
                                        Activation rate
                                    </span>

                                    <strong>
                                        {activationRate}%
                                    </strong>

                                    <p>
                                        {activatedCount} of{" "}
                                        {totalConversions}{" "}
                                        referral starts
                                        completed onboarding.
                                    </p>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Promo Codes"
                            icon={Tag}
                            className="growth-promo-card"
                        >
                            <div className="growth-promo-heading">
                                <div>
                                    <p>
                                        Create and manage
                                        promotional access
                                        codes, special offers,
                                        and launch campaigns.
                                    </p>
                                </div>

                                <Button onClick={handleOpenPromoForm}>
                                    <Tag size={17} />
                                    New Promo Code
                                </Button>
                            </div>

                            {!promoCodes.length ? (
                                <div className="growth-promo-empty">
                                    <strong>
                                        No promo codes yet
                                    </strong>

                                    <p>
                                        Create your first
                                        promotion when you are
                                        ready to grant special
                                        access.
                                    </p>
                                </div>
                            ) : (
                                <div className="growth-promo-list">
                                    {promoCodes.map(
                                        promoCode => {
                                            const isUpdating =
                                                updatingPromoCodeId ===
                                                promoCode.id

                                            const isCopied =
                                                copiedPromoCodeId ===
                                                promoCode.id

                                            return (
                                                <article
                                                    key={
                                                        promoCode.id
                                                    }
                                                    className="growth-promo-item"
                                                >
                                                    <div className="growth-promo-item__main">
                                                        <div>
                                                            <span className="growth-promo-item__name">
                                                                {
                                                                    promoCode.name
                                                                }
                                                            </span>

                                                            <strong>
                                                                {
                                                                    promoCode.code
                                                                }
                                                            </strong>

                                                            {promoCode.description && (
                                                                <p>
                                                                    {
                                                                        promoCode.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>

                                                        <span
                                                            className={`growth-promo-status growth-promo-status--${promoCode.status}`}
                                                        >
                                                            {
                                                                promoCode.status
                                                            }
                                                        </span>
                                                    </div>

                                                    <div className="growth-promo-item__details">
                                                        <div>
                                                            <span>
                                                                Offer
                                                            </span>

                                                            <strong>
                                                                {offerTypeLabels[
                                                                    promoCode
                                                                        .offer_type
                                                                ] ??
                                                                    promoCode.offer_type}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                Usage
                                                            </span>

                                                            <strong>
                                                                {
                                                                    promoCode.redemption_count
                                                                }{" "}
                                                                /{" "}
                                                                {promoCode.max_redemptions ??
                                                                    "Unlimited"}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                Expires
                                                            </span>

                                                            <strong>
                                                                {formatDate(
                                                                    promoCode.expires_at
                                                                )}
                                                            </strong>
                                                        </div>
                                                    </div>

                                                    <div className="growth-promo-item__actions">
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() =>
                                                                handleCopyPromoCode(
                                                                    promoCode
                                                                )
                                                            }
                                                        >
                                                            {isCopied ? (
                                                                <>
                                                                    <Check
                                                                        size={
                                                                            17
                                                                        }
                                                                    />
                                                                    Copied
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy
                                                                        size={
                                                                            17
                                                                        }
                                                                    />
                                                                    Copy
                                                                    Code
                                                                </>
                                                            )}
                                                        </Button>

                                                        <Button
                                                            variant="secondary"
                                                            onClick={() =>
                                                                handleTogglePromoCode(
                                                                    promoCode
                                                                )
                                                            }
                                                            disabled={
                                                                isUpdating ||
                                                                promoCode.status ===
                                                                "expired"
                                                            }
                                                        >
                                                            {isUpdating
                                                                ? "Saving..."
                                                                : promoCode.status ===
                                                                    "active"
                                                                    ? "Disable"
                                                                    : "Activate"}
                                                        </Button>
                                                    </div>
                                                </article>
                                            )
                                        }
                                    )}
                                </div>
                            )}
                        </SectionCard>

                        <section className="growth-section">
                            <div className="growth-section-heading">
                                <span>
                                    Referral performance
                                </span>

                                <h2>
                                    Referral Funnel
                                </h2>

                                <p>
                                    Follow referred families
                                    from the first landing-page
                                    visit through completed
                                    onboarding.
                                </p>
                            </div>

                            <div className="growth-funnel">
                                {funnelStages.map(
                                    (stage, index) => {
                                        const Icon =
                                            stage.icon

                                        const value =
                                            dashboard
                                                .totals?.[
                                            stage.key
                                            ] ?? 0

                                        return (
                                            <div
                                                key={
                                                    stage.key
                                                }
                                                className="growth-funnel-stage-wrap"
                                            >
                                                <article className="growth-funnel-stage">
                                                    <div className="growth-funnel-stage__icon">
                                                        <Icon
                                                            size={
                                                                21
                                                            }
                                                        />
                                                    </div>

                                                    <span>
                                                        {
                                                            stage.label
                                                        }
                                                    </span>

                                                    <strong>
                                                        {
                                                            value
                                                        }
                                                    </strong>

                                                    <p>
                                                        {
                                                            stage.description
                                                        }
                                                    </p>
                                                </article>

                                                {index <
                                                    funnelStages.length -
                                                    1 && (
                                                        <div
                                                            className="growth-funnel-arrow"
                                                            aria-hidden="true"
                                                        >
                                                            →
                                                        </div>
                                                    )}
                                            </div>
                                        )
                                    }
                                )}
                            </div>
                        </section>

                        <section className="growth-metrics-grid">
                            <article className="growth-metric-card">
                                <span>
                                    Total Referral
                                    Starts
                                </span>

                                <strong>
                                    {totalConversions}
                                </strong>

                                <p>
                                    All referral conversions
                                    created from this
                                    household.
                                </p>
                            </article>

                            <article className="growth-metric-card">
                                <span>
                                    Activated Families
                                </span>

                                <strong>
                                    {activatedCount}
                                </strong>

                                <p>
                                    Referred households that
                                    completed onboarding.
                                </p>
                            </article>

                            <article className="growth-metric-card">
                                <span>
                                    Activation Rate
                                </span>

                                <strong>
                                    {activationRate}%
                                </strong>

                                <p>
                                    The share of referral
                                    starts that became active
                                    households.
                                </p>
                            </article>
                        </section>
                    </>
                )}
            </div>

            <PromoCodeForm
                open={promoFormOpen}
                saving={creatingPromoCode}
                error={promoFormError}
                onClose={handleClosePromoForm}
                onSubmit={handleCreatePromoCode}
            />

        </AppPage>
    )
}

function formatDate(value) {
    if (!value) {
        return "No expiration"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return "Unknown"
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date)
}