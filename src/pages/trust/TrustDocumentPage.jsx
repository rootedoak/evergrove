import { useEffect, useMemo, useState } from "react"
import {
    Link,
    Navigate,
    useParams
} from "react-router-dom"

import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Clock3,
    FileText,
    Leaf,
    LoaderCircle,
    Mail,
    ShieldCheck
} from "lucide-react"

import {
    getPublishedLegalDocument
} from "../../services/legalDocumentService"

import { getTrustDocumentBySlug } from "./trustDocuments"

function renderInlineFormatting(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)

    return parts.map((part, index) => {
        if (
            part.startsWith("**") &&
            part.endsWith("**")
        ) {
            return (
                <strong key={`${part}-${index}`}>
                    {part.slice(2, -2)}
                </strong>
            )
        }

        return part
    })
}

function createHeadingId(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
}

function getDocumentHeadings(markdown = "") {
    return markdown
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.startsWith("## "))
        .map(line => {
            const title = line.slice(3).trim()

            return {
                title,
                id: createHeadingId(title)
            }
        })
}

function PolicyContent({ markdown }) {
    const lines = markdown.split("\n")
    const elements = []

    let listItems = []

    function flushList() {
        if (!listItems.length) {
            return
        }

        elements.push(
            <ul key={`list-${elements.length}`}>
                {listItems.map((item, index) => (
                    <li key={`${item}-${index}`}>
                        {renderInlineFormatting(item)}
                    </li>
                ))}
            </ul>
        )

        listItems = []
    }

    lines.forEach((rawLine, index) => {
        const line = rawLine.trim()

        if (!line) {
            flushList()
            return
        }

        if (line.startsWith("- ")) {
            listItems.push(line.slice(2))
            return
        }

        flushList()

        if (line.startsWith("# ")) {
            return
        }

        if (line.startsWith("## ")) {
            const title = line.slice(3)

            elements.push(
                <h2
                    key={index}
                    id={createHeadingId(title)}
                >
                    {title}
                </h2>
            )

            return
        }

        if (line.startsWith("### ")) {
            const title = line.slice(4)

            elements.push(
                <h3
                    key={index}
                    id={createHeadingId(title)}
                >
                    {title}
                </h3>
            )

            return
        }

        if (line.startsWith("> ")) {
            elements.push(
                <aside
                    key={index}
                    className="trust-policy-note"
                >
                    <Leaf size={18} aria-hidden="true" />

                    <p>
                        {renderInlineFormatting(
                            line.slice(2)
                        )}
                    </p>
                </aside>
            )

            return
        }

        if (
            line.startsWith("**Effective date:**") ||
            line.startsWith("**Version:**")
        ) {
            return
        }

        elements.push(
            <p key={index}>
                {renderInlineFormatting(line)}
            </p>
        )
    })

    flushList()

    return elements
}

function formatEffectiveDate(value) {
    if (!value) return null

    return new Date(
        `${value}T12:00:00`
    ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    })
}

export default function TrustDocumentPage() {
    const { slug } = useParams()

    const metadata = getTrustDocumentBySlug(slug)

    const [document, setDocument] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        let active = true

        async function loadDocument() {
            if (!metadata) {
                return
            }

            try {
                setLoading(true)
                setError("")

                const result =
                    await getPublishedLegalDocument(
                        metadata.documentType
                    )

                if (active) {
                    setDocument(result)
                }
            } catch (loadError) {
                console.error(loadError)

                if (active) {
                    setError(
                        "We could not load this policy right now."
                    )
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        loadDocument()

        return () => {
            active = false
        }
    }, [metadata])

    const headings = useMemo(
        () => getDocumentHeadings(document?.content),
        [document?.content]
    )

    if (!metadata) {
        return <Navigate to="/trust" replace />
    }

    const effectiveDate =
        formatEffectiveDate(document?.effective_date)

    return (
        <>
            <section className="trust-document-public-hero">
                <div className="trust-document-public-hero__content">
                    <Link
                        to="/trust"
                        className="trust-document-back"
                    >
                        <ArrowLeft size={17} />
                        Back to Trust Center
                    </Link>

                    <div className="public-site-eyebrow">
                        <ShieldCheck size={16} />
                        <span>Evergrove Trust Center</span>
                    </div>

                    <h1>{metadata.title}</h1>

                    <p>
                        {metadata.description}
                    </p>

                    <div className="trust-document-meta">
                        {metadata.readingTime && (
                            <span>
                                <Clock3 size={16} />
                                {metadata.readingTime}
                            </span>
                        )}

                        {effectiveDate && (
                            <span>
                                <CalendarDays size={16} />
                                Effective {effectiveDate}
                            </span>
                        )}

                        {document?.version && (
                            <span>
                                <FileText size={16} />
                                Version {document.version}
                            </span>
                        )}
                    </div>
                </div>

                <div
                    className="trust-document-public-hero__symbol"
                    aria-hidden="true"
                >
                    <FileText size={52} />
                </div>
            </section>

            <section className="trust-document-public-section">
                {loading && (
                    <div className="trust-policy-state">
                        <LoaderCircle
                            size={28}
                            className="trust-policy-spinner"
                        />

                        <div>
                            <strong>Opening this policy…</strong>

                            <p>
                                We&apos;re loading the latest published
                                version.
                            </p>
                        </div>
                    </div>
                )}

                {!loading && error && (
                    <div
                        className="trust-policy-state trust-policy-state--error"
                        role="alert"
                    >
                        <strong>
                            This policy could not be loaded.
                        </strong>

                        <p>{error}</p>

                        <Link
                            to="/trust"
                            className="public-site-button public-site-button--secondary"
                        >
                            Return to Trust Center
                        </Link>
                    </div>
                )}

                {!loading &&
                    !error &&
                    document?.content && (
                        <div className="trust-document-layout">
                            {headings.length > 0 && (
                                <aside className="trust-document-sidebar">
                                    <div className="trust-document-sidebar__card">
                                        <span>On this page</span>

                                        <nav
                                            aria-label={`${metadata.title} sections`}
                                        >
                                            {headings.map(heading => (
                                                <a
                                                    key={heading.id}
                                                    href={`#${heading.id}`}
                                                >
                                                    {heading.title}
                                                </a>
                                            ))}
                                        </nav>

                                        <Link
                                            to="/trust"
                                            className="trust-document-sidebar__back"
                                        >
                                            View all policies
                                            <ArrowRight size={15} />
                                        </Link>
                                    </div>
                                </aside>
                            )}

                            <article className="trust-policy-document">
                                <PolicyContent
                                    markdown={document.content}
                                />
                            </article>
                        </div>
                    )}
            </section>

            <section className="trust-policy-help">
                <div className="trust-policy-help__icon">
                    <Leaf size={24} />
                </div>

                <div>
                    <span>Questions should have human answers</span>

                    <h2>
                        Need help understanding this policy?
                    </h2>

                    <p>
                        Reach out and someone at Evergrove will help.
                    </p>
                </div>

                <a
                    href="mailto:hello@evergroveapp.com"
                    className="public-site-button public-site-button--primary"
                >
                    <Mail size={17} />
                    Email Evergrove
                </a>
            </section>
        </>
    )
}