import { useState } from "react"
import { completeGuidedWalkthrough } from "../services/preferenceService"

const steps = [
    {
        title: "Welcome to your Command Center",
        body: "This is your family’s home base for staying organized."
    },
    {
        title: "Start with your Inbox",
        body: "Your Personal Inbox highlights things that may need your attention."
    },
    {
        title: "Add your first To-Do",
        body: "Use To-Do for tasks, reminders, chores, and family follow-ups."
    },
    {
        title: "Plan your Calendar",
        body: "Add events, activities, school items, trips, and important dates."
    },
    {
        title: "Meals and Shopping work together",
        body: "Plan meals, build shopping lists, and keep grocery planning simple."
    },
    {
        title: "Invite your household",
        body: "Bring another adult into Evergrove so everyone shares the same view."
    }
]

export default function GuidedWalkthrough({ onComplete }) {
    const [stepIndex, setStepIndex] = useState(0)
    const [saving, setSaving] = useState(false)

    const step = steps[stepIndex]
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
            <div className="walkthrough-card">
                <div className="walkthrough-step-count">
                    Step {stepIndex + 1} of {steps.length}
                </div>

                <h2>{step.title}</h2>

                <p>{step.body}</p>

                <div className="walkthrough-actions">
                    {stepIndex > 0 && (
                        <button
                            type="button"
                            className="walkthrough-secondary"
                            onClick={() => setStepIndex(current => current - 1)}
                            disabled={saving}
                        >
                            Back
                        </button>
                    )}

                    <button
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
                                ? "Finish"
                                : "Next"}
                    </button>
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
        </div>
    )
}