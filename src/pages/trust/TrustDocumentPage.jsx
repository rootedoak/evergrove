import { useEffect, useState } from "react"
import {
    Link,
    Navigate,
    useParams
} from "react-router-dom"

import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    Leaf
} from "lucide-react"

import AppPage from "../../components/ui/AppPage"

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
            elements.push(
                <h2 key={index}>
                    {line.slice(3)}
                </h2>
            )

            return
        }

        if (line.startsWith("### ")) {
            elements.push(
                <h3 key={index}>
                    {line.slice(4)}
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

export default function TrustDocumentPage() {
    const { slug } = useParams()

    const metadata =
        getTrustDocumentBySlug(slug)

    const [document, setDocument] =
        useState(null)

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState("")

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

    if (!metadata) {
        return <Navigate to="/trust" replace />
    }

    return (
        <AppPage className="trust-policy-page">
            <Link
                to="/trust"
                className="trust-policy-back"
            >
                <ArrowLeft size={18} />
                Trust Center
            </Link>

            <header className="trust-policy-hero">
                <p className="trust-policy-hero__eyebrow">
                    Evergrove Trust Center
                </p>

                <h1>{metadata.title}</h1>

                <p>
                    {metadata.description}
                </p>

                <div className="trust-policy-meta">
                    <span>
                        <Clock3 size={16} />
                        {metadata.readingTime}
                    </span>

                    {document?.effective_date && (
                        <span>
                            <CalendarDays size={16} />
                            Effective{" "}
                            {new Date(
                                `${document.effective_date}T12:00:00`
                            ).toLocaleDateString(
                                "en-US",
                                {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric"
                                }
                            )}
                        </span>
                    )}

                    {document?.version && (
                        <span>
                            Version {document.version}
                        </span>
                    )}
                </div>
            </header>

            {loading && (
                <div className="trust-policy-state">
                    Opening the policy...
                </div>
            )}

            {!loading && error && (
                <div className="trust-policy-state trust-policy-state--error">
                    {error}
                </div>
            )}

            {!loading &&
                !error &&
                document?.content && (
                    <article className="trust-policy-document">
                        <PolicyContent
                            markdown={document.content}
                        />
                    </article>
                )}

            <footer className="trust-policy-footer">
                <Leaf size={22} aria-hidden="true" />

                <div>
                    <strong>
                        Thank you for trusting Evergrove.
                    </strong>

                    <p>
                        Questions?{" "}
                        <a href="mailto:hello@evergroveapp.com">
                            hello@evergroveapp.com
                        </a>
                    </p>
                </div>
            </footer>
        </AppPage>
    )
}