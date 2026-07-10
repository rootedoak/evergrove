import {
    CalendarCheck,
    Check,
    Heart,
    Home,
    Leaf,
    ShieldCheck,
    Sparkles,
    Sprout,
    Target
} from "lucide-react"

import AppPage from "../../../components/ui/AppPage"
import PageHeader from "../../../components/ui/PageHeader"
import SectionCard from "../../../components/ui/SectionCard"

const principles = [
    {
        title: "Confidence over Complexity",
        description:
            "Every feature should reduce uncertainty. If it makes families remember more, think harder, or manage another system, we rethink it.",
        icon: ShieldCheck,
        examples: [
            "We merged Activities into Calendar instead of maintaining two overlapping systems.",
            "We simplify workflows before adding new settings or controls."
        ]
    },
    {
        title: "Family First",
        description:
            "Technology is the tool. Family is the purpose. Our decisions should help people care for one another and share the work of family life.",
        icon: Heart,
        examples: [
            "Household tools are designed for shared responsibility.",
            "Communication should strengthen connection rather than create noise."
        ]
    },
    {
        title: "Calm Wins",
        description:
            "Busy families do not need more noise. Evergrove should provide clarity and peace of mind without demanding constant attention.",
        icon: Leaf,
        examples: [
            "We favor clear summaries over crowded dashboards.",
            "Notifications should be useful, timely, and easy to understand."
        ]
    },
    {
        title: "One Home",
        description:
            "Evergrove should be the trusted place where family life comes together—not another disconnected app families must remember to manage.",
        icon: Home,
        examples: [
            "Calendars, to-dos, meals, shopping, school, and communication belong together.",
            "Features should connect naturally across the household experience."
        ]
    },
    {
        title: "Progress over Perfection",
        description:
            "Families are human and life is messy. Evergrove should support steady progress without creating guilt or expecting perfection.",
        icon: Sparkles,
        examples: [
            "Incomplete plans should still be useful.",
            "The product should encourage families without judging them."
        ]
    },
    {
        title: "Grow Together",
        description:
            "Families change over time. Evergrove should grow with them through new seasons, responsibilities, relationships, and milestones.",
        icon: Sprout,
        examples: [
            "Evergrove should remain useful as children and households change.",
            "The product should adapt without forcing families to start over."
        ]
    }
]

const evergroveTest = [
    "Does it increase a family's confidence?",
    "Does it reduce the mental load of everyday life?",
    "Does it help family members care for one another?",
    "Does it feel calm and clear?",
    "Does it make daily life simpler?"
]

const decisions = [
    {
        date: "July 2026",
        title: "Evergrove Foundations adopted",
        description:
            "Mission, vision, tagline, brand promise, north star, and company principles were formally defined."
    },
    {
        date: "July 2026",
        title: "Tagline selected",
        description:
            "Where organized families grow became Evergrove's primary company tagline."
    },
    {
        date: "July 2026",
        title: "Confidence established as the core outcome",
        description:
            "Evergrove will measure product decisions by their ability to increase confidence and reduce mental load."
    }
]

export default function Foundations() {
    return (
        <AppPage>
            <PageHeader
                eyebrow="Company"
                title="Foundations"
                description="The purpose, principles, and promises that guide Evergrove."
            />

            <div className="foundations-page">
                <section className="foundations-hero">
                    <div className="foundations-hero__content">
                        <div className="foundations-hero__mark">
                            <Leaf size={24} />
                        </div>

                        <p className="foundations-hero__name">Evergrove</p>

                        <h2>Where organized families grow.</h2>

                        <p className="foundations-hero__description">
                            Helping families feel confident that the important
                            things are remembered, organized, and cared for.
                        </p>

                        <div className="foundations-hero__meta">
                            Last updated July 9, 2026
                        </div>
                    </div>
                </section>

                <SectionCard
                    title="Why We Exist"
                    icon={Heart}
                    className="foundations-purpose-card"
                >
                    <div className="foundations-purpose">
                        <p>
                            We believe families should not have to rely on
                            memory to manage what matters most.
                        </p>

                        <p>
                            Life is busy. School papers, practices, meals,
                            appointments, chores, birthdays, errands, and
                            conversations compete for attention every day.
                            The mental load of keeping a household running
                            should not fall on one person—or on anyone&apos;s
                            memory alone.
                        </p>

                        <p>
                            Evergrove exists to give families confidence that
                            the important things are remembered, organized,
                            and cared for.
                        </p>
                    </div>
                </SectionCard>

                <section className="foundations-statement-grid">
                    <article className="foundations-statement-card">
                        <span className="foundations-statement-card__label">
                            Mission
                        </span>

                        <p>
                            To help families spend less time managing life and
                            more time living it.
                        </p>
                    </article>

                    <article className="foundations-statement-card">
                        <span className="foundations-statement-card__label">
                            Vision
                        </span>

                        <p>
                            To give every family confidence that the important
                            things are remembered, organized, and cared for.
                        </p>
                    </article>

                    <article className="foundations-statement-card">
                        <span className="foundations-statement-card__label">
                            Brand Promise
                        </span>

                        <p>
                            Spend less time managing life and more time living
                            it.
                        </p>
                    </article>
                </section>

                <SectionCard
                    title="Our North Star"
                    icon={Target}
                    className="foundations-north-star"
                >
                    <blockquote>
                        Every decision we make should increase a family&apos;s
                        confidence while reducing the mental load of everyday
                        life.
                    </blockquote>
                </SectionCard>

                <section className="foundations-principles-section">
                    <div className="foundations-section-heading">
                        <span>How we make decisions</span>
                        <h2>The Evergrove Principles</h2>
                        <p>
                            These principles define what belongs in Evergrove
                            and how we expect the product and company to behave.
                        </p>
                    </div>

                    <div className="foundations-principles-grid">
                        {principles.map(principle => {
                            const Icon = principle.icon

                            return (
                                <article
                                    key={principle.title}
                                    className="foundations-principle-card"
                                >
                                    <div className="foundations-principle-card__icon">
                                        <Icon size={21} />
                                    </div>

                                    <h3>{principle.title}</h3>
                                    <p>{principle.description}</p>

                                    <div className="foundations-principle-card__examples">
                                        <span>What this looks like</span>

                                        {principle.examples.map(example => (
                                            <div
                                                key={example}
                                                className="foundations-principle-example"
                                            >
                                                <Check size={14} />
                                                <p>{example}</p>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </section>

                <SectionCard
                    title="The Evergrove Test"
                    icon={Check}
                    className="foundations-test-card"
                >
                    <p className="foundations-test-card__intro">
                        Before we build, launch, or promote anything, we ask:
                    </p>

                    <div className="foundations-test-list">
                        {evergroveTest.map(question => (
                            <div
                                key={question}
                                className="foundations-test-item"
                            >
                                <span className="foundations-test-item__check">
                                    <Check size={16} strokeWidth={3} />
                                </span>

                                <span>{question}</span>
                            </div>
                        ))}
                    </div>

                    <p className="foundations-test-card__closing">
                        When the answer is no, we rethink the solution.
                    </p>
                </SectionCard>

                <SectionCard
                    title="Decision Log"
                    icon={CalendarCheck}
                    className="foundations-decision-card"
                >
                    <p className="foundations-decision-card__intro">
                        A record of the major decisions that shape Evergrove
                        and why they were made.
                    </p>

                    <div className="foundations-decision-list">
                        {decisions.map(decision => (
                            <article
                                key={`${decision.date}-${decision.title}`}
                                className="foundations-decision-item"
                            >
                                <div className="foundations-decision-item__marker">
                                    <Check size={15} strokeWidth={3} />
                                </div>

                                <div>
                                    <span className="foundations-decision-item__date">
                                        {decision.date}
                                    </span>

                                    <h3>{decision.title}</h3>
                                    <p>{decision.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </SectionCard>
            </div>
        </AppPage>
    )
}