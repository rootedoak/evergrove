import { useEffect, useMemo, useState } from "react"
import {
    Check,
    Copy,
    ExternalLink,
    Heart,
    LoaderCircle,
    Share2
} from "lucide-react"

import SectionCard from "../ui/SectionCard"
import Button from "../ui/Button"

import {
    buildReferralUrl,
    getOrCreateHouseholdReferral
} from "../../services/referralService"

export default function ShareEvergroveCard() {
    const [referral, setReferral] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sharing, setSharing] = useState(false)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState("")

    const referralLink = useMemo(() => {
        if (!referral?.referral_code) return ""

        return buildReferralUrl(referral.referral_code)
    }, [referral])

    const supportsNativeShare =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"

    useEffect(() => {
        let active = true

        async function loadReferral() {
            try {
                setLoading(true)
                setError("")

                const data =
                    await getOrCreateHouseholdReferral()

                if (active) {
                    setReferral(data)
                }
            } catch (loadError) {
                console.error(loadError)

                if (active) {
                    setError(
                        loadError.message ||
                        "We could not load your referral link."
                    )
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        loadReferral()

        return () => {
            active = false
        }
    }, [])

    async function handleCopy() {
        if (!referralLink) return

        try {
            await navigator.clipboard.writeText(referralLink)
            setCopied(true)

            window.setTimeout(() => {
                setCopied(false)
            }, 2000)
        } catch (copyError) {
            console.error(copyError)
            setError("We could not copy your referral link.")
        }
    }

    async function handleShare() {
        if (!referralLink || !supportsNativeShare) return

        try {
            setSharing(true)
            setError("")

            await navigator.share({
                title: "Evergrove",
                text:
                    "Evergrove helps families keep schedules, meals, to-dos, shopping, and everyday life organized in one place.",
                url: referralLink
            })
        } catch (shareError) {
            // Closing the share sheet is not a real error.
            if (shareError?.name !== "AbortError") {
                console.error(shareError)
                setError("We could not open the share menu.")
            }
        } finally {
            setSharing(false)
        }
    }

    function handleOpen() {
        if (!referralLink) return

        window.open(
            referralLink,
            "_blank",
            "noopener,noreferrer"
        )
    }

    return (
        <SectionCard
            title="Share Evergrove"
            icon={Heart}
            className="share-evergrove-card"
        >
            <div className="share-evergrove-content">
                <div>
                    <p className="share-evergrove-intro">
                        Know another family that could use a little
                        less mental load?
                    </p>

                    <p className="share-evergrove-description">
                        Share Evergrove with them. Your link helps
                        them create their own separate household.
                    </p>
                </div>

                {loading && (
                    <div className="share-evergrove-loading">
                        <LoaderCircle
                            size={20}
                            className="share-evergrove-spinner"
                        />

                        <span>Preparing your link…</span>
                    </div>
                )}

                {!loading && error && (
                    <div
                        className="share-evergrove-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {!loading && !error && referralLink && (
                    <>
                        <div className="share-evergrove-link">
                            <span>Your family referral link</span>
                            <strong>{referralLink}</strong>
                        </div>

                        <div className="share-evergrove-actions">
                            {supportsNativeShare && (
                                <Button
                                    onClick={handleShare}
                                    disabled={sharing}
                                >
                                    <Share2 size={17} />

                                    {sharing
                                        ? "Opening..."
                                        : "Share"}
                                </Button>
                            )}

                            <Button
                                variant={
                                    supportsNativeShare
                                        ? "secondary"
                                        : undefined
                                }
                                onClick={handleCopy}
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
                                onClick={handleOpen}
                            >
                                <ExternalLink size={17} />
                                Preview
                            </Button>
                        </div>

                        <p className="share-evergrove-note">
                            This link creates a new household. It does
                            not invite someone into your current
                            household.
                        </p>
                    </>
                )}
            </div>
        </SectionCard>
    )
}