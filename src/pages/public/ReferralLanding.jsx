import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
    ArrowRight,
    CalendarDays,
    Check,
    ClipboardCheck,
    Heart,
    Home,
    Leaf,
    LoaderCircle,
    ShieldCheck,
    ShoppingCart,
    Sparkles,
    UtensilsCrossed
} from "lucide-react"

import {
    getReferralByCode,
    saveReferralAttribution,
    startReferralConversion
} from "../../services/referralService"

const benefits = [
    {
        title: "One shared calendar",
        description:
            "Keep appointments, school, activities, birthdays, trips, and important dates together.",
        icon: CalendarDays
    },
    {
        title: "Shared to-dos",
        description:
            "Make responsibilities visible and help everyone know what needs attention.",
        icon: ClipboardCheck
    },
    {
        title: "Meals and shopping",
        description:
            "Plan dinner, save family favorites, and keep grocery lists connected.",
        icon: UtensilsCrossed
    },
    {
        title: "Everyday family life",
        description:
            "Bring the important parts of household life into one calm, connected place.",
        icon: Home
    }
]

export default function ReferralLanding() {
    const { code } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [continuing, setContinuing] = useState(false)
    const [referral, setReferral] = useState(null)
    const [error, setError] = useState("")

    useEffect(() => {
        let active = true

        async function loadReferral() {
            try {
                setLoading(true)
                setError("")

                const referralData =
                    await getReferralByCode(code)

                if (!active) return

                if (!referralData) {
                    setError(
                        "This referral link is no longer available."
                    )
                    return
                }

                setReferral(referralData)
            } catch (loadError) {
                console.error(loadError)

                if (active) {
                    setError(
                        "We could not open this referral link."
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
    }, [code])

    async function handleGetStarted() {
        if (!referral?.id) return

        try {
            setContinuing(true)
            setError("")

            const conversion =
                await startReferralConversion(referral.id)

            saveReferralAttribution({
                referralId: referral.id,
                referralCode: referral.referral_code,
                conversionId: conversion.id
            })

            navigate("/login?mode=signup")
        } catch (continueError) {
            console.error(continueError)

            setError(
                "We could not continue with this referral. Please try again."
            )
        } finally {
            setContinuing(false)
        }
    }

    if (loading) {
        return (
            <div className="referral-v2-state-page">
                <div className="referral-v2-state-card">
                    <LoaderCircle
                        size={34}
                        className="referral-v2-spinner"
                    />

                    <h1>Opening your referral…</h1>

                    <p>
                        We&apos;re getting Evergrove ready for your
                        family.
                    </p>
                </div>
            </div>
        )
    }

    if (error || !referral) {
        return (
            <div className="referral-v2-state-page">
                <div className="referral-v2-state-card">
                    <div className="referral-v2-state-icon">
                        <ShieldCheck size={28} />
                    </div>

                    <span>Referral unavailable</span>

                    <h1>This link could not be opened.</h1>

                    <p>
                        {error ||
                            "The referral may have expired or been disabled."}
                    </p>

                    <Link
                        to="/"
                        className="public-site-button public-site-button--primary"
                    >
                        Visit Evergrove
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <>
            <section className="referral-v2-hero">
                <div className="referral-v2-hero__copy">
                    <div className="public-site-eyebrow">
                        <Heart size={16} />
                        <span>A family shared Evergrove with you</span>
                    </div>

                    <h1>
                        Welcome home.
                        <span>
                            Another family thinks Evergrove could
                            help yours.
                        </span>
                    </h1>

                    <p>
                        Evergrove gives busy households one calm
                        place for calendars, meals, to-dos,
                        shopping, school, trips, and everyday life.
                    </p>

                    <div className="referral-v2-hero__actions">
                        <button
                            type="button"
                            className="public-site-button public-site-button--primary"
                            onClick={handleGetStarted}
                            disabled={continuing}
                        >
                            {continuing
                                ? "Getting Started…"
                                : "Create My Household"}

                            {!continuing && (
                                <ArrowRight size={18} />
                            )}
                        </button>

                        <Link
                            to="/"
                            className="public-site-button public-site-button--secondary"
                        >
                            Learn More About Evergrove
                        </Link>
                    </div>

                    <div className="referral-v2-hero__details">
                        <span>
                            <Check size={15} />
                            Free during beta
                        </span>

                        <span>
                            <Check size={15} />
                            Creates your own household
                        </span>

                        <span>
                            <Check size={15} />
                            Mobile-first
                        </span>
                    </div>

                    {error && (
                        <div
                            className="referral-v2-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}
                </div>

                <div className="referral-v2-hero__visual">
                    <div className="referral-v2-welcome-card">
                        <div className="referral-v2-welcome-card__icon">
                            <Leaf size={30} />
                        </div>

                        <span>Where organized families grow</span>

                        <h2>
                            One less thing for your family to
                            remember.
                        </h2>

                        <p>
                            Stay organized without turning family
                            life into another job.
                        </p>

                        <div className="referral-v2-welcome-card__note">
                            <Sparkles size={17} />

                            <span>
                                Shared by a family already using
                                Evergrove
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="public-site-section referral-v2-benefits">
                <div className="public-site-section-heading public-site-section-heading--centered">
                    <span>What Evergrove brings together</span>

                    <h2>
                        Everything important. One family home.
                    </h2>

                    <p>
                        Evergrove connects the everyday systems
                        households already depend on, so fewer things
                        rely on memory alone.
                    </p>
                </div>

                <div className="referral-v2-benefit-grid">
                    {benefits.map(benefit => {
                        const Icon = benefit.icon

                        return (
                            <article
                                key={benefit.title}
                                className="referral-v2-benefit-card"
                            >
                                <div>
                                    <Icon size={23} />
                                </div>

                                <h3>{benefit.title}</h3>
                                <p>{benefit.description}</p>
                            </article>
                        )
                    })}
                </div>
            </section>

            <section className="referral-v2-story">
                <div className="referral-v2-story__content">
                    <span>Why families share Evergrove</span>

                    <h2>
                        Family life should not depend on one person
                        remembering everything.
                    </h2>

                    <p>
                        Evergrove helps households stay connected
                        around what matters, before important details
                        become urgent.
                    </p>

                    <div className="referral-v2-story__outcomes">
                        <strong>Less mental load.</strong>
                        <strong>More confidence.</strong>
                        <strong>More family.</strong>
                    </div>
                </div>

                <div className="referral-v2-story__quote">
                    <Heart size={28} />

                    <blockquote>
                        The best recommendations come from families
                        sharing something that genuinely helps.
                    </blockquote>
                </div>
            </section>

            <section className="referral-v2-final-cta">
                <div className="referral-v2-final-cta__icon">
                    <Leaf size={26} />
                </div>

                <span>Ready to begin?</span>

                <h2>
                    Create a home for your family&apos;s life.
                </h2>

                <p>
                    Start your own Evergrove household and bring the
                    important parts of family life together.
                </p>

                <button
                    type="button"
                    className="public-site-button public-site-button--primary"
                    onClick={handleGetStarted}
                    disabled={continuing}
                >
                    {continuing
                        ? "Getting Started…"
                        : "Create My Household"}

                    {!continuing && (
                        <ArrowRight size={18} />
                    )}
                </button>

                <p className="referral-v2-existing-account">
                    Already have an Evergrove account?{" "}
                    <Link to="/login?mode=signin">
                        Sign in
                    </Link>
                </p>
            </section>
        </>
    )
}