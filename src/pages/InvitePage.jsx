import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import logo from "../assets/evergrove-logo.svg"
import {
    acceptPendingInviteByToken,
    getPendingInviteByToken
} from "../services/familyService"

import { supabase } from "../lib/supabase"

const INVITE_TOKEN_KEY = "evergrove_invite_token"
const INVITE_EMAIL_KEY = "evergrove_invite_email"
const INVITE_CODE_KEY = "evergrove_invite_code"

export default function InvitePage() {
    const { token } = useParams()

    const [invite, setInvite] = useState(null)
    const [alreadySignedIn, setAlreadySignedIn] = useState(false)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        async function loadInvite() {
            setLoading(true)
            setErrorMessage("")

            try {
                const {
                    data: { session }
                } = await supabase.auth.getSession()

                setAlreadySignedIn(Boolean(session))

                const data = await getPendingInviteByToken(token)

                if (!data) {
                    setErrorMessage(
                        "It may have expired, already been accepted, or the link may be incorrect."
                    )
                    return
                }

                localStorage.setItem(INVITE_TOKEN_KEY, token)
                setInvite(data)
            } catch (error) {
                console.error(error)
                setErrorMessage(error.message || "Could not load invitation.")
            } finally {
                setLoading(false)
            }
        }

        loadInvite()
    }, [token])

    async function handleJoin() {
        setJoining(true)
        setErrorMessage("")

        try {
            localStorage.setItem(INVITE_TOKEN_KEY, token)

            const {
                data: { session }
            } = await supabase.auth.getSession()

            if (!session) {
                window.location.href = "/"
                return
            }

            await acceptPendingInviteByToken(token)

            localStorage.removeItem(INVITE_EMAIL_KEY)
            localStorage.removeItem(INVITE_CODE_KEY)
            localStorage.removeItem(INVITE_TOKEN_KEY)

            window.location.href = "/"
        } catch (error) {
            console.error(error)
            setErrorMessage(error.message || "Could not join household.")
        } finally {
            setJoining(false)
        }
    }

    function handleSignInInstead() {
        localStorage.setItem(INVITE_TOKEN_KEY, token)
        window.location.href = "/"
    }

    const householdName = invite?.households?.name || "this household"

    return (
        <div className="onboarding-page">
            <section>
                <img
                    src={logo}
                    alt="Evergrove"
                    className="login-logo"
                />

                {loading ? (
                    <>
                        <h1>Loading your invitation...</h1>
                        <p>
                            We’re checking your household invite.
                        </p>
                    </>
                ) : errorMessage ? (
                    <>
                        <h1>This invitation isn’t available anymore.</h1>

                        <p>
                            {errorMessage}
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem(INVITE_TOKEN_KEY)
                                window.location.href = "/"
                            }}
                        >
                            Go to Evergrove
                        </button>
                    </>
                ) : (
                    <>
                        <h1>You’re Invited!</h1>

                        <p>
                            Join <strong>{householdName}</strong> on Evergrove.
                        </p>

                        <p className="onboarding-helper-text">
                            You’ll be able to share calendars, to-dos, meals,
                            shopping lists, and household updates.
                        </p>

                        <div className="join-household-card">
                            <span>🏡</span>
                            <strong>
                                {householdName}
                            </strong>
                        </div>

                        <div className="onboarding-feature-list">
                            <div>✅ Shared Calendar</div>
                            <div>✅ Shared To-Dos</div>
                            <div>✅ Meal Planning</div>
                            <div>✅ Shopping Lists</div>
                            <div>✅ Family Dashboard</div>
                        </div>

                        <button
                            type="button"
                            onClick={handleJoin}
                            disabled={joining}
                        >
                            {joining
                                ? "Joining..."
                                : alreadySignedIn
                                    ? "Join Household"
                                    : "Create Account or Sign In"}
                        </button>

                        {!alreadySignedIn && (
                            <button
                                type="button"
                                className="login-link-button"
                                onClick={handleSignInInstead}
                            >
                                I already have an account
                            </button>
                        )}
                    </>
                )}
            </section>
        </div>
    )
}