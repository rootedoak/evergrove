import {
    Check,
    CircleHelp,
    Copy,
    Heart,
    Image,
    Layers3,
    Leaf,
    MessageCircle,
    Palette,
    ShieldCheck,
    Sparkles,
    Smartphone,
    Sun,
    Type
} from "lucide-react"

import AppPage from "../../../components/ui/AppPage"
import PageHeader from "../../../components/ui/PageHeader"
import SectionCard from "../../../components/ui/SectionCard"

const personalityTraits = [
    {
        title: "Calm",
        description:
            "We reduce noise, uncertainty, and pressure. Evergrove should make family life feel more manageable.",
        icon: Leaf
    },
    {
        title: "Helpful",
        description:
            "Every interaction should solve a real problem or make the next step easier to understand.",
        icon: CircleHelp
    },
    {
        title: "Human",
        description:
            "We speak like a thoughtful person, not a system message, workflow engine, or corporate platform.",
        icon: Heart
    },
    {
        title: "Encouraging",
        description:
            "We recognize progress without creating guilt, judgment, or pressure to be perfect.",
        icon: Sparkles
    },
    {
        title: "Trustworthy",
        description:
            "We are honest, reliable, careful with family information, and clear about what Evergrove can do.",
        icon: ShieldCheck
    },
    {
        title: "Hopeful",
        description:
            "Our language reflects the belief that family life can feel more connected, prepared, and supported.",
        icon: Sun
    }
]

const brandPillars = [
    {
        title: "Trust",
        description:
            "Families rely on Evergrove to remember important details, protect their information, and work consistently.",
        icon: ShieldCheck
    },
    {
        title: "Calm",
        description:
            "Evergrove should reduce mental load rather than becoming another system families have to manage.",
        icon: Leaf
    },
    {
        title: "Preparedness",
        description:
            "We help families see what matters next so they can feel ready instead of reactive.",
        icon: Check
    },
    {
        title: "Connection",
        description:
            "Technology should strengthen the household and make coordination easier without replacing real family interaction.",
        icon: Heart
    },
    {
        title: "Confidence",
        description:
            "Every useful interaction should leave a family feeling more capable and in control.",
        icon: Sparkles
    }
]

const voiceExamples = [
    {
        say: "Welcome Home",
        avoid: "Household created successfully"
    },
    {
        say: "You're all set.",
        avoid: "Operation completed"
    },
    {
        say: "Let's plan dinner.",
        avoid: "Create meal-plan record"
    },
    {
        say: "Capture a Thought",
        avoid: "Add personal note"
    },
    {
        say: "Invite your family",
        avoid: "Add household members"
    },
    {
        say: "Save changes",
        avoid: "Submit configuration"
    }
]

const emotionalOutcomes = [
    "Confident",
    "Prepared",
    "Connected",
    "Calm",
    "Supported"
]

const colors = [
    {
        name: "Evergrove Navy",
        value: "#10263D",
        purpose:
            "Primary brand anchor, navigation, hero sections, and high-trust moments"
    },
    {
        name: "Grove Blue",
        value: "#173A52",
        purpose:
            "Primary buttons, links, interactive controls, and supporting brand surfaces"
    },
    {
        name: "Horizon Blue",
        value: "#2F6F9F",
        purpose:
            "Active states, charts, highlights, focus states, and secondary actions"
    },
    {
        name: "Morning Sky",
        value: "#D9EAF3",
        purpose:
            "Soft informational backgrounds, highlights, and calm accent surfaces"
    },
    {
        name: "Cloud",
        value: "#F7F9FB",
        purpose:
            "Primary application and website background"
    },
    {
        name: "White",
        value: "#FFFFFF",
        purpose:
            "Cards, sheets, modals, and clean content surfaces"
    },
    {
        name: "Stone",
        value: "#667586",
        purpose:
            "Secondary text, captions, metadata, and understated supporting content"
    },
    {
        name: "Border",
        value: "#DBE3EA",
        purpose:
            "Dividers, form controls, card borders, and quiet structural separation"
    }
]

const semanticColors = [
    {
        name: "Success",
        value: "#4E795C",
        description:
            "Completed work, healthy states, enabled settings, and positive outcomes"
    },
    {
        name: "Warning",
        value: "#B7791F",
        description:
            "Items that need attention, incomplete setup, or time-sensitive risks"
    },
    {
        name: "Error",
        value: "#B54747",
        description:
            "Failures, destructive actions, blocked workflows, and critical issues"
    }
]

const uiPrinciples = [
    {
        title: "Reduce taps",
        description:
            "Common household actions should be available without unnecessary screens, menus, or detours.",
        icon: Smartphone
    },
    {
        title: "Remove decisions",
        description:
            "Use thoughtful defaults and clear hierarchy so families do not have to configure everything.",
        icon: Check
    },
    {
        title: "Default to simplicity",
        description:
            "Start with the clearest version of a workflow and add complexity only when it delivers real value.",
        icon: Leaf
    },
    {
        title: "Hide complexity",
        description:
            "Evergrove can be powerful behind the scenes without making the experience feel technical.",
        icon: ShieldCheck
    },
    {
        title: "Reward progress",
        description:
            "Show completion, momentum, and preparedness without turning family life into a competition.",
        icon: Sparkles
    },
    {
        title: "Design mobile first",
        description:
            "The primary experience should be excellent on a phone before desktop polish is considered finished.",
        icon: Smartphone
    },
    {
        title: "Stay calm by default",
        description:
            "Information should appear when it is useful, not all at once. The interface should never feel overwhelming.",
        icon: Heart
    },
    {
        title: "One household, one system",
        description:
            "Calendar, Tasks, Meals, Shopping, Inbox, Family, and Assistant should feel like connected parts of one operating system.",
        icon: Layers3
    }
]

const designLanguage = [
    {
        title: "Rounded",
        description:
            "Soft corners make the product feel approachable, modern, and family-friendly.",
        icon: Heart
    },
    {
        title: "Spacious",
        description:
            "Whitespace reduces cognitive load and helps important information stand out.",
        icon: Sparkles
    },
    {
        title: "Layered",
        description:
            "Cards, sheets, and sections create clear visual hierarchy without making the interface feel heavy.",
        icon: Layers3
    },
    {
        title: "Consistent",
        description:
            "The same actions, statuses, and controls should look and behave the same everywhere.",
        icon: Check
    },
    {
        title: "Intentional",
        description:
            "Every color, icon, animation, and interaction should communicate meaning rather than decorate.",
        icon: ShieldCheck
    },
    {
        title: "Responsive",
        description:
            "Evergrove should feel natural across phones, tablets, desktop browsers, and installed experiences.",
        icon: Smartphone
    }
]

const languagePairs = [
    ["Home", "Dashboard"],
    ["Family", "Household entity"],
    ["Save", "Submit"],
    ["Plan", "Record"],
    ["Settings", "Configuration"],
    ["Routine", "Workflow"],
    ["Use", "Utilize"],
    ["Invite", "Provision user"],
    ["You're all set", "Process complete"]
]

const photographyGuidelines = [
    "Real families and recognizable everyday moments",
    "Natural light and warm, lived-in spaces",
    "Dinner tables, kitchens, cars, backpacks, calendars, and backyards",
    "Candid interaction rather than staged smiles",
    "A range of family structures, ages, homes, and life stages"
]

const photographyAvoid = [
    "Corporate office imagery",
    "Perfectly staged homes that feel unreachable",
    "Overly polished stock photography",
    "Screens used as the emotional center of the image",
    "Images that make family life look effortless or unrealistic"
]

function copyToClipboard(value) {
    if (!navigator?.clipboard) return

    navigator.clipboard.writeText(value)
}

export default function Brand() {
    return (
        <AppPage>
            <PageHeader
                eyebrow="Company"
                title="Brand"
                description="The visual, verbal, and emotional system that makes Evergrove feel unmistakably like Evergrove."
            />

            <div className="brand-page">
                <section className="brand-hero">
                    <div className="brand-hero__content">
                        <div className="brand-hero__mark">
                            <Leaf size={24} />
                        </div>

                        <p className="brand-hero__eyebrow">
                            The Evergrove Brand
                        </p>

                        <h2>
                            The calm operating system for modern family life.
                        </h2>

                        <p>
                            Evergrove exists to give families confidence that
                            the important things will not be forgotten. Every
                            screen, email, notification, illustration, and
                            conversation should reinforce trust, calm, and
                            preparedness.
                        </p>
                    </div>
                </section>

                <SectionCard
                    title="Brand in One Sentence"
                    icon={Sparkles}
                    className="brand-feeling-card"
                >
                    <blockquote>
                        Evergrove is the calm operating system for modern family
                        life.
                    </blockquote>

                    <p className="brand-section-intro">
                        This statement should guide product decisions,
                        marketing, support, design, and communication. If
                        something feels noisy, complicated, technical, or
                        disconnected, it is not yet aligned with the Evergrove
                        brand.
                    </p>
                </SectionCard>

                <section className="brand-section">
                    <div className="brand-section-heading">
                        <span>Who we are</span>
                        <h2>Brand Personality</h2>
                        <p>
                            These traits should be recognizable in the product,
                            our marketing, and every interaction with a family.
                        </p>
                    </div>

                    <div className="brand-personality-grid">
                        {personalityTraits.map(trait => {
                            const Icon = trait.icon

                            return (
                                <article
                                    key={trait.title}
                                    className="brand-personality-card"
                                >
                                    <div className="brand-card-icon">
                                        <Icon size={21} />
                                    </div>

                                    <h3>{trait.title}</h3>
                                    <p>{trait.description}</p>
                                </article>
                            )
                        })}
                    </div>
                </section>

                <SectionCard
                    title="The Feeling"
                    icon={Heart}
                    className="brand-feeling-card"
                >
                    <p className="brand-section-intro">
                        Evergrove is successful when families leave an
                        interaction feeling:
                    </p>

                    <div className="brand-feeling-list">
                        {emotionalOutcomes.map(outcome => (
                            <span key={outcome}>{outcome}</span>
                        ))}
                    </div>

                    <blockquote>
                        Every interaction with Evergrove should leave a family
                        feeling a little more confident than they did before.
                    </blockquote>
                </SectionCard>

                <section className="brand-section">
                    <div className="brand-section-heading">
                        <span>What we stand for</span>
                        <h2>Brand Pillars</h2>
                        <p>
                            These principles explain the deeper value Evergrove
                            should deliver to every household.
                        </p>
                    </div>

                    <div className="brand-ui-grid">
                        {brandPillars.map(pillar => {
                            const Icon = pillar.icon

                            return (
                                <article
                                    key={pillar.title}
                                    className="brand-ui-card"
                                >
                                    <div className="brand-card-icon">
                                        <Icon size={21} />
                                    </div>

                                    <h3>{pillar.title}</h3>
                                    <p>{pillar.description}</p>
                                </article>
                            )
                        })}
                    </div>
                </section>

                <section className="brand-section">
                    <div className="brand-section-heading">
                        <span>How we speak</span>
                        <h2>Voice &amp; Tone</h2>
                        <p>
                            Evergrove communicates with clarity, warmth, and
                            respect. We speak like a capable guide, not a
                            machine.
                        </p>
                    </div>

                    <div className="brand-voice-grid">
                        <div className="brand-voice-column brand-voice-column--say">
                            <div className="brand-voice-column__header">
                                <Check size={18} />
                                <span>Say this</span>
                            </div>

                            {voiceExamples.map(example => (
                                <div
                                    key={example.say}
                                    className="brand-voice-example"
                                >
                                    <strong>{example.say}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="brand-voice-column brand-voice-column--avoid">
                            <div className="brand-voice-column__header">
                                <MessageCircle size={18} />
                                <span>Instead of this</span>
                            </div>

                            {voiceExamples.map(example => (
                                <div
                                    key={example.avoid}
                                    className="brand-voice-example"
                                >
                                    <span>{example.avoid}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="brand-section">
                    <div className="brand-section-heading">
                        <span>Visual identity</span>
                        <h2>Color Philosophy</h2>
                        <p>
                            Evergrove is a blue-first brand. Blue communicates
                            trust, calm, confidence, and reliability—the
                            qualities families should feel when depending on
                            Evergrove.
                        </p>
                    </div>

                    <SectionCard>
                        <p className="brand-section-intro">
                            Green is no longer used as a primary brand color.
                            It is reserved for successful outcomes, completed
                            work, healthy states, and positive progress. This
                            gives every color a clear and consistent meaning
                            across the app, public website, and Evergrove HQ.
                        </p>
                    </SectionCard>

                    <div className="brand-color-grid">
                        {colors.map(color => (
                            <article
                                key={color.name}
                                className="brand-color-card"
                            >
                                <div
                                    className="brand-color-swatch"
                                    style={{
                                        background: color.value
                                    }}
                                />

                                <div className="brand-color-card__content">
                                    <h3>{color.name}</h3>
                                    <p>{color.purpose}</p>

                                    <button
                                        type="button"
                                        className="brand-copy-value"
                                        onClick={() =>
                                            copyToClipboard(color.value)
                                        }
                                    >
                                        <span>{color.value}</span>
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="brand-section">
                    <div className="brand-section-heading">
                        <span>Meaning, not branding</span>
                        <h2>Semantic Colors</h2>
                        <p>
                            These colors communicate status and meaning. They
                            should not be used as primary navigation, branding,
                            or decorative accents.
                        </p>
                    </div>

                    <div className="brand-personality-grid">
                        {semanticColors.map(color => (
                            <article
                                key={color.name}
                                className="brand-personality-card"
                            >
                                <div
                                    className="brand-card-icon"
                                    style={{
                                        color: color.value,
                                        background: `${color.value}18`
                                    }}
                                >
                                    <Check size={21} />
                                </div>

                                <h3>{color.name}</h3>
                                <p>{color.description}</p>

                                <button
                                    type="button"
                                    className="brand-copy-value"
                                    onClick={() =>
                                        copyToClipboard(color.value)
                                    }
                                >
                                    <span>{color.value}</span>
                                    <Copy size={14} />
                                </button>
                            </article>
                        ))}
                    </div>
                </section>

                <SectionCard
                    title="Typography"
                    icon={Type}
                    className="brand-type-card"
                >
                    <p className="brand-section-intro">
                        Typography should feel modern, readable, warm, and
                        confident. Clear hierarchy matters more than decorative
                        styling.
                    </p>

                    <div className="brand-type-examples">
                        <div className="brand-type-example brand-type-example--display">
                            <span>Display</span>
                            <p>Where organized families grow.</p>
                        </div>

                        <div className="brand-type-example brand-type-example--heading">
                            <span>Heading</span>
                            <p>Your family is ready for the week.</p>
                        </div>

                        <div className="brand-type-example brand-type-example--body">
                            <span>Body</span>
                            <p>
                                Evergrove helps families keep schedules, meals,
                                tasks, shopping, and important moments in one
                                calm, connected place.
                            </p>
                        </div>

                        <div className="brand-type-example brand-type-example--caption">
                            <span>Caption</span>
                            <p>Updated a few moments ago</p>
                        </div>

                        <div className="brand-type-example brand-type-example--button">
                            <span>Button</span>
                            <button type="button">
                                Plan the week
                            </button>
                        </div>
                    </div>
                </SectionCard>

                <section className="brand-section">
                    <div className="brand-section-heading">
                        <span>Product design</span>
                        <h2>UI Philosophy</h2>
                        <p>
                            The interface should quietly support family life
                            instead of becoming another thing families must
                            manage.
                        </p>
                    </div>

                    <div className="brand-ui-grid">
                        {uiPrinciples.map(principle => {
                            const Icon = principle.icon

                            return (
                                <article
                                    key={principle.title}
                                    className="brand-ui-card"
                                >
                                    <div className="brand-card-icon">
                                        <Icon size={21} />
                                    </div>

                                    <h3>{principle.title}</h3>
                                    <p>{principle.description}</p>
                                </article>
                            )
                        })}
                    </div>
                </section>

                <section className="brand-section">
                    <div className="brand-section-heading">
                        <span>How the product feels</span>
                        <h2>Design Language</h2>
                        <p>
                            The same visual language should connect the app,
                            public website, emails, and Evergrove HQ.
                        </p>
                    </div>

                    <div className="brand-ui-grid">
                        {designLanguage.map(item => {
                            const Icon = item.icon

                            return (
                                <article
                                    key={item.title}
                                    className="brand-ui-card"
                                >
                                    <div className="brand-card-icon">
                                        <Icon size={21} />
                                    </div>

                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </article>
                            )
                        })}
                    </div>
                </section>

                <SectionCard
                    title="Language We Use"
                    icon={MessageCircle}
                    className="brand-language-card"
                >
                    <p className="brand-section-intro">
                        Choose familiar, direct language. Families should not
                        need to understand software terminology to use
                        Evergrove.
                    </p>

                    <div className="brand-language-table">
                        <div className="brand-language-table__header">
                            <span>Use</span>
                            <span>Avoid</span>
                        </div>

                        {languagePairs.map(([use, avoid]) => (
                            <div
                                key={`${use}-${avoid}`}
                                className="brand-language-row"
                            >
                                <strong>{use}</strong>
                                <span>{avoid}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                <section className="brand-section">
                    <div className="brand-section-heading">
                        <span>Photography</span>
                        <h2>Show Real Family Life</h2>
                        <p>
                            Our imagery should feel warm, honest, recognizable,
                            and grounded in the moments Evergrove helps support.
                        </p>
                    </div>

                    <div className="brand-photography-grid">
                        <article className="brand-photography-card">
                            <div className="brand-photography-card__icon">
                                <Image size={22} />
                            </div>

                            <h3>Use imagery that feels...</h3>

                            <div className="brand-guideline-list">
                                {photographyGuidelines.map(item => (
                                    <div key={item}>
                                        <Check size={15} />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </article>

                        <article className="brand-photography-card brand-photography-card--avoid">
                            <div className="brand-photography-card__icon">
                                <Image size={22} />
                            </div>

                            <h3>Avoid imagery that feels...</h3>

                            <div className="brand-guideline-list">
                                {photographyAvoid.map(item => (
                                    <div key={item}>
                                        <span className="brand-guideline-x">
                                            ×
                                        </span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </div>
                </section>

                <SectionCard
                    title="Why Evergrove?"
                    icon={Leaf}
                    className="brand-logo-card"
                >
                    <p className="brand-section-intro">
                        A grove is a place where individual trees grow stronger
                        together than they would alone. Families are much the
                        same.
                    </p>

                    <p className="brand-section-intro">
                        The name Evergrove reflects our belief that families are
                        always growing. Seasons change. Children grow up. New
                        traditions begin. Through every stage of life,
                        Evergrove helps the household stay organized,
                        connected, and prepared.
                    </p>
                </SectionCard>

                <SectionCard
                    title="Logo Direction"
                    icon={Palette}
                    className="brand-logo-card"
                >
                    <div className="brand-logo-showcase">
                        <div className="brand-logo-showcase__mark">
                            <Leaf size={30} />
                        </div>

                        <div>
                            <p className="brand-logo-showcase__name">
                                Evergrove
                            </p>

                            <p className="brand-logo-showcase__tagline">
                                Where organized families grow.
                            </p>
                        </div>
                    </div>

                    <div className="brand-logo-rules">
                        <div>
                            <Check size={16} />
                            <span>
                                Give the logo generous space and clear contrast.
                            </span>
                        </div>

                        <div>
                            <Check size={16} />
                            <span>
                                Use navy, blue, or white as the primary logo
                                treatments.
                            </span>
                        </div>

                        <div>
                            <Check size={16} />
                            <span>
                                Pair the name with the tagline only when it has
                                room to breathe.
                            </span>
                        </div>

                        <div>
                            <Check size={16} />
                            <span>
                                Use simplified marks for app icons and compact
                                spaces.
                            </span>
                        </div>

                        <div>
                            <Check size={16} />
                            <span>
                                Let the grove story appear through the symbol,
                                language, and imagery rather than relying on
                                green as the primary brand color.
                            </span>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard
                    title="Brand Promise"
                    icon={Sparkles}
                    className="brand-closing-card"
                >
                    <p>
                        Give families confidence that the important things will
                        not be forgotten.
                    </p>

                    <span>
                        When families feel prepared, they can spend less time
                        managing life and more time enjoying the moments that
                        matter most.
                    </span>
                </SectionCard>
            </div>
        </AppPage>
    )
}