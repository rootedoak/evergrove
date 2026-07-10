import { Link } from "react-router-dom"
import {
    ArrowRight,
    FileText,
    FlaskConical,
    HeartHandshake,
    ShieldCheck,
    Sparkles
} from "lucide-react"

import AppPage from "../../components/ui/AppPage"
import PageHeader from "../../components/ui/PageHeader"
import SectionCard from "../../components/ui/SectionCard"

import { TRUST_DOCUMENTS } from "./TrustDocuments"

const DOCUMENT_ICONS = {
    privacy: ShieldCheck,
    terms: FileText,
    beta: FlaskConical,
    ai_automation: Sparkles,
    acceptable_use: HeartHandshake
}

export default function TrustCenter() {
    return (
        <AppPage className="trust-center-page">
            <PageHeader
                eyebrow="Evergrove Trust Center"
                title="Your family. Your data. Your trust."
                description="Everything you need to know about how Evergrove protects your household and earns your confidence."
            />

            <section
                className="trust-center-hero"
                aria-labelledby="trust-center-hero-title"
            >
                <div
                    className="trust-center-hero__icon"
                    aria-hidden="true"
                >
                    <ShieldCheck size={30} />
                </div>

                <div>
                    <p className="trust-center-hero__eyebrow">
                        A promise, not a footnote
                    </p>

                    <h2 id="trust-center-hero-title">
                        Technology should work for your family.
                    </h2>

                    <p>
                        Evergrove exists to help households stay organized,
                        not to monetize their personal lives. We collect what
                        is needed to provide the service and explain how that
                        information is handled.
                    </p>
                </div>
            </section>

            <div className="trust-center-principles">
                <article>
                    <strong>Your household stays yours.</strong>
                    <span>
                        You decide who joins and what your family shares.
                    </span>
                </article>

                <article>
                    <strong>We explain what happens.</strong>
                    <span>
                        Important choices should not be hidden behind legal
                        language.
                    </span>
                </article>

                <article>
                    <strong>You stay in control.</strong>
                    <span>
                        Manage household access, notifications, and privacy
                        requests.
                    </span>
                </article>
            </div>

            <SectionCard
                title="Policies"
                description="Readable, practical, and written specifically for Evergrove families."
            >
                <div className="trust-document-list">
                    {TRUST_DOCUMENTS.map(document => {
                        const Icon =
                            DOCUMENT_ICONS[document.documentType] ?? FileText

                        return (
                            <Link
                                key={document.slug}
                                to={`/trust/${document.slug}`}
                                className="trust-document-row"
                            >
                                <span
                                    className="trust-document-row__icon"
                                    aria-hidden="true"
                                >
                                    <Icon size={22} />
                                </span>

                                <span className="trust-document-row__content">
                                    <strong>{document.title}</strong>
                                    <span>{document.description}</span>
                                    <small>{document.readingTime}</small>
                                </span>

                                <ArrowRight size={20} aria-hidden="true" />
                            </Link>
                        )
                    })}
                </div>
            </SectionCard>

            <SectionCard
                title="Your privacy choices"
                description="A real person will help with privacy requests while we build direct controls into Evergrove."
            >
                <div className="trust-action-grid">
                    <article>
                        <h3>Request your information</h3>

                        <p>
                            Ask for a copy of information associated with your
                            Evergrove account.
                        </p>

                        <a href="mailto:hello@evergroveapp.com?subject=Evergrove%20Data%20Request">
                            Email hello@evergroveapp.com
                        </a>
                    </article>

                    <article>
                        <h3>Delete your account</h3>

                        <p>
                            Request account deletion and learn how shared household
                            information is handled.
                        </p>

                        <a href="mailto:hello@evergroveapp.com?subject=Evergrove%20Account%20Deletion">
                            Start a deletion request
                        </a>
                    </article>
                </div>
            </SectionCard>

            <footer className="trust-center-footer">
                <span aria-hidden="true">🌿</span>

                <div>
                    <strong>Questions should have human answers.</strong>

                    <p>
                        Write to{" "}
                        <a href="mailto:hello@evergroveapp.com">
                            hello@evergroveapp.com
                        </a>
                        .
                    </p>
                </div>
            </footer>
        </AppPage>
    )
}