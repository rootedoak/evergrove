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
        <>
            <section className="hero-card">
                <p className="eyebrow">Account</p>
                <h2>Profile</h2>
                <p>
                    Manage your account, household, dashboard, calendar,
                    and notification preferences.
                </p>
            </section>

            <section className="card">
                <h3>Account Information</h3>

                <div className="stack">
                    <div>
                        <strong>Email</strong>
                        <p>{user?.email || "Loading..."}</p>
                    </div>

                    <div>
                        <strong>User ID</strong>
                        <p>{user?.id || "Loading..."}</p>
                    </div>
                </div>
            </section>

            {loading ? (
                <section className="card">
                    <p>Loading preferences...</p>
                </section>
            ) : (
                <form onSubmit={handleSavePreferences}>
                    <section className="card">
                        <h3>Household</h3>

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
                    </section>

                    <section className="card">
                        <h3>Dashboard Preferences</h3>

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

                        <div className="stack">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={preferences.show_birthdays}
                                    onChange={event =>
                                        updatePreference("show_birthdays", event.target.checked)
                                    }
                                />{" "}
                                Show birthdays
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={preferences.show_trips}
                                    onChange={event =>
                                        updatePreference("show_trips", event.target.checked)
                                    }
                                />{" "}
                                Show trips
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={preferences.show_school_items}
                                    onChange={event =>
                                        updatePreference("show_school_items", event.target.checked)
                                    }
                                />{" "}
                                Show school items
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={preferences.show_activity_sessions}
                                    onChange={event =>
                                        updatePreference("show_activity_sessions", event.target.checked)
                                    }
                                />{" "}
                                Show activity sessions
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={preferences.show_suggested_tasks}
                                    onChange={event =>
                                        updatePreference("show_suggested_tasks", event.target.checked)
                                    }
                                />{" "}
                                Show suggested tasks
                            </label>
                        </div>
                    </section>

                    <section className="card">
                        <h3>Calendar Preferences</h3>

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
                    </section>

                    <section className="card">
                        <h3>Notification Preferences</h3>

                        <div className="stack">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={preferences.birthday_reminders}
                                    onChange={event =>
                                        updatePreference("birthday_reminders", event.target.checked)
                                    }
                                />{" "}
                                Birthday reminders
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={preferences.trip_reminders}
                                    onChange={event =>
                                        updatePreference("trip_reminders", event.target.checked)
                                    }
                                />{" "}
                                Trip reminders
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={preferences.activity_reminders}
                                    onChange={event =>
                                        updatePreference("activity_reminders", event.target.checked)
                                    }
                                />{" "}
                                Activity reminders
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={preferences.school_reminders}
                                    onChange={event =>
                                        updatePreference("school_reminders", event.target.checked)
                                    }
                                />{" "}
                                School reminders
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={preferences.task_reminders}
                                    onChange={event =>
                                        updatePreference("task_reminders", event.target.checked)
                                    }
                                />{" "}
                                Task reminders
                            </label>
                        </div>
                    </section>

                    <section className="card">
                        <h3>Save Preferences</h3>

                        <div className="card-actions">
                            <button
                                className="primary-button"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Preferences"}
                            </button>
                        </div>
                    </section>
                </form>
            )}

            <section className="card">
                <h3>Account Actions</h3>

                <div className="card-actions">
                    <button
                        className="danger-button"
                        type="button"
                        onClick={handleLogout}
                    >
                        Sign Out
                    </button>
                </div>
            </section>
        </>
    )
}