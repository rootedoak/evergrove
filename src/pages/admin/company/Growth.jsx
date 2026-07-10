import { useState } from "react"
import {
    Check,
    Copy,
    ExternalLink,
    Link2,
    LoaderCircle,
    RefreshCw,
    TrendingUp
} from "lucide-react"

import AppPage from "../../../components/ui/AppPage"
import PageHeader from "../../../components/ui/PageHeader"
import SectionCard from "../../../components/ui/SectionCard"
import Button from "../../../components/ui/Button"

import {
    buildReferralUrl,
    getOrCreateHouseholdReferral
} from "../../../services/referralService"

export default function Growth() {
    const [referralLink, setReferralLink] = useState("")
    const [loadingReferral, setLoadingReferral] = useState(false)
    const [referralError, setReferralError] = useState("")
    const [copied, setCopied] = useState(false)

    async function handleGenerateReferral() {
        try {
            setLoadingReferral(true)
            setReferralError("")
            setCopied(false)

            const referral = await getOrCreateHouseholdReferral()

            setReferralLink(
                buildReferralUrl(referral.referral_code)
            )
        } catch (error) {
            console.error(error)

            setReferralError(
                error.message ||
                "We could not create a referral link."
            )
        } finally {
            setLoadingReferral(false)
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
        } catch (error) {
            console.error(error)

            setReferralError(
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
                description="The systems, experiments, and metrics that help more families discover and adopt Evergrove."
            />

            <div className="growth-page">
                <section className="growth-hero">
                    <div className="growth-hero__icon">
                        <TrendingUp size={24} />
                    </div>

                    <span>Growth at Evergrove</span>

                    <h2>
                        Grow through trust, usefulness, and families
                        sharing something that helps.
                    </h2>

                    <p>
                        Evergrove should earn growth through a product
                        families value, a message they understand, and
                        an experience they feel comfortable recommending.
                    </p>
                </section>

                <SectionCard
                    title="Referral Testing"
                    icon={Link2}
                    className="growth-referral-card"
                >
                    <p className="growth-referral-card__intro">
                        Generate the referral link for your current
                        household, then open it in an incognito window
                        to test the public referral experience.
                    </p>

                    {!referralLink && (
                        <Button
                            onClick={handleGenerateReferral}
                            disabled={loadingReferral}
                        >
                            {loadingReferral ? (
                                <>
                                    <LoaderCircle
                                        size={17}
                                        className="growth-spinner"
                                    />
                                    Generating Link...
                                </>
                            ) : (
                                <>
                                    <Link2 size={17} />
                                    Generate Referral Link
                                </>
                            )}
                        </Button>
                    )}

                    {referralLink && (
                        <div className="growth-referral-result">
                            <div className="growth-referral-link">
                                <span>Current household referral</span>
                                <strong>{referralLink}</strong>
                            </div>

                            <div className="growth-referral-actions">
                                <Button
                                    onClick={handleCopyReferral}
                                >
                                    {copied ? (
                                        <>
                                            <Check size={17} />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={17} />
                                            Copy Link
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={handleOpenReferral}
                                >
                                    <ExternalLink size={17} />
                                    Open Link
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={handleGenerateReferral}
                                    disabled={loadingReferral}
                                >
                                    <RefreshCw size={17} />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    )}

                    {referralError && (
                        <div
                            className="growth-referral-error"
                            role="alert"
                        >
                            {referralError}
                        </div>
                    )}
                </SectionCard>
            </div>
        </AppPage>
    )
}