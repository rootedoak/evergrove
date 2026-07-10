import { Link } from "react-router-dom"
import {
    ArrowRight,
    CalendarDays,
    Check,
    ClipboardList,
    Heart,
    Leaf,
    MessageCircle,
    ShieldCheck,
    ShoppingCart,
    Sparkles,
    UtensilsCrossed
} from "lucide-react"

import logo from "../../assets/evergrove-logo.svg"

const features = [
    {
        title: "Family Calendar",
        description:
            "Keep appointments, practices, school events, birthdays, and family plans together.",
        icon: CalendarDays
    },
    {
        title: "To-Dos & Routines",
        description:
            "Share responsibilities, build helpful routines, and know what needs attention.",
        icon: ClipboardList
    },
    {
        title: "Meals & Shopping",
        description:
            "Plan dinner, save meals, and keep grocery lists connected to real family life.",
        icon: UtensilsCrossed
    },
    {
        title: "Household Communication",
        description:
            "Announcements, reminders, and important updates stay visible without getting lost in a group text.",
        icon: MessageCircle
    },
    {
        title: "Shopping Lists",
        description:
            "Create shared lists, organize items, and make shopping easier for everyone.",
        icon: ShoppingCart
    },
    {
        title: "Quiet Confidence",
        description:
            "Evergrove helps families know that the important things are remembered and cared for.",
        icon: ShieldCheck
    }
]

const benefits = [
    "One calm home for family life",
    "Designed mobile-first for busy households",
    "Built to reduce mental load, not add to it",
    "Simple enough to start using in minutes"
]

const testimonials = [
    {
        quote:
            "Evergrove gives our family one place to see what is happening and what still needs to be done.",
        attribution: "Beta household"
    },
    {
        quote:
            "I do not have to carry every detail in my head anymore. That alone makes the week feel lighter.",
        attribution: "Beta household"
    },
    {
        quote:
            "Meals, schedules, and to-dos finally feel connected instead of scattered across different apps.",
        attribution: "Beta household"
    }
]

const faqs = [
    {
        question: "What is Evergrove?",
        answer:
            "Evergrove is a family operating system that brings calendars, to-dos, meals, shopping, communication, and everyday planning into one connected place."
    },
    {
        question: "Is Evergrove free?",
        answer:
            "Evergrove is currently available free during beta while we work closely with early households and continue improving the experience."
    },
    {
        question: "Can my whole family use it?",
        answer:
            "Yes. Evergrove is designed for shared household use so adults and family members can stay informed and contribute together."
    },
    {
        question: "Does Evergrove work on a phone?",
        answer:
            "Yes. Evergrove is designed mobile-first and can be installed as a web app on supported devices."
    },
    {
        question: "Is my family's information private?",
        answer:
            "Family data is scoped to the household and protected through authenticated access and household-level permissions."
    }
]

export default function PublicHome() {
    return (
        <div className="public-home">
            <header className="public-header">
                <Link to="/" className="public-brand">
                    <img src={logo} alt="Evergrove" />

                    <div>
                        <strong>Evergrove</strong>
                        <span>Where organized families grow.</span>
                    </div>
                </Link>

                <nav className="public-nav" aria-label="Public navigation">
                    <a href="#why-evergrove">Why Evergrove</a>
                    <a href="#features">Features</a>
                    <a href="#families">For Families</a>
                    <a href="#faq">FAQ</a>
                </nav>

                <div className="public-header-actions">
                    <Link to="/login" className="public-link-button">
                        Sign In
                    </Link>

                    <Link to="/login?mode=signup" className="public-button public-button--small">
                        Get Started
                    </Link>
                </div>
            </header>

            <main>
                <section className="public-hero">
                    <div className="public-hero__content">
                        <div className="public-eyebrow">
                            <Leaf size={16} />
                            <span>A calmer way to run family life</span>
                        </div>

                        <h1>
                            Remember what matters.
                            <span>Enjoy more of what does.</span>
                        </h1>

                        <p>
                            Evergrove helps busy families organize schedules,
                            meals, to-dos, shopping, school, and everything in
                            between—all in one calm, connected place.
                        </p>

                        <div className="public-hero__actions">
                            <Link
                                to="/login?mode=signup"
                                className="public-button public-button--primary"
                            >
                                Get Started Free
                                <ArrowRight size={18} />
                            </Link>

                            <a
                                href="#why-evergrove"
                                className="public-button public-button--secondary"
                            >
                                See How It Works
                            </a>
                        </div>

                        <div className="public-hero__trust">
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

                    <div className="public-hero__visual">
                        <div className="public-app-preview">
                            <div className="public-app-preview__topbar">
                                <span />
                                <span />
                                <span />
                            </div>

                            <div className="public-app-preview__body">
                                <div className="public-preview-greeting">
                                    <span>Good morning</span>
                                    <strong>Your family is ready for today.</strong>
                                </div>

                                <div className="public-preview-grid">
                                    <article className="public-preview-card public-preview-card--wide">
                                        <span>Today</span>
                                        <strong>Soccer practice at 5:30 PM</strong>
                                        <p>Ella · South Field</p>
                                    </article>

                                    <article className="public-preview-card">
                                        <CalendarDays size={20} />
                                        <span>3 events</span>
                                        <strong>Coming up</strong>
                                    </article>

                                    <article className="public-preview-card">
                                        <ClipboardList size={20} />
                                        <span>4 to-dos</span>
                                        <strong>Under control</strong>
                                    </article>

                                    <article className="public-preview-card public-preview-card--meal">
                                        <UtensilsCrossed size={20} />
                                        <span>Dinner tonight</span>
                                        <strong>Chicken tacos</strong>
                                    </article>

                                    <article className="public-preview-card public-preview-card--soft">
                                        <Sparkles size={20} />
                                        <span>Evergrove Assistant</span>
                                        <strong>
                                            You have everything you need for the
                                            week ahead.
                                        </strong>
                                    </article>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="why-evergrove"
                    className="public-section public-problem-section"
                >
                    <div className="public-section-heading public-section-heading--centered">
                        <span>Why Evergrove</span>
                        <h2>Your family already has enough to remember.</h2>
                        <p>
                            Calendars, texts, sticky notes, school emails,
                            shopping lists, meal plans, and mental reminders
                            should not live in seven different places.
                        </p>
                    </div>

                    <div className="public-problem-grid">
                        <article className="public-problem-card">
                            <span className="public-problem-card__label">
                                Without Evergrove
                            </span>

                            <h3>Family life depends on memory.</h3>

                            <div className="public-problem-list">
                                <p>Important details live in different apps.</p>
                                <p>One person carries most of the mental load.</p>
                                <p>Tasks are remembered only when they become urgent.</p>
                                <p>Everyone asks the same questions repeatedly.</p>
                            </div>
                        </article>

                        <article className="public-problem-card public-problem-card--solution">
                            <span className="public-problem-card__label">
                                With Evergrove
                            </span>

                            <h3>Everyone knows what matters next.</h3>

                            <div className="public-problem-list">
                                <p>Schedules and responsibilities stay connected.</p>
                                <p>The household shares the work of family life.</p>
                                <p>Important things are visible before they become urgent.</p>
                                <p>Families feel prepared instead of reactive.</p>
                            </div>
                        </article>
                    </div>
                </section>

                <section
                    id="features"
                    className="public-section public-features-section"
                >
                    <div className="public-section-heading">
                        <span>Everything together</span>
                        <h2>One home for your family's life.</h2>
                        <p>
                            Evergrove connects the everyday systems families
                            already use, so information does not have to be
                            recreated, remembered, or hunted down.
                        </p>
                    </div>

                    <div className="public-feature-grid">
                        {features.map(feature => {
                            const Icon = feature.icon

                            return (
                                <article
                                    key={feature.title}
                                    className="public-feature-card"
                                >
                                    <div className="public-feature-card__icon">
                                        <Icon size={22} />
                                    </div>

                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </article>
                            )
                        })}
                    </div>
                </section>

                <section id="families" className="public-story-section">
                    <div className="public-story-section__content">
                        <span>Built for real families</span>

                        <h2>
                            Family life is messy.
                            <br />
                            Evergrove does not expect perfection.
                        </h2>

                        <p>
                            Plans change. Dinner gets moved. Permission slips
                            disappear into backpacks. Evergrove is designed to
                            support progress, shared responsibility, and calmer
                            weeks—not to make families feel behind.
                        </p>

                        <div className="public-benefit-list">
                            {benefits.map(benefit => (
                                <div key={benefit}>
                                    <Check size={16} strokeWidth={3} />
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="public-story-quote">
                        <Heart size={28} />

                        <blockquote>
                            To give every family confidence that the important
                            things are remembered, organized, and cared for.
                        </blockquote>

                        <span>Our vision</span>
                    </div>
                </section>

                <section className="public-section">
                    <div className="public-section-heading public-section-heading--centered">
                        <span>From early families</span>
                        <h2>Built alongside the people who use it.</h2>
                        <p>
                            Evergrove is being shaped through real household
                            feedback, real routines, and real family life.
                        </p>
                    </div>

                    <div className="public-testimonial-grid">
                        {testimonials.map(testimonial => (
                            <article
                                key={testimonial.quote}
                                className="public-testimonial-card"
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

                <section id="faq" className="public-section public-faq-section">
                    <div className="public-section-heading">
                        <span>Questions</span>
                        <h2>Frequently asked questions.</h2>
                    </div>

                    <div className="public-faq-list">
                        {faqs.map(item => (
                            <details key={item.question}>
                                <summary>{item.question}</summary>
                                <p>{item.answer}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className="public-final-cta">
                    <div className="public-final-cta__icon">
                        <Leaf size={26} />
                    </div>

                    <span>Welcome home</span>

                    <h2>Give your family one less thing to remember.</h2>

                    <p>
                        Start building a calmer, more connected home with
                        Evergrove.
                    </p>

                    <Link
                        to="/login?mode=signup"
                        className="public-button public-button--primary"
                    >
                        Get Started Free
                        <ArrowRight size={18} />
                    </Link>
                </section>
            </main>

            <footer className="public-footer">
                <div className="public-footer__brand">
                    <img src={logo} alt="" />

                    <div>
                        <strong>Evergrove</strong>
                        <span>Where organized families grow.</span>
                    </div>
                </div>

                <div className="public-footer__links">
                    <Link to="/login">Sign In</Link>
                    <a href="#features">Features</a>
                    <a href="#faq">FAQ</a>
                </div>

                <p>
                    © {new Date().getFullYear()} Evergrove. Built for family
                    life.
                </p>
            </footer>
        </div>
    )
}