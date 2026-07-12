import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Eye,
    EyeOff,
    Heart,
    Leaf,
    LockKeyhole,
    Mail,
    Sparkles,
    Users
} from "lucide-react"

import { supabase } from "../lib/supabase"
import { markReferralAccountCreated } from "../services/referralService"

import logo from "../assets/evergrove-logo.svg"
import "../styles/public.css"

import {
    acceptLegalDocuments,
    getRequiredLegalAcceptances,
    recordLegalAttestations
} from "../services/legalAcceptanceService"

const MODES = {
    CHOOSE: "choose",
    SIGN_IN: "sign-in",
    CREATE_ACCOUNT: "create-account",
    INVITE: "invite",
    VERIFY_EMAIL: "verify-email"
}

const benefits = [
    "Keep schedules, meals, to-dos, and shopping together",
    "Share the mental load across your household",
    "Feel confident that important things are remembered"
]

export default function Login({ onLogin }) {
    const [searchParams, setSearchParams] = useSearchParams()

    const [mode, setMode] = useState(MODES.CHOOSE)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const [confirmedAdult, setConfirmedAdult] = useState(false)
    const [acceptedLegal, setAcceptedLegal] = useState(false)

    useEffect(() => {
        const modeParam = searchParams.get("mode")

        if (
            modeParam === "signup" ||
            modeParam === "create-account"
        ) {
            setMode(MODES.CREATE_ACCOUNT)
            return
        }

        if (
            modeParam === "signin" ||
            modeParam === "sign-in"
        ) {
            setMode(MODES.SIGN_IN)
            return
        }

        if (modeParam === "invite") {
            setMode(MODES.INVITE)
            return
        }

        setMode(MODES.CHOOSE)
    }, [searchParams])

    function changeMode(nextMode) {
        setMode(nextMode)
        setPassword("")
        setErrorMessage("")
        setShowPassword(false)

        setConfirmedAdult(false)
        setAcceptedLegal(false)

        const queryModeMap = {
            [MODES.CHOOSE]: null,
            [MODES.SIGN_IN]: "signin",
            [MODES.CREATE_ACCOUNT]: "signup",
            [MODES.INVITE]: "invite"
        }

        const queryMode = queryModeMap[nextMode]

        if (!queryMode) {
            setSearchParams({})
            return
        }

        setSearchParams({ mode: queryMode })
    }

    async function handleSignIn(event) {
        event.preventDefault()
        setErrorMessage("")
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            })

            if (error) {
                setErrorMessage(
                    error.message === "Invalid login credentials"
                        ? "That email or password does not look right."
                        : error.message
                )
                return
            }

            const storedInviteEmail = localStorage.getItem(
                "evergrove_invite_email"
            )

            if (storedInviteEmail) {
                window.location.href = "/join-household"
                return
            }

            onLogin?.()
        } catch (error) {
            console.error(error)
            setErrorMessage(
                error.message || "We could not sign you in."
            )
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateAccount(event) {
        event.preventDefault()
        setErrorMessage("")
        setLoading(true)

        if (!confirmedAdult) {
            setErrorMessage(
                "You must confirm that you are at least 18 years old."
            )
            setLoading(false)
            return
        }

        if (!acceptedLegal) {
            setErrorMessage(
                "Please review and accept Evergrove's policies."
            )
            setLoading(false)
            return
        }

        const normalizedEmail = email.trim().toLowerCase()
        const inviteToken = localStorage.getItem(
            "evergrove_invite_token"
        )

        try {
            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
                options: {
                    emailRedirectTo: inviteToken
                        ? `${window.location.origin}/invite/${inviteToken}`
                        : `${window.location.origin}`
                }
            })

            if (error) {
                if (
                    error.status === 429 ||
                    error.message?.toLowerCase().includes("rate")
                ) {
                    setErrorMessage(
                        "Too many signup attempts. Wait a few minutes, then try again."
                    )
                    return
                }

                setErrorMessage(error.message)
                return
            }

            const createdUserId =
                data.user?.id ??
                data.session?.user?.id

            if (createdUserId) {
                await markReferralAccountCreated(createdUserId)
            }

            if (data.session) {
                const requiredDocuments =
                    await getRequiredLegalAcceptances()

                await acceptLegalDocuments({
                    documents: requiredDocuments,
                    acceptanceMethod: "signup",
                    adultEligibilityConfirmed: true
                })

                await recordLegalAttestations([
                    {
                        type: "adult_account_eligibility",
                        version: "1.0"
                    }
                ])
            }

            setEmail(normalizedEmail)

            if (!data.session) {
                setMode(MODES.VERIFY_EMAIL)
                return
            }

            if (inviteToken) {
                window.location.href = "/join-household"
                return
            }

            onLogin?.()
        } catch (error) {
            console.error(error)
            setErrorMessage(
                error.message || "We could not create your account."
            )
        } finally {
            setLoading(false)
        }
    }

    async function handleInvite(event) {
        event.preventDefault()
        setErrorMessage("")
        setLoading(true)

        const normalizedEmail = email.trim().toLowerCase()
        const inviteToken = localStorage.getItem(
            "evergrove_invite_token"
        )

        try {
            localStorage.setItem(
                "evergrove_invite_email",
                normalizedEmail
            )

            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
                options: {
                    emailRedirectTo: inviteToken
                        ? `${window.location.origin}/invite/${inviteToken}`
                        : `${window.location.origin}`
                }
            })

            if (error) {
                const signInResult =
                    await supabase.auth.signInWithPassword({
                        email: normalizedEmail,
                        password
                    })

                if (signInResult.error) {
                    setErrorMessage(
                        "We could not create or sign in to that account. If you already have an account, use your existing password."
                    )
                    return
                }

                window.location.href = "/join-household"
                return
            }

            if (!data.session) {
                setMode(MODES.VERIFY_EMAIL)
                return
            }

            window.location.href = "/join-household"
        } catch (error) {
            console.error(error)
            setErrorMessage(
                error.message ||
                "We could not continue your invitation."
            )
        } finally {
            setLoading(false)
        }
    }

    const isFormMode =
        mode === MODES.SIGN_IN ||
        mode === MODES.CREATE_ACCOUNT ||
        mode === MODES.INVITE

    return (
        <div className="auth-page">
            <header className="auth-header">
                <Link to="/" className="auth-brand">
                    <img src={logo} alt="Evergrove" />

                    <div>
                        <strong>Evergrove</strong>
                        <span>Where organized families grow.</span>
                    </div>
                </Link>

                <Link to="/" className="auth-home-link">
                    <ArrowLeft size={16} />
                    Back to Evergrove
                </Link>
            </header>

            <main className="auth-layout">
                <section className="auth-story-panel">
                    <div className="auth-story-panel__content">
                        <div className="auth-eyebrow">
                            <Leaf size={16} />
                            <span>Welcome home</span>
                        </div>

                        <h1>
                            Give your family one less thing to remember.
                        </h1>

                        <p>
                            Evergrove brings schedules, meals, to-dos,
                            shopping, school, and everyday family life into
                            one calm, connected place.
                        </p>

                        <div className="auth-benefit-list">
                            {benefits.map(benefit => (
                                <div key={benefit}>
                                    <span>
                                        <Check
                                            size={15}
                                            strokeWidth={3}
                                        />
                                    </span>

                                    <p>{benefit}</p>
                                </div>
                            ))}
                        </div>

                        <blockquote>
                            “Spend less time managing life and more time
                            living it.”
                        </blockquote>
                    </div>
                </section>

                <section className="auth-form-panel">
                    <div className="auth-card">
                        {mode === MODES.CHOOSE && (
                            <div className="auth-choice">
                                <div className="auth-card-icon">
                                    <Heart size={23} />
                                </div>

                                <span className="auth-card-eyebrow">
                                    Get started
                                </span>

                                <h2>Bring your family home.</h2>

                                <p>
                                    Create your household, invite your family,
                                    and start organizing life together.
                                </p>

                                <button
                                    type="button"
                                    className="auth-primary-button"
                                    onClick={() =>
                                        changeMode(
                                            MODES.CREATE_ACCOUNT
                                        )
                                    }
                                >
                                    Get Started Free
                                    <ArrowRight size={18} />
                                </button>

                                <div className="auth-divider">
                                    <span>Already use Evergrove?</span>
                                </div>

                                <button
                                    type="button"
                                    className="auth-secondary-button"
                                    onClick={() =>
                                        changeMode(MODES.SIGN_IN)
                                    }
                                >
                                    Sign In
                                </button>

                                <button
                                    type="button"
                                    className="auth-text-button"
                                    onClick={() =>
                                        changeMode(MODES.INVITE)
                                    }
                                >
                                    I was invited to a household
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        )}

                        {isFormMode && (
                            <button
                                type="button"
                                className="auth-back-button"
                                onClick={() =>
                                    changeMode(MODES.CHOOSE)
                                }
                            >
                                <ArrowLeft size={16} />
                                Back
                            </button>
                        )}

                        {mode === MODES.SIGN_IN && (
                            <form
                                className="auth-form"
                                onSubmit={handleSignIn}
                            >
                                <div className="auth-card-icon">
                                    <LockKeyhole size={23} />
                                </div>

                                <span className="auth-card-eyebrow">
                                    Welcome back
                                </span>

                                <h2>Sign in to your household.</h2>

                                <p>
                                    Pick up where your family left off.
                                </p>

                                {errorMessage && (
                                    <div
                                        className="auth-error"
                                        role="alert"
                                    >
                                        {errorMessage}
                                    </div>
                                )}

                                <label className="auth-field">
                                    <span>Email</span>

                                    <div className="auth-input-wrap">
                                        <Mail size={18} />

                                        <input
                                            type="email"
                                            value={email}
                                            onChange={event =>
                                                setEmail(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                </label>

                                <PasswordField
                                    password={password}
                                    setPassword={setPassword}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                    autoComplete="current-password"
                                />

                                <button
                                    type="submit"
                                    className="auth-primary-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Signing In..."
                                        : "Sign In"}

                                    {!loading && (
                                        <ArrowRight size={18} />
                                    )}
                                </button>

                                <p className="auth-switch-copy">
                                    New to Evergrove?{" "}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            changeMode(
                                                MODES.CREATE_ACCOUNT
                                            )
                                        }
                                    >
                                        Create your household
                                    </button>
                                </p>
                            </form>
                        )}

                        {mode === MODES.CREATE_ACCOUNT && (
                            <form
                                className="auth-form"
                                onSubmit={handleCreateAccount}
                            >
                                <div className="auth-card-icon">
                                    <Users size={23} />
                                </div>

                                <span className="auth-card-eyebrow">
                                    Start your household
                                </span>

                                <h2>Let&apos;s get your family started.</h2>

                                <p>
                                    Your account will become the first member
                                    of your new Evergrove household.
                                </p>

                                {errorMessage && (
                                    <div
                                        className="auth-error"
                                        role="alert"
                                    >
                                        {errorMessage}
                                    </div>
                                )}

                                <label className="auth-field">
                                    <span>Email</span>

                                    <div className="auth-input-wrap">
                                        <Mail size={18} />

                                        <input
                                            type="email"
                                            value={email}
                                            onChange={event =>
                                                setEmail(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                </label>

                                <PasswordField
                                    password={password}
                                    setPassword={setPassword}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                    autoComplete="new-password"
                                />

                                <p className="auth-password-help">
                                    Use at least 8 characters.
                                </p>

                                <div className="auth-legal">
                                    <label className="auth-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={confirmedAdult}
                                            onChange={event =>
                                                setConfirmedAdult(event.target.checked)
                                            }
                                        />

                                        <span>
                                            I confirm that I am at least 18 years old
                                            and am creating an account for myself.
                                        </span>
                                    </label>

                                    <label className="auth-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={acceptedLegal}
                                            onChange={event =>
                                                setAcceptedLegal(event.target.checked)
                                            }
                                        />

                                        <span>
                                            I agree to the{" "}
                                            <Link
                                                to="/trust/terms"
                                                target="_blank"
                                            >
                                                Terms of Service
                                            </Link>
                                            , acknowledge the{" "}
                                            <Link
                                                to="/trust/privacy"
                                                target="_blank"
                                            >
                                                Privacy Policy
                                            </Link>
                                            , and agree to the{" "}
                                            <Link
                                                to="/trust/beta"
                                                target="_blank"
                                            >
                                                Beta Program Agreement
                                            </Link>
                                            .
                                        </span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="auth-primary-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Creating Your Account..."
                                        : "Create My Household"}

                                    {!loading && (
                                        <ArrowRight size={18} />
                                    )}
                                </button>

                                <p className="auth-switch-copy">
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            changeMode(MODES.SIGN_IN)
                                        }
                                    >
                                        Sign in
                                    </button>
                                </p>
                            </form>
                        )}

                        {mode === MODES.INVITE && (
                            <form
                                className="auth-form"
                                onSubmit={handleInvite}
                            >
                                <div className="auth-card-icon">
                                    <Sparkles size={23} />
                                </div>

                                <span className="auth-card-eyebrow">
                                    Join your family
                                </span>

                                <h2>Continue your invitation.</h2>

                                <p>
                                    Enter the email address that was invited.
                                    Use your existing password, or create one
                                    if this is your first time.
                                </p>

                                {errorMessage && (
                                    <div
                                        className="auth-error"
                                        role="alert"
                                    >
                                        {errorMessage}
                                    </div>
                                )}

                                <label className="auth-field">
                                    <span>Invited email</span>

                                    <div className="auth-input-wrap">
                                        <Mail size={18} />

                                        <input
                                            type="email"
                                            value={email}
                                            onChange={event =>
                                                setEmail(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                </label>

                                <PasswordField
                                    password={password}
                                    setPassword={setPassword}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                    autoComplete="current-password"
                                    label="Password"
                                />

                                <button
                                    type="submit"
                                    className="auth-primary-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Continuing..."
                                        : "Continue Invitation"}

                                    {!loading && (
                                        <ArrowRight size={18} />
                                    )}
                                </button>
                            </form>
                        )}

                        {mode === MODES.VERIFY_EMAIL && (
                            <div className="auth-verify">
                                <div className="auth-card-icon">
                                    <Mail size={23} />
                                </div>

                                <span className="auth-card-eyebrow">
                                    Almost home
                                </span>

                                <h2>Check your email.</h2>

                                <p>
                                    We sent a verification link to:
                                </p>

                                <strong>{email}</strong>

                                <p>
                                    After verifying your email, return to
                                    Evergrove and sign in to finish setting
                                    up your household.
                                </p>

                                <button
                                    type="button"
                                    className="auth-primary-button"
                                    onClick={() =>
                                        changeMode(MODES.SIGN_IN)
                                    }
                                >
                                    Back to Sign In
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}

function PasswordField({
    password,
    setPassword,
    showPassword,
    setShowPassword,
    autoComplete,
    label = "Password"
}) {
    return (
        <label className="auth-field">
            <span>{label}</span>

            <div className="auth-input-wrap">
                <LockKeyhole size={18} />

                <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={event =>
                        setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete={autoComplete}
                    minLength={8}
                    required
                />

                <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                        setShowPassword(current => !current)
                    }
                    aria-label={
                        showPassword
                            ? "Hide password"
                            : "Show password"
                    }
                >
                    {showPassword ? (
                        <EyeOff size={18} />
                    ) : (
                        <Eye size={18} />
                    )}
                </button>
            </div>
        </label>
    )
}