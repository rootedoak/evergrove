import {
    CheckCircle2,
    Clock3,
    FileText,
    ShieldCheck,
    Users
} from "lucide-react"

import { useEffect, useState } from "react"

import SectionCard from "../../../components/ui/SectionCard"

import {
    getAdminLegalSummary
} from "../../../services/admin/adminLegalService"

function formatDate(value) {
    if (!value) return "Not set"

    return new Date(value).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    )
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    detail
}) {
    return (
        <article className="admin-trust-summary-card">
            <span
                className="admin-trust-summary-card__icon"
                aria-hidden="true"
            >
                <Icon size={21} />
            </span>

            <div>
                <span>{label}</span>
                <strong>{value}</strong>
                {detail && <small>{detail}</small>}
            </div>
        </article>
    )
}

export default function AdminTrustCenter() {
    const [data, setData] = useState(null)
    const [loading, setLoading] =
        useState(true)
    const [error, setError] =
        useState("")

    async function loadSummary() {
        try {
            setLoading(true)
            setError("")

            const result =
                await getAdminLegalSummary()

            setData(result)
        } catch (loadError) {
            console.error(loadError)

            setError(
                loadError.message ??
                "Unable to load Trust Center data."
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSummary()
    }, [])

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <p className="admin-page-eyebrow">
                            Company
                        </p>
                        <h1>Trust Center</h1>
                    </div>
                </div>

                <SectionCard>
                    <p>
                        Loading legal documents and
                        acceptance records...
                    </p>
                </SectionCard>
            </div>
        )
    }

    if (error) {
        return (
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <p className="admin-page-eyebrow">
                            Company
                        </p>
                        <h1>Trust Center</h1>
                    </div>
                </div>

                <SectionCard>
                    <p className="admin-error">
                        {error}
                    </p>

                    <button
                        type="button"
                        className="eg-button secondary"
                        onClick={loadSummary}
                    >
                        Try Again
                    </button>
                </SectionCard>
            </div>
        )
    }

    const summary = data?.summary ?? {}
    const documents = data?.documents ?? []
    const pendingUsers =
        data?.pendingUsers ?? []

    return (
        <div className="admin-page admin-trust-page">
            <div className="admin-page-header">
                <div>
                    <p className="admin-page-eyebrow">
                        Company
                    </p>

                    <h1>Trust Center</h1>

                    <p>
                        Manage Evergrove’s legal
                        documents and monitor user
                        acceptance.
                    </p>
                </div>

                <a
                    href="/trust"
                    target="_blank"
                    rel="noreferrer"
                    className="eg-button secondary"
                >
                    View Public Trust Center
                </a>
            </div>

            <div className="admin-trust-summary-grid">
                <SummaryCard
                    icon={Users}
                    label="Total Users"
                    value={summary.totalUsers ?? 0}
                />

                <SummaryCard
                    icon={CheckCircle2}
                    label="Fully Accepted"
                    value={
                        summary.fullyAcceptedUsers ?? 0
                    }
                    detail="Current required versions"
                />

                <SummaryCard
                    icon={Clock3}
                    label="Pending"
                    value={summary.pendingUsers ?? 0}
                    detail="Missing one or more versions"
                />

                <SummaryCard
                    icon={ShieldCheck}
                    label="Required Policies"
                    value={
                        summary.requiredDocumentCount ??
                        0
                    }
                />
            </div>

            <SectionCard
                title="Published Policies"
                description="Current documents visible in the public Trust Center."
            >
                <div className="admin-trust-document-list">
                    {documents.map(document => (
                        <article
                            key={document.id}
                            className="admin-trust-document-row"
                        >
                            <span
                                className="admin-trust-document-row__icon"
                                aria-hidden="true"
                            >
                                <FileText size={20} />
                            </span>

                            <div className="admin-trust-document-row__content">
                                <strong>
                                    {document.title}
                                </strong>

                                <span>
                                    Version{" "}
                                    {document.version}
                                    {" · "}
                                    Effective{" "}
                                    {formatDate(
                                        document.effective_date
                                    )}
                                </span>
                            </div>

                            <div className="admin-trust-document-row__stats">
                                {document.requires_acceptance ? (
                                    <>
                                        <strong>
                                            {
                                                document.acceptanceCount
                                            }
                                        </strong>
                                        <span>
                                            accepted
                                        </span>

                                        <small>
                                            {
                                                document.pendingCount
                                            }{" "}
                                            pending
                                        </small>
                                    </>
                                ) : (
                                    <>
                                        <strong>
                                            Optional
                                        </strong>
                                        <span>
                                            No separate
                                            acceptance
                                        </span>
                                    </>
                                )}
                            </div>

                            <span
                                className={
                                    document.is_published
                                        ? "admin-status-pill published"
                                        : "admin-status-pill draft"
                                }
                            >
                                {document.is_published
                                    ? "Published"
                                    : "Draft"}
                            </span>
                        </article>
                    ))}
                </div>
            </SectionCard>

            <SectionCard
                title="Users Pending Acceptance"
                description="Users who are missing one or more current required policy versions."
            >
                {pendingUsers.length === 0 ? (
                    <div className="admin-empty-state">
                        <CheckCircle2 size={24} />

                        <div>
                            <strong>
                                Everyone is current
                            </strong>

                            <p>
                                All users have accepted
                                every required policy.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="admin-trust-user-list">
                        {pendingUsers.map(user => (
                            <article
                                key={user.userId}
                                className="admin-trust-user-row"
                            >
                                <div>
                                    <strong>
                                        {user.email ??
                                            "Unknown user"}
                                    </strong>

                                    <span>
                                        Accepted{" "}
                                        {
                                            user.acceptedRequiredCount
                                        }{" "}
                                        of{" "}
                                        {user.requiredCount}
                                    </span>
                                </div>

                                <div className="admin-trust-user-row__missing">
                                    {user.missingDocuments.map(
                                        document => (
                                            <span
                                                key={
                                                    document.id
                                                }
                                            >
                                                {
                                                    document.title
                                                }{" "}
                                                v
                                                {
                                                    document.version
                                                }
                                            </span>
                                        )
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </SectionCard>
        </div>
    )
}