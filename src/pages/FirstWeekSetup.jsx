import { useState } from "react"

import Button from "../components/ui/Button"

import { createCalendarEvent } from "../services/calendarEventService"
import { createTask } from "../services/taskService"
import { createMeal, createMealPlan } from "../services/mealService"

function todayString() {
    return new Date().toISOString().slice(0, 10)
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const steps = [
    {
        key: "event",
        icon: "📅",
        title: "What’s something your family is looking forward to this week?",
        description: "Let’s put one real thing on your family calendar.",
        label: "What’s happening?",
        placeholder: "Soccer practice, birthday party, family dinner...",
        success: "Added to your family calendar"
    },
    {
        key: "task",
        icon: "✅",
        title: "What’s one thing your family shouldn’t forget?",
        description: "Big or small, this starts your shared household To-Do list.",
        label: "What should Evergrove remember?",
        placeholder: "Buy dog food, pay daycare, change air filter...",
        success: "Added to your household To-Dos"
    },
    {
        key: "dinner",
        icon: "🍽️",
        title: "What’s for dinner tonight?",
        description: "Even if it’s pizza, your dashboard will feel useful right away.",
        label: "Tonight we’re having...",
        placeholder: "Pizza, tacos, spaghetti...",
        success: "Dinner is planned for tonight"
    }
]

export default function FirstWeekSetup() {
    const [stepIndex, setStepIndex] = useState(0)
    const [values, setValues] = useState({
        event: "",
        eventDate: todayString(),
        task: "",
        taskDueDate: todayString(),
        dinner: ""
    })
    const [completed, setCompleted] = useState({
        event: false,
        task: false,
        dinner: false
    })
    const [saving, setSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [finished, setFinished] = useState(false)
    const [error, setError] = useState("")

    const currentStep = steps[stepIndex]
    const isLastStep = stepIndex === steps.length - 1
    const value = values[currentStep.key]?.trim()
    const progressPercent = ((stepIndex + 1) / steps.length) * 100

    async function saveCurrentStep() {
        if (!value) return false

        if (currentStep.key === "event") {
            await createCalendarEvent({
                title: value,
                event_type: "family",
                start_date: values.eventDate,
                end_date: values.eventDate,
                start_time: null,
                end_time: null,
                location: "",
                notes: "Added during First Week setup."
            })

            setCompleted(current => ({ ...current, event: true }))
        }

        if (currentStep.key === "task") {
            await createTask({
                title: value,
                description: "Added during First Week setup.",
                due_date: values.taskDueDate || null,
                status: "open",
                visibility: "household"
            })

            setCompleted(current => ({ ...current, task: true }))
        }

        if (currentStep.key === "dinner") {
            const meal = await createMeal({
                name: value,
                description: "Added during First Week setup.",
                category: "Dinner",
                ingredients: []
            })

            await createMealPlan({
                meal,
                plannedDate: todayString(),
                notes: "Added during First Week setup.",
                planType: "home"
            })

            setCompleted(current => ({ ...current, dinner: true }))
        }

        return true
    }

    async function handleContinue() {
        setSaving(true)
        setError("")

        try {
            const savedSomething = await saveCurrentStep()

            if (savedSomething) {
                setShowSuccess(true)
                await wait(700)
                setShowSuccess(false)
            }

            goNext()
        } catch (err) {
            console.error(err)
            setError("Could not save this item. You can try again or choose Not right now.")
        } finally {
            setSaving(false)
        }
    }

    function goNext() {
        if (isLastStep) {
            setFinished(true)
            return
        }

        setStepIndex(current => current + 1)
    }

    function handleSkip() {
        goNext()
    }

    function openDashboard() {
        sessionStorage.removeItem("evergrove_skip_walkthrough_once")
        window.location.href = "/"
    }

    if (finished) {
        return (
            <div className="onboarding-page">
                <div className="eg-card onboarding-card first-week-card first-week-finished-card">
                    <div className="eg-stack">
                        <div className="onboarding-hero-icon">🎉</div>

                        <p className="onboarding-eyebrow">
                            Your First Week
                        </p>

                        <div>
                            <h1>Your first week is underway.</h1>
                            <p>
                                Look what you’ve already built. Your dashboard is ready,
                                and Evergrove already has a few real pieces of your family’s life inside it.
                            </p>
                        </div>

                        <div className="onboarding-feature-list onboarding-ready-list">
                            <div>{completed.event ? "✅" : "○"} Calendar started</div>
                            <div>{completed.task ? "✅" : "○"} First To-Do added</div>
                            <div>{completed.dinner ? "✅" : "○"} Dinner planned</div>
                        </div>

                        <Button onClick={openDashboard}>
                            Show Me Around
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="onboarding-page">
            <div className="eg-card onboarding-card first-week-card">
                <div className="eg-stack">
                    <div>
                        <p className="onboarding-eyebrow">
                            Your First Week
                        </p>

                        <div className="first-week-progress">
                            <div className="first-week-progress-track">
                                <div
                                    className="first-week-progress-fill"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>

                            <span>
                                {stepIndex + 1} of {steps.length}
                            </span>
                        </div>
                    </div>

                    {showSuccess ? (
                        <div className="first-week-success">
                            <div className="onboarding-hero-icon">✅</div>
                            <h1>{currentStep.success}</h1>
                            <p>Your home is starting to come alive.</p>
                        </div>
                    ) : (
                        <>
                            <div className="onboarding-hero-icon">
                                {currentStep.icon}
                            </div>

                            <div>
                                <h1>{currentStep.title}</h1>
                                <p>{currentStep.description}</p>
                            </div>

                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}

                            <label>
                                {currentStep.label}

                                <input
                                    value={values[currentStep.key]}
                                    onChange={(event) =>
                                        setValues({
                                            ...values,
                                            [currentStep.key]: event.target.value
                                        })
                                    }
                                    placeholder={currentStep.placeholder}
                                    autoFocus
                                />
                            </label>

                            {currentStep.key === "event" && (
                                <label>
                                    When is it?
                                    <input
                                        type="date"
                                        value={values.eventDate}
                                        onChange={(event) =>
                                            setValues({
                                                ...values,
                                                eventDate: event.target.value
                                            })
                                        }
                                    />
                                </label>
                            )}

                            {currentStep.key === "task" && (
                                <label>
                                    When should your family remember it?
                                    <input
                                        type="date"
                                        value={values.taskDueDate}
                                        onChange={(event) =>
                                            setValues({
                                                ...values,
                                                taskDueDate: event.target.value
                                            })
                                        }
                                    />
                                </label>
                            )}

                            <div className="onboarding-feature-list onboarding-ready-list">
                                <div>{completed.event ? "✅" : "○"} Calendar started</div>
                                <div>{completed.task ? "✅" : "○"} First To-Do added</div>
                                <div>{completed.dinner ? "✅" : "○"} Dinner planned</div>
                            </div>

                            <div className="onboarding-action-row">
                                <Button
                                    onClick={handleContinue}
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Adding..."
                                        : isLastStep
                                            ? "Finish"
                                            : "Continue"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleSkip}
                                    disabled={saving}
                                >
                                    Not right now
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}