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

import { getFamilyMembers } from "../services/familyService"
import Avatar from "../components/ui/Avatar"
import {
    promptForAvatarUpload,
    deleteFamilyAvatar
} from "../services/avatarService"

const initialPreferences = {
    household_name: "My Family",
    timezone: "America/Chicago",
    dashboard_window_days: "7",
    timeline_window_days: "90",
    week_starts_on: "Sunday",
    morning_brief_enabled: true,
    morning_brief_time: "07:00",
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
    const [myMember, setMyMember] = useState(null)
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

                const [savedPreferences, familyMembers] = await Promise.all([
                    getPreferences(),
                    getFamilyMembers()
                ])

                const matchedMember = familyMembers.find(
                    member => member.user_id === user?.id
                )

                setMyMember(matchedMember || null)

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

    async function handleSavePreferences(event) {
        event.preventDefault()
        setSaving(true)

        try {
            const savedPreferences = await updatePreferences({
                timeline_window_days: Number(preferences.timeline_window_days),
                morning_brief_enabled: preferences.morning_brief_enabled,
                morning_brief_time: preferences.morning_brief_time,
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

    async function refreshMyMember(userId = user?.id) {
        if (!userId) return

        const familyMembers = await getFamilyMembers()

        const matchedMember = familyMembers.find(
            member => member.user_id === userId
        )

        setMyMember(matchedMember || null)
    }

    async function handleUploadMyAvatar() {
        if (!myMember?.id) {
            alert("We couldn't find your family profile yet.")
            return
        }

        try {
            const uploaded = await promptForAvatarUpload(myMember.id)

            if (uploaded) {
                await refreshMyMember()
            }
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not upload profile photo.")
        }
    }

    async function handleDeleteMyAvatar() {
        if (!myMember?.id) return

        const confirmed = window.confirm("Remove your profile photo?")
        if (!confirmed) return

        try {
            await deleteFamilyAvatar(myMember.id)
            await refreshMyMember()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not remove profile photo.")
        }
    }

    return (
        <AppPage>
            <PageHeader
                eyebrow="Account"
                title="Account"
                subtitle="Manage your profile, preferences, and notifications."
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

                <SectionCard
                    title="Account"
                    subtitle="Your Evergrove account."
                >
                    <div className="profile-account-row">
                        <button
                            type="button"
                            className="profile-avatar-button"
                            onClick={handleUploadMyAvatar}
                            disabled={!myMember}
                            aria-label="Change profile photo"
                        >
                            <Avatar
                                member={{
                                    ...myMember,
                                    name: myMember?.name || user?.email || "You",
                                    avatar_emoji: myMember?.avatar_emoji || "👤"
                                }}
                                size="lg"
                            />
                        </button>

                        <div className="profile-account-main">
                            <h3>{myMember?.name || "Your Profile"}</h3>
                            <p>{user?.email || "Loading account..."}</p>
                            <small>Tap your photo to change it.</small>

                            <div className="profile-account-actions">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleUploadMyAvatar}
                                    disabled={!myMember}
                                >
                                    Change Photo
                                </Button>

                                {myMember?.avatar_url && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleDeleteMyAvatar}
                                    >
                                        Remove Photo
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {loading ? (
                    <section className="card">
                        <p>Loading preferences...</p>
                    </section>
                ) : (
                    <form className="card settings-command-card" onSubmit={handleSavePreferences}>

                        <SettingsSection
                            title="Calendar & Timeline"
                            scope="Personal user setting"
                            subtitle="These settings only affect your own calendar and timeline view."
                        >
                            <div className="form-grid">
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
                            title="Good Morning"
                            scope="Personal user setting"
                            subtitle="Start every day with a personalized summary of what matters most."
                        >
                            <div className="eg-stack">
                                <div className="form-grid">
                                    <label>
                                        Delivery Time
                                        <input
                                            type="time"
                                            value={preferences.morning_brief_time || "07:00"}
                                            onChange={event =>
                                                updatePreference("morning_brief_time", event.target.value)
                                            }
                                        />
                                    </label>
                                </div>

                                <div className="settings-toggle-grid">
                                    <PreferenceToggle
                                        label="Send me my morning summary"
                                        checked={preferences.morning_brief_enabled ?? true}
                                        onChange={value =>
                                            updatePreference("morning_brief_enabled", value)
                                        }
                                    />
                                </div>
                            </div>

                            <p className="settings-help-text">
                                Your morning summary includes today's events, To-Dos, meals, and other important household updates.
                            </p>
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