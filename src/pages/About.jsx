import { useState } from "react"
import { supabase } from "../lib/supabase"

import {
    APP_VERSION,
    APP_STATUS,
    APP_NAME
} from "../config/appConfig"

import { restartGuidedWalkthrough } from "../services/preferenceService"

import AppPage from "../components/ui/AppPage"
import PageHeader from "../components/ui/PageHeader"
import SectionCard from "../components/ui/SectionCard"
import Button from "../components/ui/Button"
import InsightCard from "../components/dashboard/InsightCard"

export default function About() {
    const [savingFeedback, setSavingFeedback] = useState(false)
    const [feedbackSuccess, setFeedbackSuccess] = useState("")
    const [feedbackError, setFeedbackError] = useState("")
    const [feedbackType, setFeedbackType] = useState("feature")
    const [feedbackMessage, setFeedbackMessage] = useState("")

    async function handleSubmitFeedback(event) {
        event.preventDefault()

        if (!feedbackMessage.trim()) {
            setFeedbackError("Please enter feedback before submitting.")
            return
        }

        setSavingFeedback(true)
        setFeedbackSuccess("")
        setFeedbackError("")

        try {
            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser()

            if (userError) throw userError
            if (!user) throw new Error("You must be logged in to submit feedback.")

            const { error } = await supabase
                .from("feedback")
                .insert({
                    user_id: user.id,
                    type: feedbackType,
                    message: feedbackMessage.trim()
                })

            if (error) throw error

            setFeedbackMessage("")
            setFeedbackType("feature")
            setFeedbackSuccess("Thanks! Feedback submitted.")
        } catch (error) {
            console.error(error)
            setFeedbackError(error.message || "Could not submit feedback.")
        } finally {
            setSavingFeedback(false)
        }
    }

    async function handleRestartTour() {
        const confirmed = window.confirm(
            "Replay the Evergrove guided walkthrough? Your household and settings will not be changed."
        )

        if (!confirmed) return

        try {
            await restartGuidedWalkthrough()
            window.location.href = "/dashboard"
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not restart the walkthrough.")
        }
    }

    return (
        <AppPage>
            <PageHeader
                eyebrow="About"
                title={`About ${APP_NAME}`}
                subtitle="Evergrove is a family operating system designed to reduce household chaos."
            />

            <div className="eg-stack">
                <InsightCard
                    insight={{
                        title: `You're running ${APP_NAME} ${APP_VERSION}`,
                        description: "Thanks for helping shape Evergrove during beta.",
                        actionLabel: "Take Product Tour"
                    }}
                    onAction={handleRestartTour}
                />

                <SectionCard
                    title="Take the Product Tour"
                    subtitle="Walk through Evergrove's guided feature overview again."
                    action={
                        <Button size="sm" onClick={handleRestartTour}>
                            Start Tour
                        </Button>
                    }
                >
                    <p className="eg-muted">
                        The tour can be restarted anytime. Your household data will not be changed.
                    </p>
                </SectionCard>

                <SectionCard title="Current Release" subtitle="Version and release status.">
                    <div className="eg-info-grid">
                        <InfoItem label="Version" value={APP_VERSION} />
                        <InfoItem label="Status" value={APP_STATUS} />
                    </div>
                </SectionCard>

                <SectionCard title="What's New in this Beta">
                    <ul className="eg-about-list">
                        <li>Complete Evergrove 2.0 UI redesign</li>
                        <li>Mobile-first experience across major modules</li>
                        <li>Assistant insights throughout the app</li>
                        <li>Faster meal planning and shopping workflows</li>
                        <li>Improved calendar, trips, school, routines, and documents</li>
                        <li>Reusable design system components</li>
                        <li>Push notifications and household activity improvements</li>
                    </ul>
                </SectionCard>

                <SectionCard title="Help Shape Evergrove">
                    <p className="eg-muted">
                        Evergrove is in active beta. Your feedback directly influences what gets
                        improved next. If something feels confusing, broken, or missing, send it in.
                    </p>
                </SectionCard>

                <SectionCard title="Getting Started">
                    <ol className="eg-about-list">
                        <li>Create your household.</li>
                        <li>Add family members and pets.</li>
                        <li>Invite another parent or guardian.</li>
                        <li>Add birthdays and important family information.</li>
                        <li>Create To-Dos, routines, school items, trips, meals, and shopping lists.</li>
                    </ol>
                </SectionCard>

                <SectionCard title="Core Features">
                    <div className="eg-feature-grid">
                        <Feature title="Dashboard" text="A daily command center for your household." />
                        <Feature title="Calendar" text="Shared events, birthdays, trips, and school dates." />
                        <Feature title="To-Dos" text="Household and private tasks with ownership." />
                        <Feature title="Meals & Shopping" text="Plan dinners and build grocery lists." />
                        <Feature title="Trips" text="Plan travel, ideas, and checklists." />
                        <Feature title="School" text="Track forms, events, supplies, and reminders." />
                        <Feature title="Documents" text="Store important household files." />
                        <Feature title="Settings" text="Manage household and personal preferences." />
                    </div>
                </SectionCard>

                <SectionCard title="Privacy & Visibility">
                    <ul className="eg-about-list">
                        <li>Household items are visible to household members.</li>
                        <li>Private To-Dos remain visible only to the creator.</li>
                        <li>Children and pets can be tracked without individual accounts.</li>
                    </ul>
                </SectionCard>

                <SectionCard title="Roadmap">
                    <ul className="eg-about-list">
                        <li>Evergrove Intelligence Engine</li>
                        <li>Smarter Assistant next-best-action recommendations</li>
                        <li>Document enhancements</li>
                        <li>Family avatars and profile images</li>
                        <li>Expanded beta user feedback cycle</li>
                    </ul>
                </SectionCard>

                <SectionCard title="Why Evergrove Exists">
                    <p className="eg-muted">
                        Evergrove exists to reduce household chaos. It gives families one shared
                        place to manage the people, plans, and responsibilities that matter most.
                    </p>

                    <p className="eg-muted">
                        The goal is simple: spend less time organizing life and more time living it.
                    </p>
                </SectionCard>

                <SectionCard title="Send Feedback" subtitle="Found a bug or have an idea?">
                    <form className="form-grid" onSubmit={handleSubmitFeedback}>
                        <label>
                            Type
                            <select
                                value={feedbackType}
                                onChange={event => setFeedbackType(event.target.value)}
                            >
                                <option value="bug">Bug</option>
                                <option value="feature">Feature Request</option>
                                <option value="general">General Feedback</option>
                            </select>
                        </label>

                        <label className="full-width">
                            Feedback
                            <textarea
                                rows="4"
                                value={feedbackMessage}
                                onChange={event => setFeedbackMessage(event.target.value)}
                            />
                        </label>

                        <Button type="submit" disabled={savingFeedback}>
                            {savingFeedback ? "Submitting..." : "Submit Feedback"}
                        </Button>

                        {feedbackSuccess && (
                            <p className="success-message full-width">{feedbackSuccess}</p>
                        )}

                        {feedbackError && (
                            <p className="error-message full-width">{feedbackError}</p>
                        )}
                    </form>
                </SectionCard>

                <p className="eg-about-footer">
                    Built with care for busy families.
                </p>
            </div>
        </AppPage>
    )
}

function InfoItem({ label, value }) {
    return (
        <div className="eg-info-item">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    )
}

function Feature({ title, text }) {
    return (
        <div className="eg-feature-card">
            <strong>{title}</strong>
            <p>{text}</p>
        </div>
    )
}