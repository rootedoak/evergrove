import { Link } from "react-router-dom"
import {
    ArrowRight,
    CalendarDays,
    Check,
    ChevronDown,
    ClipboardCheck,
    Heart,
    Leaf,
    LockKeyhole,
    MessageCircle,
    ShieldCheck,
    ShoppingCart,
    Sparkles,
    UtensilsCrossed
} from "lucide-react"

import dashboardScreenshot from "../../assets/public/dashboard-mobile.png"
import calendarScreenshot from "../../assets/public/calendar-mobile.png"
import mealsScreenshot from "../../assets/public/meals-mobile.png"

import "../../styles/public.css"

const connectedFeatures = [
    {
        title: "Family Calendar",
        description:
            "Appointments, school, activities, birthdays, trips, and important dates.",
        icon: CalendarDays
    },
    {
        title: "Shared To-Dos",
        description:
            "Keep responsibilities visible and make it easier to share the work.",
        icon: ClipboardCheck
    },
    {
        title: "Meals & Groceries",
        description:
            "Plan dinner, save favorites, and build grocery lists in one place.",
        icon: UtensilsCrossed
    },
    {
        title: "Shopping Lists",
        description:
            "Shared lists that stay organized whether you are planning or shopping.",
        icon: ShoppingCart
    },
    {
        title: "Family Communication",
        description:
            "Announcements, updates, and important information without another group text.",
        icon: MessageCircle
    },
    {
        title: "Quiet Confidence",
        description:
            "Know the important things are remembered, organized, and cared for.",
        icon: ShieldCheck
    }
]

const trustPoints = [
    {
        title: "No advertising",
        description:
            "Evergrove is built to serve families, not advertisers.",
        icon: Heart
    },
    {
        title: "We do not sell family data",
        description:
            "Your household information is not a product to be packaged or sold.",
        icon: LockKeyhole
    },
    {
        title: "Household-first privacy",
        description:
            "Family information is protected through authenticated, household-scoped access.",
        icon: ShieldCheck
    },
    {
        title: "Designed to feel calm",
        description:
            "Evergrove should reduce stress—not become another source of noise.",
        icon: Leaf
    }
]

const testimonials = [
    {
        quote:
            "Evergrove gives our family one place to see what is happening and what still needs to be done.",
        attribution: "Evergrove beta family"
    },
    {
        quote:
            "I do not have to carry every detail in my head anymore. That alone makes the week feel lighter.",
        attribution: "Evergrove beta family"
    },
    {
        quote:
            "Meals, schedules, and to-dos finally feel connected instead of scattered across different apps.",
        attribution: "Evergrove beta family"
    }
]

const faqs = [
    {
        question: "What is Evergrove?",
        answer:
            "Evergrove is a family operating system that brings calendars, to-dos, meals, shopping, school, trips, communication, and everyday planning into one connected place."
    },
    {
        question: "Who is Evergrove for?",
        answer:
            "Evergrove is designed for busy households that want a calmer, more reliable way to coordinate family life without depending on one person to remember everything."
    },
    {
        question: "Is Evergrove free?",
        answer:
            "Evergrove is currently free during beta while we continue improving the experience alongside early households."
    },
    {
        question: "Can my whole family use it?",
        answer:
            "Yes. Evergrove is built around the household, so family members can share information, responsibilities, schedules, and plans."
    },
    {
        question: "Does Evergrove work on a phone?",
        answer:
            "Yes. Evergrove is designed mobile-first and can be installed as a web app on supported phones and devices."
    },
    {
        question: "How does Evergrove protect family information?",
        answer:
            "Evergrove uses authenticated access and household-scoped permissions. We do not sell household information or use it to power advertising."
    }
]

export default function PublicHome() {
    return (
        <>
            <section className="public-site-hero">
                <div className="public-site-hero-copy">
                    <div className="public-site-eyebrow">
                        <Leaf size={16} />
                        <span>A calmer way to run family life</span>
                    </div>

                    <h1>
                        Where organized
                        <span>families grow.</span>
                    </h1>

                    <p>
                        Evergrove keeps your family calendar,
                        meals, to-dos, shopping, school, and
                        everyday life connected in one calm
                        place.
                    </p>

                    <div className="public-site-hero-actions">
                        <Link
                            to="/login?mode=signup"
                            className="public-site-button public-site-button--primary"
                        >
                            Start Your Household
                            <ArrowRight size={18} />
                        </Link>

                        <a
                            href="#product"
                            className="public-site-button public-site-button--secondary"
                        >
                            See Evergrove
                        </a>
                    </div>

                    <div className="public-site-hero-details">
                        <span>
                            <Check size={15} />
                            Free during beta
                        </span>

                        <span>
                            <Check size={15} />
                            Mobile-first
                        </span>

                        <span>
                            <Check size={15} />
                            Built for real families
                        </span>
                    </div>
                </div>

                <div className="public-site-hero-product">
                    <div className="public-phone-frame public-phone-frame--hero">
                        <div className="public-phone-speaker" />

                        <img
                            src={dashboardScreenshot}
                            alt="Evergrove family dashboard showing today's schedule, tasks, and meal plan"
                        />
                    </div>

                    <div className="public-site-hero-note public-site-hero-note--top">
                        <Sparkles size={17} />
                        <span>Today is under control.</span>
                    </div>

                    <div className="public-site-hero-note public-site-hero-note--bottom">
                        <Heart size={17} />
                        <span>Less mental load.</span>
                    </div>
                </div>
            </section>

            <section
                id="why"
                className="public-site-section public-site-problem"
            >
                <div className="public-site-section-heading public-site-section-heading--centered">
                    <span>Why Evergrove</span>

                    <h2>
                        Your family already has enough to remember.
                    </h2>

                    <p>
                        School emails, text messages, calendars,
                        notes, grocery lists, meal plans, and mental
                        reminders should not live in seven different
                        places.
                    </p>
                </div>

                <div className="public-site-problem-grid">
                    <article className="public-site-problem-card">
                        <span>Without Evergrove</span>

                        <h3>Family life depends on memory.</h3>

                        <div>
                            <p>
                                Important details are scattered
                                across different apps and conversations.
                            </p>

                            <p>
                                One person often carries most of the
                                household&apos;s mental load.
                            </p>

                            <p>
                                Responsibilities become visible only
                                when they become urgent.
                            </p>

                            <p>
                                Family members repeatedly ask the same
                                questions.
                            </p>
                        </div>
                    </article>

                    <article className="public-site-problem-card public-site-problem-card--solution">
                        <span>With Evergrove</span>

                        <h3>Everyone knows what matters next.</h3>

                        <div>
                            <p>
                                Schedules, responsibilities, meals, and
                                plans stay connected.
                            </p>

                            <p>
                                Household information is visible to the
                                people who need it.
                            </p>

                            <p>
                                Important things are handled before
                                they become emergencies.
                            </p>

                            <p>
                                Families feel more prepared and less
                                reactive.
                            </p>
                        </div>
                    </article>
                </div>
            </section>

            <section
                id="product"
                className="public-site-product-section"
            >
                <div className="public-site-section-heading public-site-section-heading--centered">
                    <span>See Evergrove in action</span>

                    <h2>
                        One home for your family&apos;s life.
                    </h2>

                    <p>
                        Evergrove does not just collect features. It
                        connects the parts of family life that already
                        depend on one another.
                    </p>
                </div>

                <div className="public-site-showcase-list">
                    <article className="public-site-showcase">
                        <div className="public-site-showcase-copy">
                            <span className="public-site-showcase-number">
                                01
                            </span>

                            <p className="public-site-showcase-eyebrow">
                                Your family dashboard
                            </p>

                            <h3>
                                Know what matters in seconds.
                            </h3>

                            <p>
                                See today&apos;s schedule, overdue
                                to-dos, inbox updates, dinner, and
                                household activity without hunting
                                through multiple apps.
                            </p>

                            <ul>
                                <li>
                                    <Check size={16} />
                                    See what needs attention
                                </li>

                                <li>
                                    <Check size={16} />
                                    Know what is happening today
                                </li>

                                <li>
                                    <Check size={16} />
                                    Keep dinner visible
                                </li>
                            </ul>
                        </div>

                        <div className="public-site-showcase-visual">
                            <div className="public-phone-frame">
                                <div className="public-phone-speaker" />

                                <img
                                    src={dashboardScreenshot}
                                    alt="Evergrove dashboard on a mobile phone"
                                />
                            </div>
                        </div>
                    </article>

                    <article className="public-site-showcase public-site-showcase--reverse">
                        <div className="public-site-showcase-copy">
                            <span className="public-site-showcase-number">
                                02
                            </span>

                            <p className="public-site-showcase-eyebrow">
                                Family Calendar
                            </p>

                            <h3>
                                One calendar for the entire household.
                            </h3>

                            <p>
                                Keep school events, birthdays, sports,
                                appointments, trips, activities, and
                                important dates in one shared view.
                            </p>

                            <ul>
                                <li>
                                    <Check size={16} />
                                    Timeline and month views
                                </li>

                                <li>
                                    <Check size={16} />
                                    Trips and school planning
                                </li>

                                <li>
                                    <Check size={16} />
                                    Shared household visibility
                                </li>
                            </ul>
                        </div>

                        <div className="public-site-showcase-visual">
                            <div className="public-phone-frame">
                                <div className="public-phone-speaker" />

                                <img
                                    src={calendarScreenshot}
                                    alt="Evergrove family calendar displayed on a mobile phone"
                                />
                            </div>
                        </div>
                    </article>

                    <article className="public-site-showcase">
                        <div className="public-site-showcase-copy">
                            <span className="public-site-showcase-number">
                                03
                            </span>

                            <p className="public-site-showcase-eyebrow">
                                Meals &amp; Groceries
                            </p>

                            <h3>
                                Stop asking what&apos;s for dinner.
                            </h3>

                            <p>
                                Plan meals for the week, save family
                                favorites, and build grocery lists that
                                stay connected to the plan.
                            </p>

                            <ul>
                                <li>
                                    <Check size={16} />
                                    Weekly dinner planning
                                </li>

                                <li>
                                    <Check size={16} />
                                    Saved meals and favorites
                                </li>

                                <li>
                                    <Check size={16} />
                                    Connected grocery lists
                                </li>
                            </ul>
                        </div>

                        <div className="public-site-showcase-visual">
                            <div className="public-phone-frame">
                                <div className="public-phone-speaker" />

                                <img
                                    src={mealsScreenshot}
                                    alt="Evergrove meal planning displayed on a mobile phone"
                                />
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <section className="public-site-section public-site-connected">
                <div className="public-site-section-heading">
                    <span>Everything works together</span>

                    <h2>
                        The everyday systems your family already needs.
                    </h2>

                    <p>
                        Evergrove connects the pieces of family life so
                        information does not need to be recreated,
                        remembered, or tracked down.
                    </p>
                </div>

                <div className="public-site-feature-grid">
                    {connectedFeatures.map(feature => {
                        const Icon = feature.icon

                        return (
                            <article
                                key={feature.title}
                                className="public-site-feature-card"
                            >
                                <div>
                                    <Icon size={22} />
                                </div>

                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </article>
                        )
                    })}
                </div>
            </section>

            <section className="public-site-story">
                <div className="public-site-story-copy">
                    <span>Family life is busy</span>

                    <h2>
                        Evergrove was not built to help you do more.
                    </h2>

                    <p className="public-site-story-highlight">
                        It was built so you do not have to remember
                        everything.
                    </p>

                    <p>
                        Families do not need another productivity
                        system demanding attention. They need quiet,
                        dependable support that helps everyone feel
                        prepared.
                    </p>

                    <div className="public-site-story-outcomes">
                        <strong>Less mental load.</strong>
                        <strong>More confidence.</strong>
                        <strong>More family.</strong>
                    </div>
                </div>

                <div className="public-site-story-quote">
                    <Leaf size={28} />

                    <blockquote>
                        To give every family confidence that the
                        important things are remembered, organized,
                        and cared for.
                    </blockquote>

                    <span>Evergrove&apos;s vision</span>
                </div>
            </section>

            <section
                id="trust"
                className="public-site-section public-site-trust"
            >
                <div className="public-site-section-heading public-site-section-heading--centered">
                    <span>Built for families</span>

                    <h2>
                        A household app should be worthy of trust.
                    </h2>

                    <p>
                        Evergrove is being built around a simple
                        belief: technology should support family life
                        without exploiting it.
                    </p>
                </div>

                <div className="public-site-trust-grid">
                    {trustPoints.map(point => {
                        const Icon = point.icon

                        return (
                            <article
                                key={point.title}
                                className="public-site-trust-card"
                            >
                                <div>
                                    <Icon size={22} />
                                </div>

                                <h3>{point.title}</h3>
                                <p>{point.description}</p>
                            </article>
                        )
                    })}
                </div>

                <div className="public-site-trust-link">
                    <Link to="/trust">
                        Visit the Evergrove Trust Center
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </section>

            <section className="public-site-section public-site-testimonials">
                <div className="public-site-section-heading public-site-section-heading--centered">
                    <span>Built alongside real families</span>

                    <h2>
                        Shaped by the households who use it.
                    </h2>

                    <p>
                        Evergrove is being improved through real
                        routines, real feedback, and real family life.
                    </p>
                </div>

                <div className="public-site-testimonial-grid">
                    {testimonials.map(testimonial => (
                        <article
                            key={testimonial.quote}
                            className="public-site-testimonial-card"
                        >
                            <Sparkles size={20} />

                            <blockquote>
                                “{testimonial.quote}”
                            </blockquote>

                            <span>{testimonial.attribution}</span>
                        </article>
                    ))}
                </div>
            </section>

            <section
                id="faq"
                className="public-site-section public-site-faq"
            >
                <div className="public-site-faq-layout">
                    <div className="public-site-section-heading">
                        <span>Questions</span>

                        <h2>
                            A few things families usually ask.
                        </h2>

                        <p>
                            Evergrove is still growing. These answers
                            reflect the current beta experience.
                        </p>
                    </div>

                    <div className="public-site-faq-list">
                        {faqs.map(item => (
                            <details key={item.question}>
                                <summary>
                                    <span>{item.question}</span>
                                    <ChevronDown size={19} />
                                </summary>

                                <p>{item.answer}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            <section className="public-site-final-cta">
                <div>
                    <Leaf size={27} />
                </div>

                <span>Welcome home</span>

                <h2>
                    Give your family one less thing to remember.
                </h2>

                <p>
                    Create your household and start building a
                    calmer, more connected home with Evergrove.
                </p>

                <Link
                    to="/login?mode=signup"
                    className="public-site-button public-site-button--primary"
                >
                    Start Your Household
                    <ArrowRight size={18} />
                </Link>
            </section>
        </>
    )
}