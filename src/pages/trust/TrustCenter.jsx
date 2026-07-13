import { Link } from "react-router-dom"
import {
    ArrowRight,
    Eye,
    FileText,
    FlaskConical,
    HeartHandshake,
    Leaf,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
    Users
} from "lucide-react"

import { TRUST_DOCUMENTS } from "./trustDocuments"

const DOCUMENT_ICONS = {
    privacy: ShieldCheck,
    terms: FileText,
    beta: FlaskConical,
    ai_automation: Sparkles,
    acceptable_use: HeartHandshake,
    security: LockKeyhole,
    coppa: Users,
    children_privacy: Users,
    data_processing: FileText,
    eula: FileText
}

const trustPrinciples = [
    {
        title: "Privacy by Design",
        description:
            "Your household information belongs to your family. We do not sell household data or use it to power advertising.",
        icon: LockKeyhole
    },
    {
        title: "Security First",
        description:
            "Evergrove uses authenticated access, encrypted connections, and household-scoped permissions to protect family information.",
        icon: ShieldCheck
    },
    {
        title: "Clear and Transparent",
        description:
            "Important choices should be understandable. We explain how information is used without hiding the answer behind legal language.",
        icon: Eye
    },
    {
        title: "Built for Families",
        description:
            "Every decision begins with the same question: does this support family life and earn the confidence of the people using it?",
        icon: HeartHandshake
    }
]

export default function TrustCenter() {
    return (
        <>
            <section
                className="public-site-hero public-site-hero--compact trust-center-public-hero"
                aria-labelledby="trust-center-title"
            >
                <div className="trust-center-public-hero__content">
                    <div className="public-site-eyebrow">
                        <ShieldCheck size={16} />
                        <span>Evergrove Trust Center</span>
                    </div>

                    <h1 id="trust-center-title">
                        Built for families.
                        <span>Designed with trust.</span>
                    </h1>

                    <p>
                        When families trust Evergrove with their
                        schedules, responsibilities, and everyday life,
                        protecting that trust becomes our responsibility.
                    </p>

                    <p className="trust-center-public-hero__closing">
                        Everything we build starts there.
                    </p>
                </div>

                <div
                    className="trust-center-public-hero__symbol"
                    aria-hidden="true"
                >
                    <ShieldCheck size={56} />
                </div>
            </section>

            <section className="public-site-section trust-center-principles-section">
                <div className="public-site-section-heading public-site-section-heading--centered">
                    <span>Our commitment</span>

                    <h2>
                        Four principles guide every decision we make.
                    </h2>

                    <p>
                        Trust is not a legal requirement we address after
                        the product is built. It is part of how Evergrove
                        is designed from the beginning.
                    </p>
                </div>

                <div className="trust-principles-grid">
                    {trustPrinciples.map(principle => {
                        const Icon = principle.icon

                        return (
                            <article
                                key={principle.title}
                                className="trust-principle-card"
                            >
                                <div className="trust-principle-card__icon">
                                    <Icon size={23} />
                                </div>

                                <h3>{principle.title}</h3>
                                <p>{principle.description}</p>
                            </article>
                        )
                    })}
                </div>
            </section>

            <section className="public-site-section trust-documents-section">
                <div className="public-site-section-heading">
                    <span>Policies and safeguards</span>

                    <h2>
                        The documents behind our commitment.
                    </h2>

                    <p>
                        Our policies explain how Evergrove works, how
                        household information is handled, and what
                        families can expect from us.
                    </p>
                </div>

                <div className="trust-document-grid">
                    {TRUST_DOCUMENTS.map(document => {
                        const Icon =
                            DOCUMENT_ICONS[document.documentType] ??
                            FileText

                        return (
                            <Link
                                key={document.slug}
                                to={`/trust/${document.slug}`}
                                className="trust-document-card"
                            >
                                <div className="trust-document-card__icon">
                                    <Icon size={23} />
                                </div>

                                <div className="trust-document-card__content">
                                    <h3>{document.title}</h3>

                                    <p>
                                        {document.description ||
                                            "Read how this policy supports and protects Evergrove families."}
                                    </p>

                                    {document.readingTime && (
                                        <span>
                                            {document.readingTime}
                                        </span>
                                    )}
                                </div>

                                <ArrowRight
                                    className="trust-document-card__arrow"
                                    size={19}
                                    aria-hidden="true"
                                />
                            </Link>
                        )
                    })}
                </div>
            </section>

            <section className="public-site-section trust-choices-section">
                <div className="public-site-section-heading">
                    <span>Your choices</span>

                    <h2>
                        Your information stays under your control.
                    </h2>

                    <p>
                        While we continue building direct privacy controls
                        into Evergrove, a real person will help with any
                        request.
                    </p>
                </div>

                <div className="trust-action-grid">
                    <article className="trust-action-card">
                        <div className="trust-action-card__icon">
                            <FileText size={22} />
                        </div>

                        <h3>Request your information</h3>

                        <p>
                            Ask for a copy of the information associated
                            with your Evergrove account.
                        </p>

                        <a href="mailto:hello@evergroveapp.com?subject=Evergrove%20Data%20Request">
                            Request your data
                            <ArrowRight size={16} />
                        </a>
                    </article>

                    <article className="trust-action-card">
                        <div className="trust-action-card__icon">
                            <Users size={22} />
                        </div>

                        <h3>Delete your account</h3>

                        <p>
                            Request account deletion and learn how shared
                            household information will be handled.
                        </p>

                        <a href="mailto:hello@evergroveapp.com?subject=Evergrove%20Account%20Deletion">
                            Start a deletion request
                            <ArrowRight size={16} />
                        </a>
                    </article>
                </div>
            </section>

            <section className="trust-center-help">
                <div className="trust-center-help__icon">
                    <Leaf size={25} />
                </div>

                <div>
                    <span>Questions should have human answers</span>

                    <h2>
                        Talk with someone at Evergrove.
                    </h2>

                    <p>
                        Questions about privacy, security, or your account
                        are always welcome.
                    </p>
                </div>

                <a
                    href="mailto:hello@evergroveapp.com"
                    className="public-site-button public-site-button--primary"
                >
                    Email Evergrove
                    <ArrowRight size={17} />
                </a>
            </section>
        </>
    )
}