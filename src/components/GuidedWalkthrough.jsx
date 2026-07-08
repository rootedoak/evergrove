import { useState } from "react"
import { completeGuidedWalkthrough } from "../services/preferenceService"
import Button from "./ui/Button"

const steps = [
    {
        icon: "🏡",
        eyebrow: "Welcome Home",
        title: "This is your family’s command center.",
        body: "Every morning, start here. Evergrove brings together what’s happening today, what needs attention, dinner plans, reminders, and the things your family should know."
    },
    {
        icon: "💭",
        eyebrow: "Capture It",
        title: "Life moves fast. Don’t try to organize everything immediately.",
        body: "When you remember something, capture it in your Personal Inbox. It gives you a safe place to put thoughts, reminders, and loose ends before they become plans."
    },
    {
        icon: "✅",
        eyebrow: "Turn Thoughts Into Plans",
        title: "When something needs action, turn it into a To-Do.",
        body: "Evergrove helps you move from “we should remember that” to “it’s handled.” Use To-Dos for household tasks, school follow-ups, errands, chores, and anything your family needs to get done."
    },
    {
        icon: "📅",
        eyebrow: "Keep Everyone In Sync",
        title: "Your calendar is where family life comes together.",
        body: "Events, school dates, birthdays, trips, appointments, and family plans all have a place here, so everyone can see what’s coming next."
    },
    {
        icon: "🍽️",
        eyebrow: "Dinner Has A Place",
        title: "Meals help answer one of the daily questions every family asks.",
        body: "Evergrove keeps dinner planning close to the rest of your household rhythm, so everyone can see what’s for dinner and what needs to be picked up."
    },
    {
        icon: "👨‍👩‍👧",
        eyebrow: "Bring Everyone Together",
        title: "Evergrove works best when your family is here with you.",
        body: "Invite your spouse or another adult whenever you’re ready. The goal is simple: one shared place where your household can stay organized together."
    },
    {
        icon: "🎉",
        eyebrow: "You’re Ready",
        title: "Your home is ready.",
        body: "You’ve already started your calendar, added a To-Do, and planned dinner. From here, just keep living life. Evergrove will help keep everyone on the same page."
    }
]

export default function GuidedWalkthrough({ onComplete }) {
    const [stepIndex, setStepIndex] = useState(0)
    const [saving, setSaving] = useState(false)

    const step = steps[stepIndex]
    const isFirstStep = stepIndex === 0
    const isLastStep = stepIndex === steps.length - 1

    async function finishWalkthrough() {
        setSaving(true)

        try {
            await completeGuidedWalkthrough()
            onComplete?.()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not finish walkthrough.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="walkthrough-backdrop">
            <section className="eg-card walkthrough-card" role="dialog" aria-modal="true">
                <div className="walkthrough-progress">
                    <span>{step.eyebrow}</span>
                    <strong>{stepIndex + 1} of {steps.length}</strong>
                </div>

                <div className="walkthrough-dots">
                    {steps.map((item, index) => (
                        <span
                            key={item.title}
                            className={index <= stepIndex ? "active" : ""}
                        />
                    ))}
                </div>

                <div className="eg-stack">
                    <div className="walkthrough-icon">
                        {step.icon}
                    </div>

                    <div>
                        <p className="eg-section-title">{step.eyebrow}</p>
                        <h2>{step.title}</h2>
                        <p>{step.body}</p>
                    </div>

                    <div className="walkthrough-actions">
                        {!isFirstStep && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setStepIndex(current => current - 1)}
                                disabled={saving}
                            >
                                Back
                            </Button>
                        )}

                        <Button
                            type="button"
                            onClick={
                                isLastStep
                                    ? finishWalkthrough
                                    : () => setStepIndex(current => current + 1)
                            }
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : isLastStep
                                    ? "Let’s Go"
                                    : "Next"}
                        </Button>
                    </div>

                    <button
                        type="button"
                        className="walkthrough-skip"
                        onClick={finishWalkthrough}
                        disabled={saving}
                    >
                        I’ll explore on my own
                    </button>
                </div>
            </section>
        </div>
    )
}