import { useEffect, useState } from "react"

import logo from "../assets/evergrove-logo.svg"
import {
    acceptPendingInviteByToken,
    acceptPendingInviteForCurrentUser,
    getPendingInviteByToken,
    getPendingInviteForCurrentUser
} from "../services/familyService"

const INVITE_TOKEN_KEY = "evergrove_invite_token"
const INVITE_EMAIL_KEY = "evergrove_invite_email"
const INVITE_CODE_KEY = "evergrove_invite_code"

export default function JoinHousehold() {
    const [invite, setInvite] = useState(null)
    const [inviteToken, setInviteToken] = useState("")
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        async function loadInvite() {
            setLoading(true)
            setErrorMessage("")

            try {
                const storedToken = localStorage.getItem(INVITE_TOKEN_KEY)

                if (storedToken) {
                    const tokenInvite = await getPendingInviteByToken(storedToken)

                    if (tokenInvite) {
                        console.log(
                            "Loaded household invite:",
                            tokenInvite
                        )

                        setInvite(tokenInvite)
                        setInviteToken(storedToken)
                        return
                    }

                    localStorage.removeItem(INVITE_TOKEN_KEY)
                }

                const accountInvite = await getPendingInviteForCurrentUser()

                if (!accountInvite) {
                    setErrorMessage(
                        "We could not find a pending household invitation for this account."
                    )
                    return
                }

                setInvite(accountInvite)
            } catch (error) {
                console.error(error)
                setErrorMessage(error.message || "Could not load invitation.")
            } finally {
                setLoading(false)
            }
        }

        loadInvite()
    }, [])

    async function handleJoin() {
        setJoining(true)
        setErrorMessage("")

        try {
            if (inviteToken) {
                await acceptPendingInviteByToken(inviteToken)
            } else {
                await acceptPendingInviteForCurrentUser()
            }

            localStorage.removeItem(INVITE_TOKEN_KEY)
            localStorage.removeItem(INVITE_EMAIL_KEY)
            localStorage.removeItem(INVITE_CODE_KEY)

            window.location.href = "/"
        } catch (error) {
            console.error(error)
            setErrorMessage(error.message || "Could not join household.")
        } finally {
            setJoining(false)
        }
    }

    function handleGoHome() {
        localStorage.removeItem(INVITE_TOKEN_KEY)
        localStorage.removeItem(INVITE_EMAIL_KEY)
        localStorage.removeItem(INVITE_CODE_KEY)

        window.location.href = "/"
    }

    const householdName =
        invite?.households?.name ||
        invite?.household?.name ||
        invite?.household_name ||
        "your household"

    const isTeenInvite =
        invite?.member_type === "teen"

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
                        <h1>No invitation found</h1>

                        <p>
                            {errorMessage}
                        </p>

                        <p className="onboarding-helper-text">
                            You may already be connected to a household, or the invitation
                            may have expired.
                        </p>

                        <button
                            type="button"
                            onClick={handleGoHome}
                        >
                            Go to Evergrove
                        </button>
                    </>
                ) : (
                    <>
                        <h1>Ready to Join</h1>

                        <p>
                            You’re about to join <strong>{householdName}</strong>.
                        </p>

                        <p className="onboarding-helper-text">
                            {isTeenInvite
                                ? "Once you join, you’ll be able to see family plans, manage your to-dos, and participate in this household."
                                : "Once you join, you’ll share calendars, to-dos, meals, shopping lists, and household updates with this household."}
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
                            {joining ? "Joining..." : `Join ${householdName}`}
                        </button>
                    </>
                )}
            </section>
        </div>
    )
}