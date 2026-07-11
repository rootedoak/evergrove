import { useEffect, useMemo, useState } from "react"
import {
    Check,
    Copy,
    ExternalLink,
    Link2,
    LoaderCircle,
    RefreshCw,
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

export default function Growth() {
    const [dashboard, setDashboard] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState("")
    const [copied, setCopied] = useState(false)

    const referralLink = useMemo(() => {
        const referralCode = dashboard?.referral?.referral_code

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
                (activatedCount / totalConversions) * 100
            )
            : 0

    useEffect(() => {
        loadDashboard()
    }, [])

    async function loadDashboard({ silent = false } = {}) {
        try {
            if (silent) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const data = await getReferralDashboard()

            setDashboard(data)
        } catch (loadError) {
            console.error(loadError)

            setError(
                loadError.message ||
                "We could not load referral activity."
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    async function handleCopyReferral() {
        if (!referralLink) return

        try {
            await navigator.clipboard.writeText(referralLink)
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
                        Grow through trust, usefulness, and
                        families sharing something that helps.
                    </h2>

                    <p>
                        Evergrove should earn growth through a
                        product families value, a message they
                        understand, and an experience they feel
                        comfortable recommending.
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
                                Loading referral activity…
                            </strong>

                            <p>
                                We&apos;re gathering the latest
                                referral program data.
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
                                Referral data could not be loaded.
                            </strong>

                            <p>{error}</p>
                        </div>

                        <Button
                            variant="secondary"
                            onClick={() => loadDashboard()}
                        >
                            <RefreshCw size={17} />
                            Try Again
                        </Button>
                    </section>
                )}

                {!loading && !error && dashboard && (
                    <>
                        <SectionCard
                            title="Referral Program"
                            icon={Link2}
                            className="growth-referral-card"
                        >
                            <div className="growth-referral-layout">
                                <div>
                                    <p className="growth-referral-card__intro">
                                        Every household has one
                                        permanent referral link it
                                        can share with another
                                        family.
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
                                                        size={17}
                                                    />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy
                                                        size={17}
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
                                                loadDashboard({
                                                    silent: true
                                                })
                                            }
                                            disabled={refreshing}
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
                                    <span>Activation rate</span>

                                    <strong>
                                        {activationRate}%
                                    </strong>

                                    <p>
                                        {activatedCount} of{" "}
                                        {totalConversions} referral
                                        starts completed onboarding.
                                    </p>
                                </div>
                            </div>
                        </SectionCard>

                        <section className="growth-section">
                            <div className="growth-section-heading">
                                <span>
                                    Referral performance
                                </span>

                                <h2>Referral Funnel</h2>

                                <p>
                                    Follow referred families from
                                    the first landing-page visit
                                    through completed onboarding.
                                </p>
                            </div>

                            <div className="growth-funnel">
                                {funnelStages.map(
                                    (stage, index) => {
                                        const Icon = stage.icon
                                        const value =
                                            dashboard.totals?.[
                                            stage.key
                                            ] ?? 0

                                        return (
                                            <div
                                                key={stage.key}
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
                                                        {value}
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
                                <span>Total Referral Starts</span>
                                <strong>
                                    {totalConversions}
                                </strong>
                                <p>
                                    All referral conversions
                                    created from this household.
                                </p>
                            </article>

                            <article className="growth-metric-card">
                                <span>Activated Families</span>
                                <strong>
                                    {activatedCount}
                                </strong>
                                <p>
                                    Referred households that
                                    completed onboarding.
                                </p>
                            </article>

                            <article className="growth-metric-card">
                                <span>Activation Rate</span>
                                <strong>
                                    {activationRate}%
                                </strong>
                                <p>
                                    The share of referral starts
                                    that became active households.
                                </p>
                            </article>
                        </section>
                    </>
                )}
            </div>
        </AppPage>
    )
}