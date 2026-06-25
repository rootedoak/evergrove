import { useState } from "react"
import { supabase } from "../lib/supabase"

import {
    APP_VERSION,
    APP_STATUS,
    APP_NAME
} from "../config/appConfig"

import { useNavigate } from "react-router-dom"
import { restartOnboarding } from "../services/preferenceService"

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

    const navigate = useNavigate()

    async function handleRestartTour() {
        const confirmed = window.confirm(
            "Restart the Evergrove guided tour? Your household data will not be changed."
        )

        if (!confirmed) return

        await restartOnboarding()

        window.location.href = "/dashboard"
    }

    return (
        <div className="page-content about-page">
            <div className="page-header">
                <p className="page-eyebrow">
                    Evergrove
                </p>

                <h1>About {APP_NAME}</h1>

                <p className="page-description">
                    Evergrove is a shared household operating system designed
                    to help families stay organized, coordinated, and informed.
                    It brings together calendars, tasks, meal planning,
                    shopping lists, family information, activities, travel,
                    and household management into a single place.
                </p>
            </div>

            <section className="about-card">
                <div>
                    <h2>🎓 Take the Product Tour</h2>
                    <p>
                        Walk through Evergrove's guided setup and feature overview again.
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-button"
                    onClick={handleRestartTour}
                >
                    Take Product Tour
                </button>
            </section>

            <div className="card">
                <h2>Current Release</h2>

                <div className="info-grid">
                    <div>
                        <strong>Version</strong>
                        <span className="status-badge beta">
                            <p>{APP_VERSION}</p>
                        </span>
                        <strong>Status</strong>
                        <p>{APP_STATUS}</p>
                    </div>

                    <div className="card">
                        <h2>What's New</h2>

                        <ul>
                            <li>Evergrove branding and beta release updates</li>
                            <li>Dashboard Quick Actions</li>
                            <li>Direct Event creation from Dashboard</li>
                            <li>Direct To-Do creation from Dashboard</li>
                            <li>Direct Meal Planning from Dashboard</li>
                            <li>Direct Shopping workflows from Dashboard</li>
                            <li>Private and Household visibility controls</li>
                            <li>Trips integrated into Family Timeline</li>
                            <li>Family Calendar management improvements</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2>Beta Notice</h2>

                <p>
                    Evergrove is currently in active development. Features,
                    workflows, and user interfaces may change as the platform
                    evolves. While core household planning functionality is
                    stable, occasional bugs and missing features should be
                    expected during the beta phase.
                </p>
            </div>

            <div className="card">
                <h2>Getting Started</h2>

                <ol>
                    <li>Create your household.</li>
                    <li>Add family members.</li>
                    <li>Invite another parent or guardian.</li>
                    <li>Set birthdays and important family information.</li>
                    <li>Add activities, trips, and calendar events.</li>
                    <li>Create household and personal To-Do's.</li>
                    <li>Build meal plans and shopping lists.</li>
                </ol>
            </div>

            <div className="card">
                <h2>Core Features</h2>

                <ul>
                    <li>
                        <strong>Dashboard</strong> — Family overview,
                        upcoming events, birthdays, tasks, and reminders.
                    </li>

                    <li>
                        <strong>Calendar</strong> — Shared household calendar
                        with support for events, activities, travel, and
                        personal schedules.
                    </li>

                    <li>
                        <strong>To-Do's</strong> — Household To-Do's and private
                        personal To-Do's with visibility controls.
                    </li>

                    <li>
                        <strong>Family</strong> — Family members, pets,
                        birthdays, and household information.
                    </li>

                    <li>
                        <strong>Activities</strong> — Sports, lessons,
                        practices, registrations, and recurring activities.
                    </li>

                    <li>
                        <strong>Travel</strong> — Trips, vacations, and travel
                        planning integrated into the family calendar.
                    </li>

                    <li>
                        <strong>Meals & Shopping</strong> — Weekly meal
                        planning and shared shopping lists.
                    </li>

                    <li>
                        <strong>Household Settings</strong> — Shared
                        household preferences and configuration.
                    </li>
                </ul>
            </div>

            <div className="card">
                <h2>Privacy & Visibility</h2>

                <p>
                    Evergrove supports both shared household information and
                    private personal information.
                </p>

                <ul>
                    <li>
                        Household items are visible to all household members.
                    </li>

                    <li>
                        Private tasks and personal information remain visible
                        only to the user who created them.
                    </li>

                    <li>
                        Household members such as children and pets can be
                        tracked without requiring individual accounts.
                    </li>
                </ul>
            </div>

            <div className="card">
                <h2>Roadmap</h2>

                <ul>
                    <li>Household invitations and onboarding</li>
                    <li>Activity templates</li>
                    <li>Feedback tracking</li>
                    <li>Family avatars and profile images</li>
                    <li>Improved mobile experience</li>
                    <li>Document enhancements</li>
                    <li>Budget and finance planning</li>
                    <li>Native mobile applications</li>
                </ul>
            </div>

            <div className="card">
                <h2>Vision</h2>

                <p>
                    Evergrove exists to reduce household chaos. The goal is to
                    provide families with a single place to manage schedules,
                    responsibilities, activities, meals, travel, and family
                    information without juggling multiple apps and spreadsheets.
                </p>

                <p>
                    Think of Evergrove as a family operating system: one shared
                    source of truth for the people, plans, and commitments that
                    matter most.
                </p>
            </div>

            <div className="card">
                <h2>Send Feedback</h2>

                <p>
                    Found a bug or have an idea for Evergrove?
                </p>

                <form className="form-grid" onSubmit={handleSubmitFeedback}>
                    <label>
                        Type
                        <select
                            value={feedbackType}
                            onChange={event =>
                                setFeedbackType(event.target.value)
                            }
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
                            onChange={event =>
                                setFeedbackMessage(event.target.value)
                            }
                        />
                    </label>

                    <button
                        className="primary-button"
                        type="submit"
                        disabled={savingFeedback}
                    >
                        {savingFeedback ? "Submitting..." : "Submit Feedback"}
                    </button>

                    {feedbackSuccess && (
                        <p className="success-message full-width">
                            {feedbackSuccess}
                        </p>
                    )}

                    {feedbackError && (
                        <p className="error-message full-width">
                            {feedbackError}
                        </p>
                    )}
                </form>
            </div>
        </div >
    )
}