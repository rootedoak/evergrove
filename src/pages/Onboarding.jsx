import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import logo from "../assets/evergrove-logo.svg"

import { supabase } from "../lib/supabase"
import { createHousehold } from "../services/householdService"
import { createFamilyMember } from "../services/familyService"
import {
    updatePreferences,
    completeOnboarding
} from "../services/preferenceService"

const dashboardWindowOptions = [
    { value: 1, label: "Today" },
    { value: 3, label: "3 Days" },
    { value: 7, label: "7 Days" },
    { value: 14, label: "14 Days" }
]

function detectTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago"
    } catch {
        return "America/Chicago"
    }
}

export default function Onboarding() {
    const navigate = useNavigate()

    const totalSteps = 6
    const detectedTimezone = useMemo(() => detectTimezone(), [])

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    const [householdCreated, setHouseholdCreated] = useState(false)

    const [displayName, setDisplayName] = useState("")
    const [householdName, setHouseholdName] = useState("")
    const [timezone, setTimezone] = useState(detectedTimezone)
    const [weekStartsOn, setWeekStartsOn] = useState("sunday")

    const [familyMembers, setFamilyMembers] = useState([])
    const [memberName, setMemberName] = useState("")
    const [memberType, setMemberType] = useState("child")

    const [dashboardWindowDays, setDashboardWindowDays] = useState(7)
    const [birthdayReminders, setBirthdayReminders] = useState(true)
    const [tripReminders, setTripReminders] = useState(true)
    const [schoolReminders, setSchoolReminders] = useState(true)
    const [showSuggestedTasks, setShowSuggestedTasks] = useState(true)

    async function handleNameStep() {
        if (!displayName.trim()) return

        setLoading(true)

        try {
            await supabase.auth.updateUser({
                data: {
                    full_name: displayName.trim()
                }
            })

            setStep(3)
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not save your name.")
        } finally {
            setLoading(false)
        }
    }

    async function handleHouseholdStep() {
        if (!householdName.trim()) return

        setLoading(true)

        try {
            if (!householdCreated) {
                await createHousehold(householdName.trim())
                setHouseholdCreated(true)
            }

            await updatePreferences({
                household_name: householdName.trim(),
                timezone,
                week_starts_on: weekStartsOn
            })

            setStep(4)
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not save household settings.")
        } finally {
            setLoading(false)
        }
    }

    function addFamilyMember() {
        if (!memberName.trim()) return

        setFamilyMembers(current => [
            ...current,
            {
                name: memberName.trim(),
                member_type: memberType,
                role: memberType
            }
        ])

        setMemberName("")
        setMemberType("child")
    }

    function removeFamilyMember(indexToRemove) {
        setFamilyMembers(current =>
            current.filter((_, index) => index !== indexToRemove)
        )
    }

    async function finishOnboarding() {
        setLoading(true)

        try {
            await updatePreferences({
                household_name: householdName.trim(),
                timezone,
                week_starts_on: weekStartsOn,
                dashboard_window_days: dashboardWindowDays,
                birthday_reminders: birthdayReminders,
                trip_reminders: tripReminders,
                school_reminders: schoolReminders,
                show_suggested_tasks: showSuggestedTasks
            })

            await createFamilyMember({
                name: displayName.trim(),
                member_type: "adult",
                role: "parent",
                link_to_current_user: true
            })

            for (const member of familyMembers) {
                await createFamilyMember(member)
            }

            await completeOnboarding()

            window.location.href = "/"
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not finish onboarding.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="onboarding-page">
            <div className="onboarding-brand">
                <img src={logo} alt="Evergrove" />
                <span>Step {step} of {totalSteps}</span>
            </div>

            <div className="onboarding-progress">
                <div
                    className="onboarding-progress-bar"
                    style={{
                        width: `${(step / totalSteps) * 100}%`
                    }}
                />
            </div>

            {step === 1 && (
                <section className="onboarding-welcome-card">
                    <h1>Welcome to Evergrove</h1>

                    <p>
                        Build your family’s command center in just a couple of minutes.
                    </p>

                    <div className="onboarding-feature-list onboarding-welcome-list">
                        <div>✅ Keep everyone aligned</div>
                        <div>✅ Plan meals, tasks, trips, and school</div>
                        <div>✅ Share one organized household view</div>
                    </div>

                    <button onClick={() => setStep(2)}>
                        Get Started
                    </button>
                </section>
            )}

            {step === 2 && (
                <section>
                    <h1>What should your family call you?</h1>

                    <p>
                        This name will appear on tasks, events, announcements, and household activity.
                    </p>

                    <label>
                        Your Name
                        <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="First name"
                            autoFocus
                        />
                    </label>

                    <button
                        onClick={handleNameStep}
                        disabled={loading || !displayName.trim()}
                    >
                        {loading ? "Saving..." : "Continue"}
                    </button>
                </section>
            )}

            {step === 3 && (
                <section>
                    <h1>Set Up Your Household</h1>

                    <label>
                        Household Name
                        <input
                            value={householdName}
                            onChange={(e) => setHouseholdName(e.target.value)}
                            placeholder="McGee Family"
                        />
                    </label>

                    <label>
                        Time Zone
                        <input
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            placeholder="America/Chicago"
                        />
                    </label>

                    <p className="onboarding-helper-text">
                        Detected automatically. You can change this later in Settings.
                    </p>

                    <div>
                        <h2>Week Starts On</h2>

                        <div className="onboarding-choice-grid">
                            {[
                                { key: "sunday", label: "Sunday", icon: "☀️" },
                                { key: "monday", label: "Monday", icon: "📅" }
                            ].map(option => (
                                <button
                                    key={option.key}
                                    type="button"
                                    className={
                                        weekStartsOn === option.key
                                            ? "onboarding-choice selected"
                                            : "onboarding-choice"
                                    }
                                    onClick={() => setWeekStartsOn(option.key)}
                                >
                                    <span>{option.icon}</span>
                                    <strong>{option.label}</strong>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleHouseholdStep}
                        disabled={loading || !householdName.trim()}
                    >
                        {loading ? "Saving..." : "Continue"}
                    </button>
                </section>
            )}

            {step === 4 && (
                <section>
                    <h1>Add Your Family</h1>

                    <p>
                        Add the people and pets you want to organize in Evergrove.
                    </p>

                    <input
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        placeholder="Name"
                    />

                    <div className="onboarding-choice-grid">
                        {[
                            { key: "parent", label: "Adult", icon: "👤" },
                            { key: "child", label: "Child", icon: "🧒" },
                            { key: "pet", label: "Pet", icon: "🐾" }
                        ].map(option => (
                            <button
                                key={option.key}
                                type="button"
                                className={
                                    memberType === option.key
                                        ? "onboarding-choice selected"
                                        : "onboarding-choice"
                                }
                                onClick={() => setMemberType(option.key)}
                            >
                                <span>{option.icon}</span>
                                <strong>{option.label}</strong>
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addFamilyMember}
                        disabled={!memberName.trim()}
                    >
                        Add Family Member
                    </button>

                    <div className="onboarding-member-list">
                        {familyMembers.map((member, index) => (
                            <div
                                key={`${member.name}-${index}`}
                                className="onboarding-member-row"
                            >
                                <div>
                                    <strong>{member.name}</strong>
                                    <span>{member.role}</span>
                                </div>

                                <button
                                    type="button"
                                    className="onboarding-remove-button"
                                    onClick={() => removeFamilyMember(index)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setStep(5)}>
                        Continue
                    </button>

                    <button
                        type="button"
                        className="onboarding-skip-button"
                        onClick={() => setStep(5)}
                    >
                        Skip for now
                    </button>
                </section>
            )}

            {step === 5 && (
                <section>
                    <h1>Choose Your Defaults</h1>

                    <div>
                        <h2>Dashboard Window</h2>

                        <div className="onboarding-choice-grid">
                            {dashboardWindowOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={
                                        dashboardWindowDays === option.value
                                            ? "onboarding-choice selected"
                                            : "onboarding-choice"
                                    }
                                    onClick={() => setDashboardWindowDays(option.value)}
                                >
                                    <strong>{option.label}</strong>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="onboarding-toggle-list">
                        <label>
                            <input
                                type="checkbox"
                                checked={birthdayReminders}
                                onChange={(e) => setBirthdayReminders(e.target.checked)}
                            />
                            Birthday reminders
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={tripReminders}
                                onChange={(e) => setTripReminders(e.target.checked)}
                            />
                            Trip reminders
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={schoolReminders}
                                onChange={(e) => setSchoolReminders(e.target.checked)}
                            />
                            School reminders
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={showSuggestedTasks}
                                onChange={(e) => setShowSuggestedTasks(e.target.checked)}
                            />
                            Suggested tasks
                        </label>
                    </div>

                    <button onClick={() => setStep(6)}>
                        Continue
                    </button>
                </section>
            )}

            {step === 6 && (
                <section>
                    <h1>Your Family Command Center Is Ready</h1>

                    <p>
                        Evergrove is ready to help your family stay organized.
                    </p>

                    <div className="onboarding-feature-list">
                        <div>✅ Family Calendar</div>
                        <div>✅ Shared To-Dos</div>
                        <div>✅ Meal Planning</div>
                        <div>✅ Shopping Lists</div>
                        <div>✅ School Tracking</div>
                    </div>

                    <button
                        onClick={finishOnboarding}
                        disabled={loading}
                    >
                        {loading ? "Setting things up..." : "Open my Family Dashboard"}
                    </button>
                </section>
            )}
        </div>
    )
}