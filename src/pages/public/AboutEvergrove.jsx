import { Link } from "react-router-dom"
import {
    ArrowRight,
    CalendarDays,
    Check,
    Heart,
    Leaf,
    Sparkles,
    Trees,
    Users
} from "lucide-react"

const everydayMoments = [
    "School mornings",
    "Dinner around the table",
    "Weekend soccer games",
    "Helping with homework",
    "Family vacations",
    "Birthday parties"
]

const operatingSystemAreas = [
    "Calendars",
    "To-dos",
    "Shopping",
    "Meals",
    "School",
    "Trips",
    "Important information",
    "Everyday family life"
]

export default function AboutEvergrove() {
    return (
        <>
            <section className="public-site-hero public-site-hero--compact about-public-hero">
                <div className="about-public-hero__content">
                    <div className="public-site-eyebrow">
                        <Leaf size={16} />
                        <span>About Evergrove</span>
                    </div>

                    <h1>
                        We&apos;re building software for one of the most
                        important organizations in the world.
                        <span>Families.</span>
                    </h1>

                    <p>
                        Modern family life is full of moving pieces.
                        Calendars, school, meals, appointments, shopping,
                        chores, birthdays, trips, and countless little
                        details compete for attention every day.
                    </p>

                    <p className="about-public-hero__statement">
                        We believe technology should reduce that burden,
                        not add to it.
                    </p>
                </div>

                <div
                    className="about-public-hero__symbol"
                    aria-hidden="true"
                >
                    <Trees size={64} />
                </div>
            </section>

            <section className="about-vision-section">
                <div className="about-vision-section__inner">
                    <span>Our vision</span>

                    <blockquote>
                        To give families confidence that the important
                        things will not be forgotten, so they can spend
                        less time managing life and more time living it.
                    </blockquote>
                </div>
            </section>

            <section className="public-site-section about-origin-section">
                <div className="public-site-section-heading">
                    <span>Why we built Evergrove</span>

                    <h2>
                        Every family has someone who remembers everything.
                    </h2>
                </div>

                <div className="about-origin-layout">
                    <div className="about-origin-copy">
                        <p>
                            School picture day. The dentist appointment.
                            What&apos;s for dinner. Who needs to be picked
                            up. Who still has homework. Whether there is
                            milk in the refrigerator.
                        </p>

                        <p>
                            Every household has someone carrying much of
                            that mental load. Not because they want to.
                            Because someone has to.
                        </p>

                        <p>
                            Evergrove exists to help carry some of that
                            burden.
                        </p>

                        <p>
                            Not by asking families to work harder, but by
                            helping everyone stay connected around what
                            matters.
                        </p>
                    </div>

                    <div className="about-origin-card">
                        <div className="about-origin-card__icon">
                            <Heart size={25} />
                        </div>

                        <span>The problem is not that families do not care.</span>

                        <h3>
                            The problem is that modern family life is
                            fragmented.
                        </h3>

                        <p>
                            Important details live across too many places,
                            and too much depends on one person remembering
                            everything.
                        </p>
                    </div>
                </div>
            </section>

            <section className="about-name-section">
                <div className="public-site-section-heading public-site-section-heading--centered">
                    <span>Why the name?</span>

                    <h2>
                        Evergrove is built from two ideas.
                    </h2>
                </div>

                <div className="about-name-grid">
                    <article className="about-name-card">
                        <div className="about-name-card__icon">
                            <Sparkles size={24} />
                        </div>

                        <span>Ever.</span>

                        <h3>
                            The everyday moments that make up family life.
                        </h3>

                        <div className="about-moment-list">
                            {everydayMoments.map(moment => (
                                <div key={moment}>
                                    <Check size={15} />
                                    <p>{moment}</p>
                                </div>
                            ))}
                        </div>

                        <p className="about-name-card__closing">
                            The ordinary moments that become extraordinary
                            memories.
                        </p>
                    </article>

                    <article className="about-name-card about-name-card--grove">
                        <div className="about-name-card__icon">
                            <Trees size={24} />
                        </div>

                        <span>Grove.</span>

                        <h3>
                            A grove is a place where things grow.
                        </h3>

                        <p>
                            Strong trees do not grow alone. Neither do
                            families.
                        </p>

                        <p>
                            Families grow through shared experiences,
                            shared responsibilities, and showing up for one
                            another every day.
                        </p>
                    </article>
                </div>

                <div className="about-name-conclusion">
                    <span>Evergrove</span>

                    <h2>
                        A place where families continue growing together
                        through every season of life.
                    </h2>
                </div>
            </section>

            <section className="public-site-section about-building-section">
                <div className="public-site-section-heading">
                    <span>What we&apos;re building</span>

                    <h2>
                        The family operating system.
                    </h2>

                    <p>
                        One place where the everyday systems families
                        already depend on can finally work together.
                    </p>
                </div>

                <div className="about-building-layout">
                    <div className="about-building-grid">
                        {operatingSystemAreas.map(area => (
                            <div
                                key={area}
                                className="about-building-item"
                            >
                                <Check size={16} />
                                <span>{area}</span>
                            </div>
                        ))}
                    </div>

                    <div className="about-building-card">
                        <div className="about-building-card__icon">
                            <CalendarDays size={25} />
                        </div>

                        <h3>
                            Not because families need another app.
                        </h3>

                        <p>
                            Because families deserve one place that finally
                            feels like home.
                        </p>
                    </div>
                </div>
            </section>

            <section className="about-promise-section">
                <div className="about-promise-section__content">
                    <span>Our promise</span>

                    <h2>
                        We will not build software that demands more
                        attention.
                    </h2>

                    <div className="about-promise-list">
                        <p>
                            We will not chase engagement for the sake of
                            engagement.
                        </p>

                        <p>
                            We will not fill your day with unnecessary
                            notifications.
                        </p>

                        <p>
                            We will build software that quietly helps your
                            family stay organized so you can spend more
                            time paying attention to each other.
                        </p>
                    </div>
                </div>

                <div className="about-promise-section__symbol">
                    <Users size={54} />
                </div>
            </section>

            <section className="public-site-final-cta">
                <div>
                    <Leaf size={27} />
                </div>

                <span>Welcome home</span>

                <h2>
                    Ready to spend less time managing life and more time
                    living it?
                </h2>

                <p>
                    Create your household and start building a calmer,
                    more connected home with Evergrove.
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