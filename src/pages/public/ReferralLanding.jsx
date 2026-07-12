import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
    ArrowRight,
    Check,
    Heart,
    Leaf,
    LoaderCircle,
    ShieldCheck,
    Users
} from "lucide-react"

import logo from "../../assets/evergrove-logo.svg"

import "../../styles/public.css"

import {
    getReferralByCode,
    saveReferralAttribution,
    startReferralConversion
} from "../../services/referralService"

export default function ReferralLanding() {
    const { code } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [referral, setReferral] = useState(null)
    const [error, setError] = useState("")
    const [continuing, setContinuing] = useState(false)

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
                        "We could not load this referral link."
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

    return (
        <div className="referral-public-page">
            <header className="referral-public-header">
                <Link to="/" className="auth-brand">
                    <img src={logo} alt="Evergrove" />

                    <div>
                        <strong>Evergrove</strong>
                        <span>
                            Where organized families grow.
                        </span>
                    </div>
                </Link>

                <Link
                    to="/login?mode=signin"
                    className="referral-sign-in-link"
                >
                    Sign In
                </Link>
            </header>

            <main className="referral-public-main">
                <section className="referral-public-story">
                    <div className="referral-public-story__content">
                        <div className="referral-public-eyebrow">
                            <Heart size={16} />
                            <span>You&apos;ve been invited</span>
                        </div>

                        <h1>
                            Another family thinks Evergrove
                            could help yours.
                        </h1>

                        <p>
                            Evergrove brings schedules, meals,
                            to-dos, shopping, school, and family
                            communication into one calm,
                            connected place.
                        </p>

                        <div className="referral-public-benefits">
                            <div>
                                <Check size={16} />
                                <span>
                                    Reduce the mental load of
                                    everyday family life
                                </span>
                            </div>

                            <div>
                                <Check size={16} />
                                <span>
                                    Keep important responsibilities
                                    visible and organized
                                </span>
                            </div>

                            <div>
                                <Check size={16} />
                                <span>
                                    Help everyone stay on the same
                                    page
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="referral-public-action">
                    <div className="referral-public-card">
                        {loading && (
                            <div className="referral-public-state">
                                <LoaderCircle
                                    size={30}
                                    className="referral-spinner"
                                />

                                <h2>
                                    Opening your invitation…
                                </h2>

                                <p>
                                    We&apos;re getting Evergrove
                                    ready for your family.
                                </p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="referral-public-state">
                                <div className="referral-public-icon">
                                    <ShieldCheck size={25} />
                                </div>

                                <h2>
                                    This link could not be opened.
                                </h2>

                                <p>{error}</p>

                                <Link
                                    to="/"
                                    className="auth-secondary-button"
                                >
                                    Visit Evergrove
                                </Link>
                            </div>
                        )}

                        {!loading && referral && (
                            <>
                                <div className="referral-public-icon">
                                    <Leaf size={25} />
                                </div>

                                <span className="auth-card-eyebrow">
                                    Welcome to Evergrove
                                </span>

                                <h2>
                                    Create a home for your
                                    family&apos;s life.
                                </h2>

                                <p>
                                    Start a new household and see
                                    how Evergrove can help your
                                    family feel more prepared,
                                    connected, and confident.
                                </p>

                                <button
                                    type="button"
                                    className="auth-primary-button"
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

                                <div className="referral-public-note">
                                    <Users size={17} />

                                    <span>
                                        This creates a new
                                        household. It will not add
                                        you to the household that
                                        referred you.
                                    </span>
                                </div>

                                <p className="referral-public-existing">
                                    Already have an account?{" "}
                                    <Link to="/login?mode=signin">
                                        Sign in
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}