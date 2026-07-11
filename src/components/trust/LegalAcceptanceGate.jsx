import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ShieldCheck } from "lucide-react"

import Button from "../ui/Button"

import {
    acceptLegalDocuments,
    getRequiredLegalAcceptances,
    recordLegalAttestations
} from "../../services/legalAcceptanceService"

const DOCUMENT_ROUTES = {
    privacy: "/trust/privacy",
    terms: "/trust/terms",
    beta: "/trust/beta",
    ai_automation: "/trust/ai-automation",
    acceptable_use: "/trust/acceptable-use"
}

export default function LegalAcceptanceGate({ children }) {
    const location = useLocation()

    const isTrustRoute =
        location.pathname === "/trust" ||
        location.pathname.startsWith("/trust/")

    const [requiredDocuments, setRequiredDocuments] = useState([])

    const [confirmedAdult, setConfirmedAdult] = useState(false)
    const [acceptedPolicies, setAcceptedPolicies] = useState(false)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        let active = true

        async function loadRequiredDocuments() {
            try {
                setLoading(true)
                setError("")

                const documents = await getRequiredLegalAcceptances()

                if (active) {
                    setRequiredDocuments(documents)
                }
            } catch (loadError) {
                console.error(
                    "Failed to verify legal acceptance:",
                    loadError
                )

                if (active) {
                    setError(
                        "Evergrove could not verify your policy acceptance."
                    )
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        loadRequiredDocuments()

        return () => {
            active = false
        }
    }, [])

    async function handleAccept() {
        if (!confirmedAdult || !acceptedPolicies) {
            return
        }

        try {
            setSaving(true)
            setError("")

            await acceptLegalDocuments({
                documents: requiredDocuments,
                acceptanceMethod: "in_app_gate",
                adultEligibilityConfirmed: true
            })

            await recordLegalAttestations([
                {
                    type: "adult_account_eligibility",
                    version: "1.0"
                }
            ])

            setRequiredDocuments([])
        } catch (saveError) {
            console.error(
                "Failed to record legal acceptance:",
                saveError
            )

            setError(
                "We could not save your acceptance. Please try again."
            )
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-card">
                    <div className="brand-mark">E</div>
                    <p>Checking your account...</p>
                </div>
            </div>
        )
    }

    if (isTrustRoute) {
        return children
    }

    if (error && requiredDocuments.length === 0) {
        return (
            <div className="legal-gate-page">
                <section className="legal-gate">
                    <div
                        className="legal-gate__icon"
                        aria-hidden="true"
                    >
                        <ShieldCheck size={28} />
                    </div>

                    <p className="legal-gate__eyebrow">
                        Your family. Your data. Your trust.
                    </p>

                    <h1>We couldn’t verify your account</h1>

                    <p className="legal-gate__description">
                        Please refresh the page. If the problem continues,
                        contact hello@evergroveapp.com.
                    </p>
                </section>
            </div>
        )
    }

    if (requiredDocuments.length === 0) {
        return children
    }

    return (
        <div className="legal-gate-page">
            <section
                className="legal-gate"
                role="dialog"
                aria-modal="true"
                aria-labelledby="legal-gate-title"
            >
                <div
                    className="legal-gate__icon"
                    aria-hidden="true"
                >
                    <ShieldCheck size={28} />
                </div>

                <p className="legal-gate__eyebrow">
                    Your family. Your data. Your trust.
                </p>

                <h1 id="legal-gate-title">
                    Before we continue
                </h1>

                <p className="legal-gate__description">
                    Please confirm that you are an adult and review
                    Evergrove’s current policies.
                </p>

                <div className="legal-gate__documents">
                    {requiredDocuments.map(document => (
                        <Link
                            key={document.id}
                            to={
                                DOCUMENT_ROUTES[document.document_type] ??
                                "/trust"
                            }
                            target="_blank"
                            rel="noreferrer"
                        >
                            <span>{document.title}</span>

                            <small>
                                Version {document.version}
                            </small>
                        </Link>
                    ))}
                </div>

                <label className="legal-gate__checkbox">
                    <input
                        type="checkbox"
                        checked={confirmedAdult}
                        onChange={event =>
                            setConfirmedAdult(event.target.checked)
                        }
                    />

                    <span>
                        I confirm that I am at least 18 years old
                        and am using this account for myself.
                    </span>
                </label>

                <label className="legal-gate__checkbox">
                    <input
                        type="checkbox"
                        checked={acceptedPolicies}
                        onChange={event =>
                            setAcceptedPolicies(event.target.checked)
                        }
                    />

                    <span>
                        I agree to the current Terms of Service and
                        Beta Program Agreement and acknowledge the
                        Privacy Policy.
                    </span>
                </label>

                {error && (
                    <p className="legal-gate__error">
                        {error}
                    </p>
                )}

                <Button
                    type="button"
                    onClick={handleAccept}
                    disabled={
                        !confirmedAdult ||
                        !acceptedPolicies ||
                        saving
                    }
                >
                    {saving ? "Saving..." : "Agree and continue"}
                </Button>
            </section>
        </div>
    )
}