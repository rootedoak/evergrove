import { useEffect, useState } from "react"

import SectionCard from "../../../components/ui/SectionCard"
import Button from "../../../components/ui/Button"

import {
    createFeatureFlag,
    getFeatureFlags,
    updateFeatureFlag
} from "../../../services/admin/featureFlagService"

import { searchHouseholds } from "../../../services/admin/householdAdminService"
import { searchUsers } from "../../../services/admin/userAdminService"

const emptyForm = {
    key: "",
    name: "",
    description: "",
    is_enabled_globally: false,
    rollout_percentage: 0
}

export default function FeatureFlags() {
    const [flags, setFlags] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const [editingId, setEditingId] = useState(null)
    const [editingFlag, setEditingFlag] = useState(null)

    const [householdSearch, setHouseholdSearch] = useState("")
    const [userSearch, setUserSearch] = useState("")
    const [householdResults, setHouseholdResults] = useState([])
    const [userResults, setUserResults] = useState([])

    async function loadFlags() {
        try {
            setLoading(true)
            const data = await getFeatureFlags()
            setFlags(data)
        } catch (err) {
            console.error(err)
            setError("Unable to load feature flags.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFlags()
    }, [])

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)
        setError("")

        try {
            await createFeatureFlag(form)
            setForm(emptyForm)
            await loadFlags()
        } catch (err) {
            console.error(err)
            setError("Unable to create feature flag.")
        } finally {
            setSaving(false)
        }
    }

    async function toggleGlobal(flag) {
        await updateFeatureFlag(flag.id, {
            is_enabled_globally: !flag.is_enabled_globally
        })
        await loadFlags()
    }

    function startEditing(flag) {
        setEditingId(flag.id)
        setEditingFlag({
            name: flag.name || "",
            description: flag.description || "",
            rollout_percentage: flag.rollout_percentage || 0,
            is_enabled_globally: !!flag.is_enabled_globally,
            target_household_ids: flag.target_household_ids?.join("\n") || "",
            target_user_ids: flag.target_user_ids?.join("\n") || ""
        })
    }

    function cancelEditing() {
        setEditingId(null)
        setEditingFlag(null)
    }

    async function saveEditing(flag) {
        await updateFeatureFlag(flag.id, {
            name: editingFlag.name,
            description: editingFlag.description,
            rollout_percentage: Number(editingFlag.rollout_percentage || 0),
            is_enabled_globally: editingFlag.is_enabled_globally,
            target_household_ids: editingFlag.target_household_ids
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean),
            target_user_ids: editingFlag.target_user_ids
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean)
        })

        cancelEditing()
        await loadFlags()
    }

    async function handleHouseholdSearch(value) {
        setHouseholdSearch(value)
        const results = await searchHouseholds(value)
        setHouseholdResults(results)
    }

    async function handleUserSearch(value) {
        setUserSearch(value)
        const results = await searchUsers(value)
        setUserResults(results)
    }

    function addHouseholdTarget(householdId) {
        const currentIds = editingFlag.target_household_ids
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean)

        if (currentIds.includes(householdId)) return

        setEditingFlag({
            ...editingFlag,
            target_household_ids: [...currentIds, householdId].join("\n")
        })
    }

    function addUserTarget(userId) {
        const currentIds = editingFlag.target_user_ids
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean)

        if (currentIds.includes(userId)) return

        setEditingFlag({
            ...editingFlag,
            target_user_ids: [...currentIds, userId].join("\n")
        })
    }

    return (
        <div className="admin-page">
            <div>
                <h1>Feature Flags</h1>
                <p className="muted">
                    Control beta features by global status, rollout percentage, household targeting, or user targeting.
                </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <SectionCard title="Create Feature Flag">
                <form className="admin-form" onSubmit={handleSubmit}>
                    <label>
                        Key
                        <input
                            value={form.key}
                            onChange={(e) =>
                                setForm({ ...form, key: e.target.value })
                            }
                            placeholder="new_dashboard_experience"
                            required
                        />
                    </label>

                    <label>
                        Name
                        <input
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            placeholder="New Dashboard Experience"
                            required
                        />
                    </label>

                    <label>
                        Description
                        <textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm({ ...form, description: e.target.value })
                            }
                            placeholder="What this flag controls..."
                        />
                    </label>

                    <label>
                        Rollout Percentage
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.rollout_percentage}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    rollout_percentage: e.target.value
                                })
                            }
                        />
                    </label>

                    <label className="admin-checkbox-row">
                        <input
                            type="checkbox"
                            checked={form.is_enabled_globally}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    is_enabled_globally: e.target.checked
                                })
                            }
                        />
                        Enabled globally
                    </label>

                    <Button type="submit" disabled={saving}>
                        {saving ? "Creating..." : "Create Flag"}
                    </Button>
                </form>
            </SectionCard>

            <SectionCard title="Flags">
                {loading ? (
                    <p className="muted">Loading feature flags...</p>
                ) : flags.length === 0 ? (
                    <p className="muted">No feature flags yet.</p>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Key</th>
                                    <th>Status</th>
                                    <th>Rollout</th>
                                    <th>Targets</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {flags.map((flag) => (
                                    <tr key={flag.id}>
                                        {editingId === flag.id ? (
                                            <>
                                                <td>
                                                    <input
                                                        value={editingFlag.name}
                                                        onChange={(e) =>
                                                            setEditingFlag({
                                                                ...editingFlag,
                                                                name: e.target.value
                                                            })
                                                        }
                                                    />

                                                    <textarea
                                                        value={editingFlag.description}
                                                        onChange={(e) =>
                                                            setEditingFlag({
                                                                ...editingFlag,
                                                                description: e.target.value
                                                            })
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <code>{flag.key}</code>
                                                </td>

                                                <td>
                                                    <label className="admin-checkbox-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={editingFlag.is_enabled_globally}
                                                            onChange={(e) =>
                                                                setEditingFlag({
                                                                    ...editingFlag,
                                                                    is_enabled_globally: e.target.checked
                                                                })
                                                            }
                                                        />
                                                        Global
                                                    </label>
                                                </td>

                                                <td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={editingFlag.rollout_percentage}
                                                        onChange={(e) =>
                                                            setEditingFlag({
                                                                ...editingFlag,
                                                                rollout_percentage: e.target.value
                                                            })
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <textarea
                                                        value={editingFlag.target_household_ids}
                                                        onChange={(e) =>
                                                            setEditingFlag({
                                                                ...editingFlag,
                                                                target_household_ids: e.target.value
                                                            })
                                                        }
                                                        placeholder="One household UUID per line"
                                                    />

                                                    <textarea
                                                        value={editingFlag.target_user_ids}
                                                        onChange={(e) =>
                                                            setEditingFlag({
                                                                ...editingFlag,
                                                                target_user_ids: e.target.value
                                                            })
                                                        }
                                                        placeholder="One user UUID per line"
                                                    />
                                                </td>

                                                <td>
                                                    <div className="admin-button-row">
                                                        <Button
                                                            type="button"
                                                            onClick={() => saveEditing(flag)}
                                                        >
                                                            Save
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            onClick={cancelEditing}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>
                                                    <strong>{flag.name}</strong>
                                                    {flag.description && (
                                                        <div className="muted">
                                                            {flag.description}
                                                        </div>
                                                    )}
                                                </td>

                                                <td>
                                                    <code>{flag.key}</code>
                                                </td>

                                                <td>
                                                    {flag.is_enabled_globally ? "Global" : "Limited"}
                                                </td>

                                                <td>{flag.rollout_percentage}%</td>

                                                <td>
                                                    {(flag.target_household_ids?.length || 0)} households /{" "}
                                                    {(flag.target_user_ids?.length || 0)} users
                                                </td>

                                                <td>
                                                    <div className="admin-button-row">
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            onClick={() => toggleGlobal(flag)}
                                                        >
                                                            {flag.is_enabled_globally
                                                                ? "Disable"
                                                                : "Enable"}
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            onClick={() => startEditing(flag)}
                                                        >
                                                            Edit
                                                        </Button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>
        </div>
    )
}