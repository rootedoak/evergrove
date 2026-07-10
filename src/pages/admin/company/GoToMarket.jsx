import {
    ArrowRight,
    BarChart3,
    Check,
    Circle,
    Globe2,
    Megaphone,
    Rocket,
    Sparkles,
    Target,
    Users
} from "lucide-react"

import AppPage from "../../../components/ui/AppPage"
import PageHeader from "../../../components/ui/PageHeader"
import SectionCard from "../../../components/ui/SectionCard"

const positioning = [
    {
        label: "Primary Audience",
        value: "Busy families who are tired of managing life across calendars, texts, notes, lists, and memory."
    },
    {
        label: "Core Problem",
        value: "Important family responsibilities are scattered across too many places and often depend on one person remembering everything."
    },
    {
        label: "Core Promise",
        value: "Evergrove gives families confidence that the important things are remembered, organized, and cared for."
    },
    {
        label: "Primary Tagline",
        value: "Where organized families grow."
    },
    {
        label: "Primary Call to Action",
        value: "Get Started Free"
    }
]

const readinessItems = [
    {
        title: "Public homepage",
        description:
            "Replace the login-first experience with a clear, welcoming introduction to Evergrove.",
        status: "not-started"
    },
    {
        title: "Signup and onboarding",
        description:
            "Make it easy for a new household to understand Evergrove, create an account, and reach a first win.",
        status: "in-progress"
    },
    {
        title: "Referral system",
        description:
            "Give every household a simple way to invite another household and track the result.",
        status: "not-started"
    },
    {
        title: "Invitation experience",
        description:
            "Polish referral links, invitation emails, landing pages, and success states.",
        status: "in-progress"
    },
    {
        title: "Testimonials",
        description:
            "Collect specific stories from beta households about how Evergrove changes daily family life.",
        status: "not-started"
    },
    {
        title: "Pricing readiness",
        description:
            "Confirm the free beta, founding-member offer, and future premium household model.",
        status: "planned"
    },
    {
        title: "Analytics",
        description:
            "Track acquisition, activation, invitations, referrals, retention, and household engagement.",
        status: "in-progress"
    },
    {
        title: "Support readiness",
        description:
            "Make sure new households have a clear path to report problems and get help.",
        status: "ready"
    }
]

const launchStages = [
    {
        stage: "Stage 1",
        title: "Closed Beta",
        status: "Current",
        description:
            "Validate usefulness, retention, reliability, onboarding, and whether families would miss Evergrove if it disappeared."
    },
    {
        stage: "Stage 2",
        title: "Expanded Beta",
        status: "Next",
        description:
            "Invite households outside the immediate circle through referrals and a simple public homepage."
    },
    {
        stage: "Stage 3",
        title: "Founding Members",
        status: "Planned",
        description:
            "Introduce a limited early-supporter offer while maintaining a close feedback loop."
    },
    {
        stage: "Stage 4",
        title: "Public Launch",
        status: "Future",
        description:
            "Open Evergrove broadly with clear pricing, reliable onboarding, referral growth, and launch campaigns."
    }
]

const currentPriorities = [
    {
        order: "01",
        title: "Build the public homepage",
        description:
            "Make the value of Evergrove understandable before asking someone to create an account."
    },
    {
        order: "02",
        title: "Create household referral links",
        description:
            "Let current families invite another family through a personal, trackable link."
    },
    {
        order: "03",
        title: "Collect beta stories",
        description:
            "Turn real household outcomes into credible launch messaging and testimonials."
    },
    {
        order: "04",
        title: "Define activation",
        description:
            "Identify the actions that signal a new household has experienced the value of Evergrove."
    }
]

const metrics = [
    {
        label: "Households",
        value: "—",
        note: "Total created households"
    },
    {
        label: "Weekly Active",
        value: "—",
        note: "Households active in 7 days"
    },
    {
        label: "30-Day Retention",
        value: "—",
        note: "Households returning after 30 days"
    },
    {
        label: "Invitations Sent",
        value: "—",
        note: "Referral invitations created"
    },
    {
        label: "Referral Conversion",
        value: "—",
        note: "Invites that become households"
    },
    {
        label: "Activation Rate",
        value: "—",
        note: "New households reaching first value"
    }
]

function getStatusLabel(status) {
    const labels = {
        ready: "Ready",
        "in-progress": "In Progress",
        planned: "Planned",
        "not-started": "Not Started"
    }

    return labels[status] || status
}

function StatusIcon({ status }) {
    if (status === "ready") {
        return <Check size={15} strokeWidth={3} />
    }

    if (status === "in-progress") {
        return <Sparkles size={15} />
    }

    return <Circle size={12} />
}

export default function GoToMarket() {
    const completedCount = readinessItems.filter(
        item => item.status === "ready"
    ).length

    const activeCount = readinessItems.filter(
        item => item.status === "in-progress"
    ).length

    const readinessPercent = Math.round(
        ((completedCount + activeCount * 0.5) / readinessItems.length) * 100
    )

    return (
        <AppPage>
            <PageHeader
                eyebrow="Company"
                title="Go to Market"
                description="The strategy, readiness, and priorities that will take Evergrove from closed beta to trusted household brand."
            />

            <div className="gtm-page">
                <section className="gtm-hero">
                    <div className="gtm-hero__content">
                        <div className="gtm-hero__icon">
                            <Rocket size={24} />
                        </div>

                        <p className="gtm-hero__eyebrow">
                            Evergrove Go-to-Market
                        </p>

                        <h2>
                            Help the right families discover something worth
                            trusting.
                        </h2>

                        <p>
                            We are not trying to manufacture demand. We are
                            building a product families value, then making its
                            story easy to understand, experience, and share.
                        </p>
                    </div>
                </section>

                <section className="gtm-overview-grid">
                    <article className="gtm-readiness-card">
                        <div className="gtm-readiness-card__header">
                            <div>
                                <span>Launch readiness</span>
                                <strong>{readinessPercent}%</strong>
                            </div>

                            <Target size={24} />
                        </div>

                        <div className="gtm-progress-track">
                            <div
                                className="gtm-progress-fill"
                                style={{ width: `${readinessPercent}%` }}
                            />
                        </div>

                        <p>
                            {completedCount} ready · {activeCount} in progress ·{" "}
                            {readinessItems.length - completedCount - activeCount} remaining
                        </p>
                    </article>

                    <article className="gtm-current-stage-card">
                        <span>Current stage</span>
                        <h3>Closed Beta</h3>
                        <p>
                            Validate retention, reliability, onboarding, and
                            whether real families would be disappointed if
                            Evergrove disappeared.
                        </p>
                    </article>

                    <article className="gtm-next-milestone-card">
                        <span>Next milestone</span>
                        <h3>Invite households beyond our circle</h3>
                        <p>
                            Launch the public homepage and referral system
                            without sacrificing beta quality.
                        </p>
                    </article>
                </section>

                <SectionCard
                    title="Launch Positioning"
                    icon={Megaphone}
                    className="gtm-positioning-card"
                >
                    <div className="gtm-positioning-list">
                        {positioning.map(item => (
                            <div
                                key={item.label}
                                className="gtm-positioning-item"
                            >
                                <span>{item.label}</span>
                                <p>{item.value}</p>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                <section className="gtm-section">
                    <div className="gtm-section-heading">
                        <span>What must be true</span>
                        <h2>Launch Readiness</h2>
                        <p>
                            These are the essential capabilities Evergrove needs
                            before broader household acquisition.
                        </p>
                    </div>

                    <div className="gtm-readiness-grid">
                        {readinessItems.map(item => (
                            <article
                                key={item.title}
                                className="gtm-readiness-item"
                            >
                                <div className="gtm-readiness-item__top">
                                    <div
                                        className={`gtm-status-icon gtm-status-icon--${item.status}`}
                                    >
                                        <StatusIcon status={item.status} />
                                    </div>

                                    <span
                                        className={`gtm-status-label gtm-status-label--${item.status}`}
                                    >
                                        {getStatusLabel(item.status)}
                                    </span>
                                </div>

                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="gtm-section">
                    <div className="gtm-section-heading">
                        <span>How we scale</span>
                        <h2>Launch Stages</h2>
                        <p>
                            Evergrove should earn the right to grow at each
                            stage rather than rushing toward a public launch.
                        </p>
                    </div>

                    <div className="gtm-stage-list">
                        {launchStages.map((stage, index) => (
                            <article
                                key={stage.title}
                                className="gtm-stage-item"
                            >
                                <div className="gtm-stage-item__number">
                                    {String(index + 1).padStart(2, "0")}
                                </div>

                                <div className="gtm-stage-item__content">
                                    <div className="gtm-stage-item__meta">
                                        <span>{stage.stage}</span>
                                        <strong>{stage.status}</strong>
                                    </div>

                                    <h3>{stage.title}</h3>
                                    <p>{stage.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <SectionCard
                    title="Current Priorities"
                    icon={ArrowRight}
                    className="gtm-priorities-card"
                >
                    <div className="gtm-priority-list">
                        {currentPriorities.map(priority => (
                            <article
                                key={priority.order}
                                className="gtm-priority-item"
                            >
                                <span>{priority.order}</span>

                                <div>
                                    <h3>{priority.title}</h3>
                                    <p>{priority.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </SectionCard>

                <section className="gtm-section">
                    <div className="gtm-section-heading">
                        <span>How we know it is working</span>
                        <h2>Growth Metrics</h2>
                        <p>
                            These metrics will eventually connect to live
                            product and referral data.
                        </p>
                    </div>

                    <div className="gtm-metrics-grid">
                        {metrics.map(metric => (
                            <article
                                key={metric.label}
                                className="gtm-metric-card"
                            >
                                <span>{metric.label}</span>
                                <strong>{metric.value}</strong>
                                <p>{metric.note}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <SectionCard
                    title="The Growth Principle"
                    icon={Users}
                    className="gtm-closing-card"
                >
                    <blockquote>
                        Every household that loves Evergrove should know exactly
                        how to invite another household, and every invited
                        household should immediately understand why Evergrove is
                        different.
                    </blockquote>

                    <p>
                        Growth should come from trust, real value, and families
                        sharing something that genuinely helps them.
                    </p>
                </SectionCard>
            </div>
        </AppPage>
    )
}