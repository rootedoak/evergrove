import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import {
    getPreferences,
    updatePreferences
} from "../services/preferenceService"

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
    show_birthdays: true,
    show_trips: true,
    show_school_items: true,
    show_activity_sessions: true,
    show_suggested_tasks: true
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

function SettingsSection({ title, subtitle, children }) {
    return (
        <section className="settings-command-section">
            <div className="settings-section-header">
                <div>
                    <h3>{title}</h3>
                    {subtitle && <p>{subtitle}</p>}
                </div>
            </div>

            <div className="settings-section-content">
                {children}
            </div>
        </section>
    )
}

export default function Profile() {
    const [user, setUser] = useState(null)
    const [preferences, setPreferences] = useState(initialPreferences)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

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
                    timeline_window_days: String(savedPreferences.timeline_window_days ?? 90)
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
                task_reminders: preferences.task_reminders,
                show_birthdays: preferences.show_birthdays,
                show_trips: preferences.show_trips,
                show_school_items: preferences.show_school_items,
                show_activity_sessions: preferences.show_activity_sessions,
                show_suggested_tasks: preferences.show_suggested_tasks
            })

            setPreferences({
                ...initialPreferences,
                ...savedPreferences,
                dashboard_window_days: String(savedPreferences.dashboard_window_days ?? 7),
                timeline_window_days: String(savedPreferences.timeline_window_days ?? 90)
            })

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
    }

    return (
        <div className="settings-command-page">
            <header className="calendar-header settings-command-header">
                <div>
                    <p className="dashboard-household-name">Settings</p>
                    <h2>Household Settings</h2>

                    <p className="settings-header-summary">
                        Manage account, household, dashboard, calendar, and reminder preferences.
                    </p>
                </div>

                <button
                    className="danger-button"
                    type="button"
                    onClick={handleLogout}
                >
                    Sign Out
                </button>
            </header>

            <section className="card settings-account-card">
                <div>
                    <p className="card-kicker">Account</p>
                    <h3>{user?.email || "Loading account..."}</h3>
                </div>

                <p>
                    User ID: <span>{user?.id || "Loading..."}</span>
                </p>
            </section>

            {loading ? (
                <section className="card">
                    <p>Loading preferences...</p>
                </section>
            ) : (
                <form className="card settings-command-card" onSubmit={handleSavePreferences}>
                    <SettingsSection
                        title="Household"
                        subtitle="The name and local timezone used across Evergrove."
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
                        </div>
                    </SettingsSection>

                    <SettingsSection
                        title="Dashboard"
                        subtitle="Control what appears on the Family Command Center."
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
                        title="Calendar"
                        subtitle="Choose how the family calendar is displayed."
                    >
                        <div className="form-grid">
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
                    </SettingsSection>

                    <SettingsSection
                        title="Reminders"
                        subtitle="Choose which reminder types Evergrove should surface."
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
    )
}