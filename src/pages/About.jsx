import { useState } from "react"
import { submitProductFeedback } from "../services/productFeedbackService"

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
            await submitProductFeedback({
                feedbackType:
                    feedbackType === "feature"
                        ? "idea"
                        : feedbackType === "general"
                            ? "feedback"
                            : feedbackType,
                category: "about",
                subject: null,
                message: feedbackMessage.trim(),
                appVersion: APP_VERSION,
                pagePath: window.location.pathname,
                source: "about"
            })

            setFeedbackMessage("")
            setFeedbackType("feature")
            setFeedbackSuccess("Thanks! Feedback submitted. Have another idea? We'd love to hear it while it's fresh.")
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
                eyebrow="About & Feedback"
                title={`About ${APP_NAME}`}
                subtitle="Evergrove helps families remember, coordinate, and accomplish the thousands of little things that make everyday life work."
            />

            <div className="eg-stack">
                <SectionCard title="Our Vision">
                    <p className="eg-muted">
                        To give families confidence that the important things
                        will not be forgotten, so they can spend less time managing life and
                        more time living it.
                    </p>
                </SectionCard>

                <SectionCard title='Why "Evergrove"?'>
                    <p className="eg-muted">
                        A grove is a place where trees grow stronger together than they do alone.
                        Families are much the same. Life is made up of thousands of shared
                        responsibilities, milestones, traditions, and everyday moments that are
                        easier when everyone is connected.
                    </p>

                    <p className="eg-muted">
                        The name <strong>Evergrove</strong> reflects our belief that
                        families are always growing. Seasons change. Children grow up. New
                        traditions begin. Through every stage of life, Evergrove is designed to
                        help your household stay organized, connected, and ready for whatever
                        comes next.
                    </p>
                </SectionCard>

                <SectionCard title="What Makes Evergrove Different">
                    <p className="eg-muted">
                        Most tools help families track one thing. Evergrove is designed to
                        understand the whole household. When plans, responsibilities, meals,
                        reminders, and communication live together, Evergrove can help your
                        family see what matters next.
                    </p>
                </SectionCard>

                <SectionCard title="Recent Improvements">
                    <ul className="eg-about-list">
                        <li>Redesigned mobile-first experience across the app</li>
                        <li>Guided onboarding and interactive product tour</li>
                        <li>Personal Inbox and Thought Capture for ideas, reminders, and nudges</li>
                        <li>Smarter Evergrove Assistant insights and household recommendations</li>
                        <li>Recurring events, routines, and a more powerful family calendar</li>
                        <li>Improved meal planning, shopping lists, and grocery workflows</li>
                        <li>Household activity feed, announcements, notifications, and collaboration improvements</li>
                        <li>Ongoing beta fixes, performance improvements, and polish</li>
                    </ul>
                </SectionCard>

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

                <SectionCard title="Help Shape Evergrove">
                    <p className="eg-muted">
                        Evergrove is in active beta. You are part of a small group of families
                        helping shape what this becomes. If something feels confusing, broken,
                        missing, or surprisingly useful, we want to hear about it.
                    </p>

                    <p className="eg-muted">
                        Every piece of feedback is reviewed and helps determine what gets
                        improved next.
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

                <SectionCard title="Current Release" subtitle="Version and release status.">
                    <div className="eg-info-grid">
                        <InfoItem label="Version" value={APP_VERSION} />
                        <InfoItem label="Status" value={APP_STATUS} />
                    </div>
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