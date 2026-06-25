import { useEffect, useState } from "react"
import {
    createFamilyMember,
    createPendingInvite,
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

function getDefaultAvatar(role) {
    if (role === "parent") return "👤"
    if (role === "child") return "🧒"
    if (role === "pet") return "🐾"
    return "🌿"
}

function formatDate(dateString) {
    if (!dateString) return ""

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    })
}

function groupMembers(members) {
    return {
        parents: members.filter(member => member.role === "parent"),
        children: members.filter(member => member.role === "child"),
        pets: members.filter(member => member.role === "pet"),
        other: members.filter(
            member =>
                member.role !== "parent" &&
                member.role !== "child" &&
                member.role !== "pet"
        )
    }
}

function sortByName(members) {
    return [...members].sort((a, b) => a.name.localeCompare(b.name))
}

function FamilyMemberRow({ member, onEdit, onDelete }) {
    const details = []
    const isPendingInvite = member.invite_status === "pending"

    function getInviteLink() {
        if (!member.invite_token) return ""
        return `${window.location.origin}/invite/${member.invite_token}`
    }

    async function copyInviteLink() {
        const inviteLink = getInviteLink()

        if (!inviteLink) return

        await navigator.clipboard.writeText(inviteLink)
        alert("Invite link copied.")
    }

    if (member.role === "child") {
        if (member.school) details.push(member.school)
        if (member.grade) details.push(member.grade)
    }

    if (member.role === "pet") {
        if (member.species) details.push(member.species)
        if (member.breed) details.push(member.breed)
    }

    if (member.birthdate) {
        details.push(
            `${member.role === "pet" ? "Birthday / adoption" : "Birthday"}: ${formatDate(member.birthdate)}`
        )
    }

    return (
        <div className="family-command-row">
            <span className="family-avatar">
                {member.avatar_emoji || getDefaultAvatar(member.role)}
            </span>

            <div className="family-member-main">
                <strong>
                    {isPendingInvite ? "Invited Adult" : member.name}
                </strong>

                <p>
                    {getRoleLabel(member.role)}
                    {isPendingInvite && member.invite_email
                        ? ` • ${member.invite_email}`
                        : details.length > 0
                            ? ` • ${details.join(" • ")}`
                            : ""}
                </p>

                {member.notes && <small>{member.notes}</small>}

                {isPendingInvite && (
                    <div className="invite-status-row">
                        <span className="invite-pending-badge">
                            Invite Pending
                        </span>

                        {member.invite_token && (
                            <button
                                type="button"
                                className="invite-cancel-link"
                                onClick={copyInviteLink}
                            >
                                Copy Invite Link
                            </button>
                        )}

                        <button
                            type="button"
                            className="invite-cancel-link"
                            onClick={() => onDelete(member)}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {!isPendingInvite && (
                <div className="family-row-actions">
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={() => onEdit(member)}
                    >
                        Edit
                    </button>

                    <button
                        className="danger-button"
                        type="button"
                        onClick={() => onDelete(member)}
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    )
}

function FamilyGroup({ title, subtitle, members, emptyText, onEdit, onDelete }) {
    return (
        <section className="family-command-section">
            <div className="family-section-header">
                <div>
                    <h3>{title}</h3>
                    {subtitle && <p>{subtitle}</p>}
                </div>

                <span>{members.length}</span>
            </div>

            {members.length === 0 ? (
                <p className="dashboard-empty">{emptyText}</p>
            ) : (
                <div className="family-command-list">
                    {sortByName(members).map(member => (
                        <FamilyMemberRow
                            key={member.id}
                            member={member}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

export default function Family() {
    const [familyMembers, setFamilyMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviting, setInviting] = useState(false)

    const isChild = form.role === "child"
    const isPet = form.role === "pet"
    const groupedMembers = groupMembers(familyMembers)

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
        window.scrollTo({ top: 0, behavior: "smooth" })
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
            alert(error.message || "Could not save family member.")
        } finally {
            setSaving(false)
        }
    }

    async function handleInviteAdult() {
        if (!inviteEmail.trim()) return

        setInviting(true)

        try {
            const invite = await createPendingInvite(
                inviteEmail.trim().toLowerCase()
            )

            const inviteLink = `${window.location.origin}/invite/${invite.invite_token}`

            await navigator.clipboard.writeText(inviteLink)

            alert(
                "Invite created!\n\nThe invite link has been copied to your clipboard."
            )

            setInviteEmail("")
            await loadFamilyMembers()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not create invite.")
        } finally {
            setInviting(false)
        }
    }

    async function handleDelete(member) {
        const confirmed = window.confirm(
            member.invite_status === "pending"
                ? `Cancel invite for ${member.invite_email || member.name}?`
                : `Delete ${member.name}? This cannot be undone.`
        )

        if (!confirmed) return

        try {
            await deleteFamilyMember(member.id)
            await loadFamilyMembers()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not delete family member.")
        }
    }

    return (
        <div className="family-command-page">
            <header className="calendar-header family-command-header">
                <div>
                    <p className="dashboard-household-name">Family</p>
                    <h2>Family Members</h2>

                    <p className="family-header-summary">
                        {familyMembers.length} total •{" "}
                        {groupedMembers.parents.length} parents •{" "}
                        {groupedMembers.children.length} children •{" "}
                        {groupedMembers.pets.length} pets
                    </p>
                </div>

                <button
                    className="primary-button"
                    type="button"
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
            </header>

            <section className="card form-card">
                <h3>Invite Adult</h3>

                <p>
                    Invite a spouse, partner, or other adult to join your household.
                </p>

                <div className="form-grid">
                    <label className="full-width">
                        Email Address
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={event => setInviteEmail(event.target.value)}
                            placeholder="name@example.com"
                        />
                    </label>

                    <button
                        type="button"
                        className="primary-button full-width"
                        disabled={inviting || !inviteEmail.trim()}
                        onClick={handleInviteAdult}
                    >
                        {inviting ? "Creating Invite..." : "Create Invite"}
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
                                            updateForm("avatar_emoji", event.target.value)
                                        }
                                        placeholder={isPet ? "🐶" : "🧒"}
                                    />
                                </label>

                                <label>
                                    {isPet ? "Birthday / Adoption Date" : "Birthdate"}
                                    <input
                                        type="date"
                                        value={form.birthdate}
                                        onChange={event =>
                                            updateForm("birthdate", event.target.value)
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

            <section className="card family-command-card">
                {loading ? (
                    <p>Loading family members...</p>
                ) : familyMembers.length === 0 ? (
                    <p className="dashboard-empty">
                        No family members added yet.
                    </p>
                ) : (
                    <>
                        <FamilyGroup
                            title="Parents"
                            subtitle="Household adults."
                            members={groupedMembers.parents}
                            emptyText="No parents added yet."
                            onEdit={startEdit}
                            onDelete={handleDelete}
                        />

                        <FamilyGroup
                            title="Children"
                            subtitle="Kids, school details, and birthdays."
                            members={groupedMembers.children}
                            emptyText="No children added yet."
                            onEdit={startEdit}
                            onDelete={handleDelete}
                        />

                        <FamilyGroup
                            title="Pets"
                            subtitle="Pets, breeds, and adoption dates."
                            members={groupedMembers.pets}
                            emptyText="No pets added yet."
                            onEdit={startEdit}
                            onDelete={handleDelete}
                        />

                        {groupedMembers.other.length > 0 && (
                            <FamilyGroup
                                title="Other"
                                subtitle="Additional family members."
                                members={groupedMembers.other}
                                emptyText="No additional members."
                                onEdit={startEdit}
                                onDelete={handleDelete}
                            />
                        )}
                    </>
                )}
            </section>
        </div>
    )
}