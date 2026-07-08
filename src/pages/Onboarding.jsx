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
        "Home",
        "Family",
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
        setSetupComplete(true)

        try {
            await updatePreferences({
                household_name: householdName.trim(),
                timezone,
                birthday_reminders: true,
                trip_reminders: true,
                school_reminders: true,
                show_suggested_tasks: true
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

            sessionStorage.setItem("evergrove_skip_walkthrough_once", "true")

            setTimeout(() => {
                window.location.href = "/first-week"
            }, 2200)
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
                <span>Moving In</span>
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
                <section className="eg-card onboarding-card onboarding-welcome-card">
                    <div className="eg-stack">
                        <div className="onboarding-hero-icon">🏡</div>

                        <div>
                            <h1>Welcome Home</h1>

                            <p>
                                Evergrove helps families spend less time coordinating life
                                and more time living it.
                            </p>

                            <p>
                                In just a few minutes, we’ll get your home ready and help
                                your family start the week with a little more calm.
                            </p>
                        </div>

                        <div className="onboarding-feature-list onboarding-welcome-list">
                            <div>✓ Create your family’s home base</div>
                            <div>✓ Add the people you care for</div>
                            <div>✓ Start with a household that feels ready</div>
                        </div>

                        <Button onClick={() => setStep(2)}>
                            Let’s Get Started
                        </Button>
                    </div>
                </section>
            )}

            {step === 2 && (
                <section className="eg-card onboarding-card">
                    <div className="eg-stack">
                        <div>
                            <p className="onboarding-eyebrow">Moving In</p>
                            <h1>Let’s start with you.</h1>

                            <p>
                                What should your family see when you add a To-Do, event,
                                announcement, or update?
                            </p>
                        </div>

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
                        <div>
                            <p className="onboarding-eyebrow">Create Your Home</p>
                            <h1>What should we call your home?</h1>

                            <p>
                                This becomes the shared space where your family calendar,
                                To-Dos, meals, shopping, and plans come together.
                            </p>
                        </div>

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
                            <small>
                                Detected automatically. You can change this later in Settings.
                            </small>
                        </div>

                        <Button
                            onClick={handleHouseholdStep}
                            disabled={loading || !householdName.trim()}
                        >
                            {loading ? "Creating your home..." : "Continue"}
                        </Button>
                    </div>
                </section>
            )}

            {step === 4 && (
                <section className="eg-card onboarding-card">
                    <div className="eg-stack">
                        <div>
                            <p className="onboarding-eyebrow">Meet Your Family</p>
                            <h1>Who should Evergrove help you care for?</h1>

                            <p>
                                Add the adults, children, and pets in your household.
                                This helps Evergrove feel like it belongs to your family,
                                not just one person.
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
                            <h2>Your Home So Far</h2>

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
                                I’ll add more later
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {step === 5 && (
                <section className="eg-card onboarding-card onboarding-ready-card">
                    <div className="eg-stack">
                        <div className="onboarding-hero-icon">✨</div>

                        <div>
                            <p className="onboarding-eyebrow">Welcome Home</p>
                            <h1>{householdName || "Your home"} is ready.</h1>

                            <p>
                                We’ll create your household, prepare your family workspace,
                                and get Evergrove ready for your first week.
                            </p>
                        </div>

                        <div className="onboarding-feature-list onboarding-ready-list">
                            <div>✓ Family Calendar</div>
                            <div>✓ Shared To-Dos</div>
                            <div>✓ Meal Planning</div>
                            <div>✓ Shopping Lists</div>
                            <div>✓ Trips</div>
                            <div>✓ Household Activity</div>
                        </div>

                        {setupComplete && (
                            <div className="onboarding-setup-status">
                                <div>✅ Creating your household</div>
                                <div>✅ Adding your family</div>
                                <div>✅ Preparing your shared calendar</div>
                                <div>✅ Organizing your family planner</div>
                                <div>⏳ Almost ready...</div>
                            </div>
                        )}

                        <p className="onboarding-helper-text">
                            Next, we’ll help you plan your first week.
                        </p>

                        <Button
                            onClick={finishOnboarding}
                            disabled={loading || setupComplete}
                        >
                            {loading || setupComplete
                                ? "Getting your home ready..."
                                : "Move In"}
                        </Button>
                    </div>
                </section>
            )}
        </div>
    )
}