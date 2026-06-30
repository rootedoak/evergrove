import { useState } from "react"
import { completeGuidedWalkthrough } from "../services/preferenceService"
import Button from "./ui/Button"

const steps = [
    {
        eyebrow: "Command Center",
        title: "Welcome to your family’s home base.",
        body: "Dashboard brings together the things that need your household’s attention today."
    },
    {
        eyebrow: "Inbox",
        title: "Start with your Personal Inbox.",
        body: "Inbox highlights updates, assignments, reminders, and shared household activity meant for you."
    },
    {
        eyebrow: "To-Dos",
        title: "Track what needs to get done.",
        body: "Use To-Dos for chores, reminders, school follow-ups, trip prep, and everyday tasks."
    },
    {
        eyebrow: "Calendar",
        title: "Keep everyone aligned.",
        body: "Calendar brings together events, school dates, birthdays, trips, and important family plans."
    },
    {
        eyebrow: "Meals & Shopping",
        title: "Plan dinner and shop with less friction.",
        body: "Meals and Shopping work together so your grocery list can follow your weekly meal plan."
    },
    {
        eyebrow: "Household",
        title: "Bring your household into Evergrove.",
        body: "Add family members, invite another adult, and let Evergrove become your shared source of truth."
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
                            {saving ? "Saving..." : isLastStep ? "Finish" : "Next"}
                        </Button>
                    </div>

                    <button
                        type="button"
                        className="walkthrough-skip"
                        onClick={finishWalkthrough}
                        disabled={saving}
                    >
                        Skip walkthrough
                    </button>
                </div>
            </section>
        </div>
    )
}