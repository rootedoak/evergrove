import { useState } from "react"
import { supabase } from "../lib/supabase"

import logo from "../assets/evergrove-logo.svg"

const MODES = {
    CHOOSE: "choose",
    SIGN_IN: "sign-in",
    CREATE_ACCOUNT: "create-account",
    INVITE: "invite",
    VERIFY_EMAIL: "verify-email"
}

export default function Login({ onLogin }) {
    const [mode, setMode] = useState(MODES.CHOOSE)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [inviteCode, setInviteCode] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [loading, setLoading] = useState(false)

    function resetForm(nextMode) {
        setMode(nextMode)
        setEmail("")
        setPassword("")
        setInviteCode("")
        setErrorMessage("")
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
                setErrorMessage(error.message)
                return
            }

            const storedInviteEmail = localStorage.getItem("evergrove_invite_email")

            if (storedInviteEmail) {
                window.location.href = "/join-household"
                return
            }

            onLogin()

        } catch (error) {
            console.error(error)
            setErrorMessage(error.message || "Could not sign in.")
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateAccount(event) {
        event.preventDefault()
        setErrorMessage("")
        setLoading(true)

        const normalizedEmail = email.trim().toLowerCase()

        try {
            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}`
                }
            })

            if (error) {
                if (error.status === 429 || error.message?.toLowerCase().includes("rate")) {
                    setErrorMessage(
                        "Too many signup attempts. Wait a few minutes, then try again."
                    )
                    return
                }

                setErrorMessage(error.message)
                return
            }

            setEmail(normalizedEmail)

            if (!data.session) {
                setMode(MODES.VERIFY_EMAIL)
                return
            }

            onLogin()
        } catch (error) {
            console.error(error)
            setErrorMessage(error.message || "Could not create account.")
        } finally {
            setLoading(false)
        }
    }

    async function handleInvite(event) {
        event.preventDefault()
        setErrorMessage("")
        setLoading(true)

        const normalizedEmail = email.trim().toLowerCase()

        try {
            localStorage.setItem("evergrove_invite_email", normalizedEmail)

            if (inviteCode.trim()) {
                localStorage.setItem(
                    "evergrove_invite_code",
                    inviteCode.trim()
                )
            }

            const inviteToken = localStorage.getItem("evergrove_invite_token")

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
                if (error.status === 429 || error.message?.toLowerCase().includes("rate")) {
                    setErrorMessage(
                        "Too many signup attempts. Wait a few minutes, then try again."
                    )
                    return
                }

                const signInResult = await supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password
                })

                if (signInResult.error) {
                    setErrorMessage(
                        "We could not create or sign into that account. If you already created an account, use your existing password."
                    )
                    return
                }

                window.location.href = "/join-household"
                return
            }

            localStorage.setItem("evergrove_invite_email", normalizedEmail)

            if (!data.session) {
                setMode("verify-email")
                return
            }

            window.location.href = "/join-household"
        } catch (error) {
            console.error(error)
            setErrorMessage(error.message || "Could not continue with invite.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="brand-mark login-mark">E</div>

                <img
                    src={logo}
                    alt="Evergrove"
                    className="login-logo"
                />

                <h1>Evergrove</h1>

                {mode === MODES.CHOOSE && (
                    <>
                        <p>Organize your family in one place.</p>

                        <div className="login-choice-stack">
                            <button
                                type="button"
                                onClick={() => resetForm(MODES.SIGN_IN)}
                            >
                                Sign In
                            </button>

                            <button
                                type="button"
                                onClick={() => resetForm(MODES.CREATE_ACCOUNT)}
                            >
                                Create Account
                            </button>

                            <button
                                type="button"
                                className="login-secondary-action"
                                onClick={() => resetForm(MODES.INVITE)}
                            >
                                I Have an Invite
                            </button>
                        </div>
                    </>
                )}

                {mode === MODES.SIGN_IN && (
                    <form onSubmit={handleSignIn}>
                        <p>Sign in to your family planner.</p>

                        {errorMessage && (
                            <div className="error-box">{errorMessage}</div>
                        )}

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={event => setEmail(event.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            required
                        />

                        <button type="submit" disabled={loading}>
                            {loading ? "Signing In..." : "Sign In"}
                        </button>

                        <button
                            type="button"
                            className="login-link-button"
                            onClick={() => resetForm(MODES.CHOOSE)}
                        >
                            Back
                        </button>
                    </form>
                )}

                {mode === MODES.CREATE_ACCOUNT && (
                    <form onSubmit={handleCreateAccount}>
                        <p>Create your Evergrove account.</p>

                        {errorMessage && (
                            <div className="error-box">{errorMessage}</div>
                        )}

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={event => setEmail(event.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="Create Password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            required
                        />

                        <button type="submit" disabled={loading}>
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>

                        <button
                            type="button"
                            className="login-link-button"
                            onClick={() => resetForm(MODES.CHOOSE)}
                        >
                            Back
                        </button>
                    </form>
                )}

                {mode === MODES.INVITE && (
                    <form onSubmit={handleInvite}>
                        <p>
                            Enter the email that was invited. Create a password
                            if this is your first time.
                        </p>

                        {errorMessage && (
                            <div className="error-box">{errorMessage}</div>
                        )}

                        <input
                            type="email"
                            placeholder="Invited Email"
                            value={email}
                            onChange={event => setEmail(event.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="Create or Enter Password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            required
                        />

                        <input
                            type="text"
                            placeholder="Invite Code optional for now"
                            value={inviteCode}
                            onChange={event => setInviteCode(event.target.value)}
                        />

                        <button type="submit" disabled={loading}>
                            {loading ? "Continuing..." : "Continue with Invite"}
                        </button>

                        <button
                            type="button"
                            className="login-link-button"
                            onClick={() => resetForm(MODES.CHOOSE)}
                        >
                            Back
                        </button>
                    </form>
                )}
                {mode === MODES.VERIFY_EMAIL && (
                    <>
                        <h2>Almost there!</h2>

                        <p>
                            We sent a verification email to <strong>{email}</strong>.
                        </p>

                        <p>
                            After you verify your email, sign in and we’ll finish connecting
                            you to your household.
                        </p>

                        <button
                            type="button"
                            onClick={() => resetForm(MODES.SIGN_IN)}
                        >
                            Back to Sign In
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}