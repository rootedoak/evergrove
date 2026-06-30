import { useMemo, useState } from "react"

import logo from "../assets/evergrove-logo.svg"

import { supabase } from "../lib/supabase"
import { createHousehold } from "../services/householdService"
import { createFamilyMember } from "../services/familyService"
import {
    updatePreferences,
    completeOnboarding
} from "../services/preferenceService"

import Button from "../components/ui/Button"

function detectTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago"
    } catch {
        return "America/Chicago"
    }
}

function getMemberIcon(role) {
    if (role === "parent") return "👤"
    if (role === "pet") return "🐾"
    return "🧒"
}

function getMemberLabel(role) {
    if (role === "parent") return "Adult"
    if (role === "pet") return "Pet"
    return "Child"
}

export default function Onboarding() {
    const onboardingSteps = [
        "Welcome",
        "You",
        "Household",
        "Family",
        "Preferences",
        "Ready"
    ]

    const totalSteps = onboardingSteps.length
    const detectedTimezone = useMemo(() => detectTimezone(), [])

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [setupComplete, setSetupComplete] = useState(false)

    const [householdCreated, setHouseholdCreated] = useState(false)

    const [displayName, setDisplayName] = useState("")
    const [householdName, setHouseholdName] = useState("")
    const [timezone] = useState(detectedTimezone)

    const [familyMembers, setFamilyMembers] = useState([])
    const [memberName, setMemberName] = useState("")
    const [memberType, setMemberType] = useState("child")

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
                timezone
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

            setSetupComplete(true)

            setTimeout(() => {
                window.location.href = "/"
            }, 1400)
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not finish onboarding.")
            setSetupComplete(false)
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

            <div className="onboarding-steps">
                {onboardingSteps.map((label, index) => {
                    const stepNumber = index + 1

                    return (
                        <div
                            key={label}
                            className={
                                step >= stepNumber
                                    ? "onboarding-step active"
                                    : "onboarding-step"
                            }
                        >
                            <div className="onboarding-step-circle">
                                {stepNumber}
                            </div>

                            <span>{label}</span>
                        </div>
                    )
                })}
            </div>

            {step === 1 && (
                <section className="eg-card onboarding-card">
                    <div className="eg-stack">
                        <h1>Welcome to Evergrove</h1>

                        <p>
                            Let’s build your family’s command center in just a few minutes.
                        </p>

                        <div className="onboarding-feature-list onboarding-welcome-list">
                            <div>✅ Keep everyone aligned</div>
                            <div>✅ Plan meals, To-Dos, trips, and school</div>
                            <div>✅ Share one organized household view</div>
                        </div>

                        <Button onClick={() => setStep(2)}>
                            Get Started
                        </Button>
                    </div>
                </section>
            )}

            {step === 2 && (
                <section className="eg-card onboarding-card">
                    <div className="eg-stack">
                        <h1>Let’s start with you.</h1>

                        <p>
                            What should everyone call you? This name will appear on To-Dos,
                            events, announcements, and household activity.
                        </p>

                        <label>
                            Your Name
                            <input
                                value={displayName}
                                onChange={(event) => setDisplayName(event.target.value)}
                                placeholder="First name"
                                autoFocus
                            />
                        </label>

                        <Button
                            onClick={handleNameStep}
                            disabled={loading || !displayName.trim()}
                        >
                            {loading ? "Saving..." : "Continue"}
                        </Button>
                    </div>
                </section>
            )}

            {step === 3 && (
                <section className="eg-card onboarding-card">
                    <div className="eg-stack">
                        <h1>Tell us about your household.</h1>

                        <p>
                            This gives Evergrove a shared home base for your family.
                        </p>

                        <label>
                            Household Name
                            <input
                                value={householdName}
                                onChange={(event) => setHouseholdName(event.target.value)}
                                placeholder="McGee Family"
                            />
                        </label>

                        <div className="onboarding-info-card">
                            <strong>Time Zone</strong>
                            <p>{timezone}</p>
                            <small>Detected automatically. You can change this later in Settings.</small>
                        </div>

                        <Button
                            onClick={handleHouseholdStep}
                            disabled={loading || !householdName.trim()}
                        >
                            {loading ? "Saving..." : "Continue"}
                        </Button>
                    </div>
                </section>
            )}

            {step === 4 && (
                <section className="eg-card onboarding-card">
                    <div className="eg-stack">
                        <div>
                            <h1>Who should Evergrove help you keep organized?</h1>

                            <p>
                                Add the adults, children, and pets in your household.
                                You can always add more later.
                            </p>
                        </div>

                        <div className="onboarding-member-builder">
                            <input
                                value={memberName}
                                onChange={(event) => setMemberName(event.target.value)}
                                placeholder={
                                    memberType === "pet"
                                        ? "Pet name"
                                        : memberType === "parent"
                                            ? "Adult name"
                                            : "Child name"
                                }
                            />

                            <div className="onboarding-choice-grid">
                                {[
                                    { key: "parent", label: "Adult", icon: "👤" },
                                    { key: "child", label: "Child", icon: "🧒" },
                                    { key: "pet", label: "Pet", icon: "🐾" }
                                ].map(option => (
                                    <Button
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
                                    </Button>
                                ))}
                            </div>

                            <Button
                                type="button"
                                onClick={addFamilyMember}
                                disabled={!memberName.trim()}
                            >
                                Add to Household
                            </Button>
                        </div>

                        <div className="onboarding-household-preview">
                            <h2>Your Household</h2>

                            <div className="onboarding-member-card you">
                                <span>🌳</span>

                                <div>
                                    <strong>{displayName || "You"}</strong>
                                    <p>You</p>
                                </div>
                            </div>

                            {familyMembers.map((member, index) => (
                                <div
                                    key={`${member.name}-${index}`}
                                    className="onboarding-member-card"
                                >
                                    <span>{getMemberIcon(member.role)}</span>

                                    <div>
                                        <strong>{member.name}</strong>
                                        <p>{getMemberLabel(member.role)}</p>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => removeFamilyMember(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="onboarding-action-row">
                            <Button onClick={() => setStep(5)}>
                                Continue
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setStep(5)}
                            >
                                I’ll do this later
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {step === 5 && (
                <section className="eg-card onboarding-card">
                    <div className="eg-stack">
                        <div>
                            <h1>Let’s personalize Evergrove.</h1>

                            <p>
                                Choose what matters most to your family. You can change these later.
                            </p>
                        </div>

                        <div className="onboarding-preference-grid">
                            <PreferenceCard
                                icon="🎂"
                                title="Birthdays"
                                description="Get reminders for upcoming birthdays."
                                checked={birthdayReminders}
                                onChange={setBirthdayReminders}
                            />

                            <PreferenceCard
                                icon="🧳"
                                title="Trips"
                                description="Get reminders for trips and travel plans."
                                checked={tripReminders}
                                onChange={setTripReminders}
                            />

                            <PreferenceCard
                                icon="🎒"
                                title="School"
                                description="Track school events and important dates."
                                checked={schoolReminders}
                                onChange={setSchoolReminders}
                            />

                            <PreferenceCard
                                icon="✅"
                                title="Suggested To-Dos"
                                description="See helpful To-Do suggestions based on your schedule."
                                checked={showSuggestedTasks}
                                onChange={setShowSuggestedTasks}
                            />
                        </div>

                        <div className="onboarding-action-row">
                            <Button onClick={() => setStep(6)}>
                                Continue
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setStep(6)}
                            >
                                I’ll do this later
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {step === 6 && (
                <section className="eg-card onboarding-card onboarding-ready-card">
                    <div className="eg-stack">
                        <div>
                            <h1>Welcome home.</h1>

                            <p>
                                Your family command center is ready. Evergrove will help your
                                household stay organized, prepared, and connected.
                            </p>
                        </div>

                        <div className="onboarding-feature-list onboarding-ready-list">
                            <div>✅ Family Calendar</div>
                            <div>✅ Shared To-Dos</div>
                            <div>✅ Meal Planning</div>
                            <div>✅ Shopping Lists</div>
                            <div>✅ School Tracking</div>
                            <div>✅ Trips & Routines</div>
                        </div>

                        {setupComplete && (
                            <div className="onboarding-setup-status">
                                <div>✅ Creating your household</div>
                                <div>✅ Adding family members</div>
                                <div>✅ Setting up preferences</div>
                                <div>⏳ Almost ready...</div>
                            </div>
                        )}

                        <p className="onboarding-helper-text">
                            You can change these settings later.
                        </p>

                        <Button
                            onClick={finishOnboarding}
                            disabled={loading || setupComplete}
                        >
                            {loading || setupComplete
                                ? "Setting up your household..."
                                : "Open Evergrove"}
                        </Button>
                    </div>
                </section>
            )}
        </div>
    )
}

function PreferenceCard({
    icon,
    title,
    description,
    checked,
    onChange
}) {
    return (
        <label className="onboarding-preference-card">
            <span className="onboarding-preference-icon">
                {icon}
            </span>

            <div>
                <strong>{title}</strong>
                <p>{description}</p>
            </div>

            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />
        </label>
    )
}