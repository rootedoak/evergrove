import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

import PushNotificationSettings from "../components/PushNotificationSettings"

import {
    getPreferences,
    updatePreferences
} from "../services/preferenceService"

import AppPage from "../components/ui/AppPage"
import PageHeader from "../components/ui/PageHeader"
import SectionCard from "../components/ui/SectionCard"
import Button from "../components/ui/Button"
import InsightCard from "../components/dashboard/InsightCard"

const defaultShoppingCategoryOrder = [
    "Produce",
    "Meat",
    "Dairy",
    "Frozen",
    "Pantry",
    "Household",
    "Uncategorized"
]

const initialPreferences = {
    household_name: "My Family",
    timezone: "America/Chicago",
    dashboard_window_days: "7",
    timeline_window_days: "90",
    week_starts_on: "Sunday",
    birthday_reminders: true,
    trip_reminders: true,
    activity_reminders: true,
    school_reminders: true,
    task_reminders: true,
    inbox_tasks: true,
    inbox_activities: true,
    inbox_school: true,
    inbox_calendar: true,
    inbox_trips: true,
    inbox_reminders: true,
    show_birthdays: true,
    show_trips: true,
    show_school_items: true,
    show_activity_sessions: true,
    show_suggested_tasks: true,
    shopping_category_order: defaultShoppingCategoryOrder,
    show_holidays: true
}

function PreferenceToggle({ label, checked, onChange }) {
    return (
        <label className="settings-toggle-row">
            <span>{label}</span>

            <input
                type="checkbox"
                checked={checked}
                onChange={event => onChange(event.target.checked)}
            />
        </label>
    )
}

function SettingsSection({
    title,
    scope,
    subtitle,
    children
}) {
    return (
        <SectionCard
            title={title}
            subtitle={`${scope} • ${subtitle}`}
        >
            {children}
        </SectionCard>
    )
}

export default function Profile() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [preferences, setPreferences] = useState(initialPreferences)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [shoppingCategoriesOpen, setShoppingCategoriesOpen] = useState(false)

    useEffect(() => {
        async function loadProfile() {
            try {
                const {
                    data: { user }
                } = await supabase.auth.getUser()

                setUser(user)

                const savedPreferences = await getPreferences()

                setPreferences({
                    ...initialPreferences,
                    ...savedPreferences,
                    dashboard_window_days: String(savedPreferences.dashboard_window_days ?? 7),
                    timeline_window_days: String(savedPreferences.timeline_window_days ?? 90),
                    shopping_category_order:
                        savedPreferences.shopping_category_order?.length
                            ? savedPreferences.shopping_category_order
                            : defaultShoppingCategoryOrder
                })
            } catch (error) {
                console.error(error)
                alert(error.message || "Could not load profile.")
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
    }, [])

    function updatePreference(field, value) {
        setPreferences(current => ({
            ...current,
            [field]: value
        }))
    }

    function moveShoppingCategory(index, direction) {
        const nextOrder = [...preferences.shopping_category_order]
        const targetIndex = index + direction

        if (targetIndex < 0 || targetIndex >= nextOrder.length) return

        const [category] = nextOrder.splice(index, 1)
        nextOrder.splice(targetIndex, 0, category)

        updatePreference("shopping_category_order", nextOrder)
    }

    function addShoppingCategory() {
        const category = window.prompt("Category name")
        if (!category?.trim()) return

        const cleanCategory = category.trim()

        if (preferences.shopping_category_order.includes(cleanCategory)) {
            alert("That category already exists.")
            return
        }

        updatePreference("shopping_category_order", [
            ...preferences.shopping_category_order,
            cleanCategory
        ])
    }

    function removeShoppingCategory(category) {
        if (category === "Uncategorized") {
            alert("Uncategorized cannot be removed.")
            return
        }

        updatePreference(
            "shopping_category_order",
            preferences.shopping_category_order.filter(item => item !== category)
        )
    }

    async function handleSavePreferences(event) {
        event.preventDefault()
        setSaving(true)

        try {
            const savedPreferences = await updatePreferences({
                household_name: preferences.household_name,
                timezone: preferences.timezone,
                dashboard_window_days: Number(preferences.dashboard_window_days),
                timeline_window_days: Number(preferences.timeline_window_days),
                week_starts_on: preferences.week_starts_on,
                birthday_reminders: preferences.birthday_reminders,
                trip_reminders: preferences.trip_reminders,
                activity_reminders: preferences.activity_reminders,
                school_reminders: preferences.school_reminders,
                inbox_tasks: preferences.inbox_tasks,
                inbox_activities: preferences.inbox_activities,
                inbox_school: preferences.inbox_school,
                inbox_calendar: preferences.inbox_calendar,
                inbox_trips: preferences.inbox_trips,
                inbox_reminders: preferences.inbox_reminders,
                task_reminders: preferences.task_reminders,
                show_birthdays: preferences.show_birthdays,
                show_trips: preferences.show_trips,
                show_school_items: preferences.show_school_items,
                show_activity_sessions: preferences.show_activity_sessions,
                show_suggested_tasks: preferences.show_suggested_tasks,
                shopping_category_order: preferences.shopping_category_order,
                show_holidays: preferences.show_holidays
            })

            setPreferences(current => ({
                ...current,
                ...savedPreferences,
                dashboard_window_days: String(
                    savedPreferences.dashboard_window_days ??
                    current.dashboard_window_days ??
                    7
                ),
                timeline_window_days: String(
                    savedPreferences.timeline_window_days ??
                    current.timeline_window_days ??
                    90
                )
            }))

            alert("Preferences saved.")
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not save preferences.")
        } finally {
            setSaving(false)
        }
    }

    async function handleLogout() {
        const confirmed = window.confirm("Are you sure you want to sign out?")
        if (!confirmed) return

        await supabase.auth.signOut()

        window.location.href = "/login"
    }

    return (
        <AppPage>
            <PageHeader
                eyebrow="Settings"
                title="Settings"
                subtitle="Manage your household and personalize Evergrove."
                action={
                    <Button
                        variant="danger"
                        onClick={handleLogout}
                    >
                        Sign Out
                    </Button>
                }
            />

            <div className="eg-stack">

                <InsightCard
                    insight={{
                        title: "Your household is configured.",
                        description:
                            "Manage shared settings and personalize your Evergrove experience.",
                        actionLabel: "Save"
                    }}
                    onAction={() =>
                        document.querySelector("form")?.requestSubmit()
                    }
                />

                <SectionCard
                    title="Account"
                    subtitle="Your Evergrove account."
                >
                    <div>
                        <h3>{user?.email || "Loading account..."}</h3>
                        <p>
                            Account access and sign-in are specific to you.
                        </p>
                    </div>

                    <p>
                        User ID: <span>{user?.id || "Loading..."}</span>
                    </p>
                </SectionCard>

                {loading ? (
                    <section className="card">
                        <p>Loading preferences...</p>
                    </section>
                ) : (
                    <form className="card settings-command-card" onSubmit={handleSavePreferences}>
                        <SettingsSection
                            title="Household Settings"
                            scope="Shared household setting"
                            subtitle="These settings are shared by everyone connected to this household."
                        >
                            <div className="form-grid">
                                <label>
                                    Household Name
                                    <input
                                        value={preferences.household_name}
                                        onChange={event =>
                                            updatePreference("household_name", event.target.value)
                                        }
                                        placeholder="McGee Family"
                                    />
                                </label>

                                <label>
                                    Time Zone
                                    <select
                                        value={preferences.timezone}
                                        onChange={event =>
                                            updatePreference("timezone", event.target.value)
                                        }
                                    >
                                        <option value="America/Chicago">Central Time</option>
                                        <option value="America/New_York">Eastern Time</option>
                                        <option value="America/Denver">Mountain Time</option>
                                        <option value="America/Los_Angeles">Pacific Time</option>
                                    </select>
                                </label>

                                <label>
                                    Week Starts On
                                    <select
                                        value={preferences.week_starts_on}
                                        onChange={event =>
                                            updatePreference("week_starts_on", event.target.value)
                                        }
                                    >
                                        <option value="Sunday">Sunday</option>
                                        <option value="Monday">Monday</option>
                                    </select>
                                </label>
                            </div>

                            <div className="settings-save-row">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => navigate("/settings/family")}
                                >
                                    Manage Family Members
                                </button>
                            </div>
                        </SettingsSection>

                        <SettingsSection
                            title="Shopping Categories"
                            scope="Shared household setting"
                            subtitle="This category order is shared across household shopping lists."
                        >
                            <button
                                type="button"
                                className="eg-collapsible-row"
                                onClick={() => setShoppingCategoriesOpen(current => !current)}
                            >
                                <span>
                                    {preferences.shopping_category_order.length} categories configured
                                </span>

                                <strong>
                                    {shoppingCategoriesOpen ? "Hide" : "Manage"}
                                </strong>
                            </button>

                            {shoppingCategoriesOpen && (
                                <div className="eg-stack">
                                    <div className="settings-category-list">
                                        {preferences.shopping_category_order.map((category, index) => (
                                            <div key={category} className="settings-category-row">
                                                <span>{category}</span>

                                                <div className="button-row">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() => moveShoppingCategory(index, -1)}
                                                        disabled={index === 0}
                                                    >
                                                        Up
                                                    </Button>

                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() => moveShoppingCategory(index, 1)}
                                                        disabled={index === preferences.shopping_category_order.length - 1}
                                                    >
                                                        Down
                                                    </Button>

                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() => removeShoppingCategory(category)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={addShoppingCategory}
                                    >
                                        Add Category
                                    </Button>
                                </div>
                            )}
                        </SettingsSection>

                        <SettingsSection
                            title="Personal Dashboard"
                            scope="Personal user setting"
                            subtitle="These settings only affect your own dashboard view."
                        >
                            <div className="form-grid">
                                <label>
                                    Coming Up Window
                                    <select
                                        value={preferences.dashboard_window_days}
                                        onChange={event =>
                                            updatePreference("dashboard_window_days", event.target.value)
                                        }
                                    >
                                        <option value="3">Next 3 days</option>
                                        <option value="7">Next 7 days</option>
                                        <option value="14">Next 14 days</option>
                                    </select>
                                </label>

                                <label>
                                    Timeline Window
                                    <select
                                        value={preferences.timeline_window_days}
                                        onChange={event =>
                                            updatePreference("timeline_window_days", event.target.value)
                                        }
                                    >
                                        <option value="30">Next 30 days</option>
                                        <option value="60">Next 60 days</option>
                                        <option value="90">Next 90 days</option>
                                    </select>
                                </label>
                            </div>

                            <div className="settings-toggle-grid">
                                <PreferenceToggle
                                    label="Show holidays on calendar"
                                    checked={preferences.show_holidays}
                                    onChange={value => updatePreference("show_holidays", value)}
                                />

                                <PreferenceToggle
                                    label="Show birthdays"
                                    checked={preferences.show_birthdays}
                                    onChange={value => updatePreference("show_birthdays", value)}
                                />

                                <PreferenceToggle
                                    label="Show trips"
                                    checked={preferences.show_trips}
                                    onChange={value => updatePreference("show_trips", value)}
                                />

                                <PreferenceToggle
                                    label="Show school items"
                                    checked={preferences.show_school_items}
                                    onChange={value => updatePreference("show_school_items", value)}
                                />

                                <PreferenceToggle
                                    label="Show activity sessions"
                                    checked={preferences.show_activity_sessions}
                                    onChange={value => updatePreference("show_activity_sessions", value)}
                                />

                                <PreferenceToggle
                                    label="Show suggested tasks"
                                    checked={preferences.show_suggested_tasks}
                                    onChange={value => updatePreference("show_suggested_tasks", value)}
                                />
                            </div>
                        </SettingsSection>

                        <SettingsSection
                            title="Personal Reminders"
                            scope="Personal user setting"
                            subtitle="These reminder preferences only affect your account."
                        >
                            <div className="settings-toggle-grid">
                                <PreferenceToggle
                                    label="Birthday reminders"
                                    checked={preferences.birthday_reminders}
                                    onChange={value => updatePreference("birthday_reminders", value)}
                                />

                                <PreferenceToggle
                                    label="Trip reminders"
                                    checked={preferences.trip_reminders}
                                    onChange={value => updatePreference("trip_reminders", value)}
                                />

                                <PreferenceToggle
                                    label="Activity reminders"
                                    checked={preferences.activity_reminders}
                                    onChange={value => updatePreference("activity_reminders", value)}
                                />

                                <PreferenceToggle
                                    label="School reminders"
                                    checked={preferences.school_reminders}
                                    onChange={value => updatePreference("school_reminders", value)}
                                />

                                <PreferenceToggle
                                    label="Task reminders"
                                    checked={preferences.task_reminders}
                                    onChange={value => updatePreference("task_reminders", value)}
                                />
                            </div>
                        </SettingsSection>

                        <SettingsSection
                            title="Inbox Notifications"
                            scope="Personal user setting"
                            subtitle="Choose which events appear in your Personal Inbox."
                        >
                            <div className="settings-toggle-grid">
                                <PreferenceToggle
                                    label="To-Do notifications"
                                    checked={preferences.inbox_tasks}
                                    onChange={value => updatePreference("inbox_tasks", value)}
                                />

                                <PreferenceToggle
                                    label="Activity notifications"
                                    checked={preferences.inbox_activities}
                                    onChange={value => updatePreference("inbox_activities", value)}
                                />

                                <PreferenceToggle
                                    label="School notifications"
                                    checked={preferences.inbox_school}
                                    onChange={value => updatePreference("inbox_school", value)}
                                />

                                <PreferenceToggle
                                    label="Calendar notifications"
                                    checked={preferences.inbox_calendar}
                                    onChange={value => updatePreference("inbox_calendar", value)}
                                />

                                <PreferenceToggle
                                    label="Trip notifications"
                                    checked={preferences.inbox_trips}
                                    onChange={value => updatePreference("inbox_trips", value)}
                                />

                                <PreferenceToggle
                                    label="Reminder notifications"
                                    checked={preferences.inbox_reminders}
                                    onChange={value => updatePreference("inbox_reminders", value)}
                                />
                            </div>
                        </SettingsSection>

                        <SettingsSection
                            title="Push Notifications"
                            scope="Personal user setting"
                            subtitle="Receive device alerts for important Evergrove updates."
                        >
                            <PushNotificationSettings />
                        </SettingsSection>

                        <div className="settings-save-row">
                            <button
                                className="primary-button"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Preferences"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </AppPage >
    )
}