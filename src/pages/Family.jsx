import { useEffect, useState } from "react"
import {
    createFamilyMember,
    deleteFamilyMember,
    getFamilyMembers,
    updateFamilyMember
} from "../services/familyService"

const initialForm = {
    name: "",
    role: "",
    avatar_emoji: "",
    birthdate: "",
    school: "",
    grade: "",
    species: "",
    breed: "",
    notes: ""
}

function normalizeMember(member) {
    return {
        name: member.name || "",
        role: member.role || "",
        avatar_emoji: member.avatar_emoji || "",
        birthdate: member.birthdate || "",
        school: member.school || "",
        grade: member.grade || "",
        species: member.species || "",
        breed: member.breed || "",
        notes: member.notes || ""
    }
}

function getRoleLabel(role) {
    if (role === "parent") return "Parent"
    if (role === "child") return "Child"
    if (role === "pet") return "Pet"
    return "Family member"
}

export default function Family() {
    const [familyMembers, setFamilyMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState(null)

    const isChild = form.role === "child"
    const isPet = form.role === "pet"

    async function loadFamilyMembers() {
        try {
            setLoading(true)
            const members = await getFamilyMembers()
            setFamilyMembers(members)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFamilyMembers()
    }, [])

    function updateForm(field, value) {
        setForm(current => {
            const nextForm = {
                ...current,
                [field]: value
            }

            if (field === "role") {
                if (value === "child") {
                    nextForm.species = ""
                    nextForm.breed = ""
                }

                if (value === "pet") {
                    nextForm.school = ""
                    nextForm.grade = ""
                }

                if (value === "parent" || value === "") {
                    nextForm.school = ""
                    nextForm.grade = ""
                    nextForm.species = ""
                    nextForm.breed = ""
                }
            }

            return nextForm
        })
    }

    function resetForm() {
        setForm(initialForm)
        setEditingId(null)
        setShowForm(false)
    }

    function startEdit(member) {
        setEditingId(member.id)
        setForm(normalizeMember(member))
        setShowForm(true)
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)

        const payload = {
            ...form,
            birthdate: form.birthdate || null,
            school: form.role === "child" ? form.school : null,
            grade: form.role === "child" ? form.grade : null,
            species: form.role === "pet" ? form.species : null,
            breed: form.role === "pet" ? form.breed : null
        }

        try {
            if (editingId) {
                await updateFamilyMember(editingId, payload)
            } else {
                await createFamilyMember(payload)
            }

            resetForm()
            await loadFamilyMembers()
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(member) {
        const confirmed = window.confirm(
            `Delete ${member.name}? This cannot be undone.`
        )

        if (!confirmed) return

        try {
            await deleteFamilyMember(member.id)
            await loadFamilyMembers()
        } catch (error) {
            console.error(error)
        }
    }

    const sortedMembers = [...familyMembers].sort((a, b) => {
        const roleOrder = {
            parent: 1,
            child: 2,
            pet: 3
        }

        const aOrder = roleOrder[a.role] || 99
        const bOrder = roleOrder[b.role] || 99

        if (aOrder !== bOrder) {
            return aOrder - bOrder
        }

        return a.name.localeCompare(b.name)
    })

    return (
        <>
            <section className="hero-card">
                <div className="section-header">
                    <div>
                        <p className="eyebrow">Family</p>
                        <h2>Family Members</h2>
                        <p>
                            Add parents, kids, pets, schools, grades, and important
                            family details.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={() => {
                            if (showForm) {
                                resetForm()
                            } else {
                                setShowForm(true)
                            }
                        }}
                    >
                        {showForm ? "Cancel" : "+ Add Family Member"}
                    </button>
                </div>
            </section>

            {showForm && (
                <section className="card form-card">
                    <h3>{editingId ? "Edit Family Member" : "Add Family Member"}</h3>

                    <form className="form-grid" onSubmit={handleSubmit}>
                        <label>
                            Name
                            <input
                                value={form.name}
                                onChange={event =>
                                    updateForm("name", event.target.value)
                                }
                                required
                            />
                        </label>

                        <label>
                            Role
                            <select
                                value={form.role}
                                onChange={event =>
                                    updateForm("role", event.target.value)
                                }
                                required
                            >
                                <option value="">Select Role</option>
                                <option value="parent">Parent</option>
                                <option value="child">Child</option>
                                <option value="pet">Pet</option>
                            </select>
                        </label>

                        {form.role && (
                            <>
                                <label>
                                    Avatar Emoji
                                    <input
                                        value={form.avatar_emoji}
                                        onChange={event =>
                                            updateForm(
                                                "avatar_emoji",
                                                event.target.value
                                            )
                                        }
                                        placeholder={isPet ? "🐶" : "🏀"}
                                    />
                                </label>

                                <label>
                                    {isPet ? "Birthday / Adoption Date" : "Birthdate"}
                                    <input
                                        type="date"
                                        value={form.birthdate}
                                        onChange={event =>
                                            updateForm(
                                                "birthdate",
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>
                            </>
                        )}

                        {isChild && (
                            <>
                                <label>
                                    School
                                    <input
                                        value={form.school}
                                        onChange={event =>
                                            updateForm("school", event.target.value)
                                        }
                                    />
                                </label>

                                <label>
                                    Grade
                                    <input
                                        value={form.grade}
                                        onChange={event =>
                                            updateForm("grade", event.target.value)
                                        }
                                    />
                                </label>
                            </>
                        )}

                        {isPet && (
                            <>
                                <label>
                                    Species
                                    <input
                                        value={form.species}
                                        onChange={event =>
                                            updateForm("species", event.target.value)
                                        }
                                        placeholder="Dog, cat, rabbit..."
                                    />
                                </label>

                                <label>
                                    Breed
                                    <input
                                        value={form.breed}
                                        onChange={event =>
                                            updateForm("breed", event.target.value)
                                        }
                                        placeholder="Golden Retriever, Tabby..."
                                    />
                                </label>
                            </>
                        )}

                        {form.role && (
                            <label className="full-width">
                                Notes
                                <textarea
                                    value={form.notes}
                                    onChange={event =>
                                        updateForm("notes", event.target.value)
                                    }
                                    rows="3"
                                />
                            </label>
                        )}

                        <button
                            className="primary-button full-width"
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Save Changes"
                                    : "Save Family Member"}
                        </button>
                    </form>
                </section>
            )}

            <div className="grid">
                {loading ? (
                    <section className="card">
                        <p>Loading family members...</p>
                    </section>
                ) : familyMembers.length === 0 ? (
                    <section className="card">
                        <p>No family members added yet.</p>
                    </section>
                ) : (
                    sortedMembers.map(member => (
                        <section className="card" key={member.id}>
                            <div className="member-header">
                                <span className="avatar">
                                    {member.avatar_emoji || "🌿"}
                                </span>

                                <div>
                                    <h3>{member.name}</h3>
                                    <p>{getRoleLabel(member.role)}</p>
                                </div>
                            </div>

                            {member.role === "child" && (
                                <>
                                    <p>{member.school || "No school listed"}</p>
                                    <p>{member.grade || "No grade listed"}</p>
                                </>
                            )}

                            {member.role === "pet" && (
                                <>
                                    <p>{member.species || "No species listed"}</p>
                                    <p>{member.breed || "No breed listed"}</p>
                                </>
                            )}

                            {member.birthdate && (
                                <p>
                                    {member.role === "pet"
                                        ? "Birthday / Adoption Date"
                                        : "Birthdate"}
                                    : {member.birthdate}
                                </p>
                            )}

                            {member.notes && <p>{member.notes}</p>}

                            <div className="card-actions">
                                <button
                                    className="secondary-button"
                                    onClick={() => startEdit(member)}
                                >
                                    Edit
                                </button>

                                <button
                                    className="danger-button"
                                    onClick={() => handleDelete(member)}
                                >
                                    Delete
                                </button>
                            </div>
                        </section>
                    ))
                )}
            </div>
        </>
    )
}