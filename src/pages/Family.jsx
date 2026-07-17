import { useEffect, useState } from "react"
import {
    createFamilyMember,
    createPendingInvite,
    deleteFamilyMember,
    getFamilyMembers,
    sendHouseholdInviteEmail,
    updateFamilyMember
} from "../services/familyService"

import AppPage from "../components/ui/AppPage"
import PageHeader from "../components/ui/PageHeader"
import SectionCard from "../components/ui/SectionCard"
import Button from "../components/ui/Button"
import InsightCard from "../components/dashboard/InsightCard"
import ActionMenu from "../components/ui/ActionMenu"
import BottomSheet from "../components/ui/BottomSheet"
import {
    ArrowLeft,
    ChevronRight,
    X
} from "lucide-react"

import Avatar from "../components/ui/Avatar"
import {
    promptForAvatarUpload,
    deleteFamilyAvatar
} from "../services/avatarService"

import {
    getPreferences,
    updatePreferences
} from "../services/preferenceService"

import ShareEvergroveCard from "../components/referrals/ShareEvergroveCard"
import useHouseholdRole from "../hooks/useHouseholdRole"

import AddAdultForm from "../components/family/AddAdultForm"
import AddChildForm from "../components/family/AddChildForm"

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

const defaultShoppingCategoryOrder = [
    "Produce",
    "Meat",
    "Dairy",
    "Frozen",
    "Pantry",
    "Household",
    "Uncategorized"
]

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

function FamilyMemberRow({
    member,
    onEdit,
    onDelete,
    onUploadAvatar,
    onDeleteAvatar,
    familyMenuOpen,
    setFamilyMenuOpen,
    isAdult
}) {
    const details = []
    const isPendingInvite = member.invite_status === "pending"
    const isTeenAccount =
        member.member_type === "teen"

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
            <Avatar
                member={{
                    ...member,
                    avatar_emoji:
                        member.avatar_emoji || getDefaultAvatar(member.role)
                }}
                size="md"
            />

            <div className="family-member-main">
                <strong>
                    {member.name ||
                        (member.member_type === "teen"
                            ? "Invited Teen"
                            : "Invited Adult")}
                </strong>

                <p>
                    {[
                        getRoleLabel(member.role),
                        isTeenAccount ? "Teen Account" : null,
                        isPendingInvite
                            ? member.invite_email
                            : null,
                        ...details
                    ]
                        .filter(Boolean)
                        .join(" • ")}
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
                    {isAdult && (
                        <ActionMenu
                            title={member.name}
                            open={familyMenuOpen === member.id}
                            onOpenChange={isOpen =>
                                setFamilyMenuOpen(isOpen ? member.id : null)
                            }
                            ariaLabel="Open family member actions"
                            actions={[
                                {
                                    label: "Change Photo",
                                    onClick: () => onUploadAvatar(member)
                                },
                                {
                                    label: "Remove Photo",
                                    danger: true,
                                    onClick: () => onDeleteAvatar(member)
                                },
                                {
                                    label: "Edit",
                                    onClick: () => onEdit(member)
                                },
                                {
                                    label: "Delete",
                                    danger: true,
                                    onClick: () => onDelete(member)
                                }
                            ]}
                        />
                    )}
                </div>

            )}
        </div>
    )
}

function FamilyGroup({
    title,
    subtitle,
    members,
    emptyText,
    onEdit,
    onDelete,
    onUploadAvatar,
    onDeleteAvatar,
    familyMenuOpen,
    setFamilyMenuOpen,
    isAdult
}) {
    return (
        <SectionCard
            title={title}
            subtitle={subtitle}
            count={members.length}
        >
            {members.length === 0 ? (
                <p className="dashboard-empty">{emptyText}</p>
            ) : (
                <div className="eg-stack">
                    {sortByName(members).map(member => (
                        <FamilyMemberRow
                            key={member.id}
                            member={member}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onUploadAvatar={onUploadAvatar}
                            onDeleteAvatar={onDeleteAvatar}
                            familyMenuOpen={familyMenuOpen}
                            setFamilyMenuOpen={setFamilyMenuOpen}
                            isAdult={isAdult}
                        />
                    ))}
                </div>
            )}
        </SectionCard>
    )
}

export default function Family() {
    const [familyMembers, setFamilyMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [addPersonStep, setAddPersonStep] = useState("choose")
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [inviting, setInviting] = useState(false)

    const [adultInvite, setAdultInvite] = useState({
        email: "",
        name: ""
    })

    const [childForm, setChildForm] = useState({
        name: "",
        hasAccount: "no",
        email: "",
        avatar_emoji: "",
        birthdate: "",
        school: "",
        grade: "",
        notes: ""
    })

    const [familyMenuOpen, setFamilyMenuOpen] = useState(null)
    const [householdSettingsOpen, setHouseholdSettingsOpen] = useState(false)

    const isChild = form.role === "child"
    const isPet = form.role === "pet"
    const groupedMembers = groupMembers(familyMembers)
    const hasChildren =
        groupedMembers.children.length > 0
    const hasPets =
        groupedMembers.pets.length > 0

    const [preferences, setPreferences] = useState({
        household_name: "My Family",
        timezone: "America/Chicago",
        week_starts_on: "Sunday",
        shopping_category_order: defaultShoppingCategoryOrder
    })

    const {
        isAdult,
        isTeen
    } = useHouseholdRole()

    const [shoppingCategoriesOpen, setShoppingCategoriesOpen] = useState(false)

    const [savingPreferences, setSavingPreferences] = useState(false)

    async function loadFamilyMembers() {
        try {
            setLoading(true)
            const [members, savedPreferences] = await Promise.all([
                getFamilyMembers(),
                getPreferences()
            ])

            setFamilyMembers(members)

            setPreferences(current => ({
                ...current,
                ...savedPreferences
            }))
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFamilyMembers()
    }, [])

    async function handleUploadAvatar(member) {
        try {
            const uploaded = await promptForAvatarUpload(member.id)

            if (uploaded) {
                await loadFamilyMembers()
            }
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not upload avatar.")
        }
    }

    async function handleDeleteAvatar(member) {
        const confirmed = window.confirm(`Remove photo for ${member.name}?`)
        if (!confirmed) return

        try {
            await deleteFamilyAvatar(member.id)
            await loadFamilyMembers()
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not remove avatar.")
        }
    }

    async function handleAdultInviteSubmit(event) {
        event.preventDefault()

        if (!adultInvite.email.trim()) return

        setInviting(true)

        try {
            const invite = await createPendingInvite(
                adultInvite.email.trim().toLowerCase(),
                "adult",
                {
                    name: adultInvite.name
                }
            )

            await sendHouseholdInviteEmail(invite.id)

            alert(
                `Invitation sent to ${invite.invite_email}.`
            )

            setAdultInvite({
                email: "",
                name: ""
            })

            resetForm()
            await loadFamilyMembers()
        } catch (error) {
            console.error(error)
            alert(
                error.message ||
                "The invitation was created, but the email could not be sent. You can copy the invite link from the pending invitation."
            )
        } finally {
            setInviting(false)
        }
    }

    async function handleChildSubmit(event) {
        event.preventDefault()

        const hasAccount = childForm.hasAccount === "yes"

        setSaving(true)

        try {
            if (hasAccount) {
                const invite = await createPendingInvite(
                    childForm.email.trim().toLowerCase(),
                    "teen",
                    {
                        name: childForm.name,
                        birthdate: childForm.birthdate
                    }
                )

                await sendHouseholdInviteEmail(invite.id)
            } else {
                await createFamilyMember({
                    name: childForm.name.trim(),
                    role: "child",
                    avatar_emoji: childForm.avatar_emoji,
                    birthdate: childForm.birthdate || null,
                    school: childForm.school || null,
                    grade: childForm.grade || null,
                    species: null,
                    breed: null,
                    notes: childForm.notes
                })
            }

            resetForm()
            await loadFamilyMembers()

            alert(
                hasAccount
                    ? `Invitation sent to ${childForm.email.trim().toLowerCase()}.`
                    : "Child added."
            )
        } catch (error) {
            console.error(error)
            alert(
                error.message ||
                (hasAccount
                    ? "The teen invitation was created, but the email could not be sent. You can copy the invite link from the pending invitation."
                    : "Could not add child.")
            )
        } finally {
            setSaving(false)
        }
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

    function updatePreference(field, value) {
        setPreferences(current => ({
            ...current,
            [field]: value
        }))
    }

    function resetForm() {
        setForm(initialForm)
        setEditingId(null)
        setAddPersonStep("choose")
        setShowForm(false)
    }

    function returnToPersonChooser() {
        setForm(initialForm)

        setAdultInvite({
            email: "",
            name: ""
        })

        setChildForm({
            name: "",
            hasAccount: "no",
            email: "",
            avatar_emoji: "",
            birthdate: "",
            school: "",
            grade: "",
            notes: ""
        })

        setAddPersonStep("choose")
    }

    function startEdit(member) {
        setEditingId(member.id)
        setForm(normalizeMember(member))
        setAddPersonStep(member.role)
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
            alert(error.message || "Could not save family member.")
        } finally {
            setSaving(false)
        }
    }

    async function handleSaveHouseholdSettings(event) {
        event.preventDefault()
        setSavingPreferences(true)

        try {
            const savedPreferences = await updatePreferences({
                household_name: preferences.household_name,
                timezone: preferences.timezone,
                week_starts_on: preferences.week_starts_on,
                shopping_category_order: preferences.shopping_category_order
            })

            setPreferences(current => ({
                ...current,
                ...savedPreferences
            }))

            alert("Household settings saved.")
        } catch (error) {
            console.error(error)
            alert(error.message || "Could not save household settings.")
        } finally {
            setSavingPreferences(false)
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
        <AppPage>
            <PageHeader
                eyebrow="Household"
                title="Household Management"
                subtitle={[
                    `${familyMembers.length} total`,
                    `${groupedMembers.parents.length} parents`,
                    hasChildren
                        ? `${groupedMembers.children.length} children & teens`
                        : null,
                    groupedMembers.pets.length > 0
                        ? `${groupedMembers.pets.length} pets`
                        : null
                ]
                    .filter(Boolean)
                    .join(" • ")}
                action={
                    isAdult && (
                        <Button
                            onClick={() => {
                                setAddPersonStep("choose")
                                setShowForm(true)
                            }}
                        >
                            + Add Person
                        </Button>
                    )
                }
            />

            <div className="eg-stack">

                <SectionCard
                    title="Household"
                    subtitle={[
                        "Household members",
                        hasChildren ? "children and teens" : null,
                        hasPets ? "pets" : null,
                        "pending invitations"
                    ]
                        .filter(Boolean)
                        .join(", ")}
                >
                    {loading ? (
                        <p>Loading family members...</p>
                    ) : familyMembers.length === 0 ? (
                        <p className="dashboard-empty">
                            No family members added yet.
                        </p>
                    ) : (
                        <div className="eg-stack">
                            <FamilyGroup
                                title="Parents"
                                subtitle="Household adults."
                                members={groupedMembers.parents}
                                emptyText="No parents added yet."
                                onEdit={startEdit}
                                onDelete={handleDelete}
                                onUploadAvatar={handleUploadAvatar}
                                onDeleteAvatar={handleDeleteAvatar}
                                familyMenuOpen={familyMenuOpen}
                                setFamilyMenuOpen={setFamilyMenuOpen}
                                isAdult={isAdult}
                            />

                            {hasChildren && (
                                <FamilyGroup
                                    title="Children & Teens"
                                    subtitle="Kids, teen accounts, school details, and birthdays."
                                    members={groupedMembers.children}
                                    emptyText="No children or teens added yet."
                                    onEdit={startEdit}
                                    onDelete={handleDelete}
                                    onUploadAvatar={handleUploadAvatar}
                                    onDeleteAvatar={handleDeleteAvatar}
                                    familyMenuOpen={familyMenuOpen}
                                    setFamilyMenuOpen={setFamilyMenuOpen}
                                    isAdult={isAdult}
                                />
                            )}

                            {hasPets && (
                                <FamilyGroup
                                    title="Pets"
                                    subtitle="Pets, breeds, and adoption dates."
                                    members={groupedMembers.pets}
                                    emptyText="No pets added yet."
                                    onEdit={startEdit}
                                    onDelete={handleDelete}
                                    onUploadAvatar={handleUploadAvatar}
                                    onDeleteAvatar={handleDeleteAvatar}
                                    familyMenuOpen={familyMenuOpen}
                                    setFamilyMenuOpen={setFamilyMenuOpen}
                                    isAdult={isAdult}
                                />
                            )}

                            {groupedMembers.other.length > 0 && (
                                <FamilyGroup
                                    title="Other"
                                    subtitle="Additional family members."
                                    members={groupedMembers.other}
                                    emptyText="No additional members."
                                    onEdit={startEdit}
                                    onDelete={handleDelete}
                                    onUploadAvatar={handleUploadAvatar}
                                    onDeleteAvatar={handleDeleteAvatar}
                                    familyMenuOpen={familyMenuOpen}
                                    setFamilyMenuOpen={setFamilyMenuOpen}
                                    isAdult={isAdult}
                                />
                            )}
                        </div>
                    )}
                </SectionCard>

                {isAdult && (
                    <SectionCard
                        title="Household Settings"
                        subtitle="Shared settings for everyone in this household."
                    >
                        <button
                            type="button"
                            className="eg-collapsible-row"
                            onClick={() =>
                                setHouseholdSettingsOpen(current => !current)
                            }
                        >
                            <span>
                                Household name, time zone, and week settings
                            </span>

                            <strong>
                                {householdSettingsOpen ? "Hide" : "Manage"}
                            </strong>
                        </button>

                        {householdSettingsOpen && (
                            <form className="form-grid" onSubmit={handleSaveHouseholdSettings}>
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

                                <Button
                                    className="full-width"
                                    type="submit"
                                    disabled={savingPreferences}
                                >
                                    {savingPreferences ? "Saving..." : "Save Household Settings"}
                                </Button>
                            </form>
                        )}
                    </SectionCard>
                )}

                {isAdult && (
                    <SectionCard
                        title="Shopping Categories"
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
                    </SectionCard>
                )}

                <BottomSheet
                    open={showForm}
                    onClose={resetForm}
                >
                    <div className="eg-sheet-content">
                        <div className="eg-sheet-header">
                            <div>
                                <h2>
                                    {editingId
                                        ? "Edit Family Member"
                                        : addPersonStep === "choose"
                                            ? "Add Person"
                                            : addPersonStep === "adult"
                                                ? "Add Adult"
                                                : addPersonStep === "child"
                                                    ? "Add Child"
                                                    : "Add Pet"}
                                </h2>

                                <p>
                                    {editingId
                                        ? "Update this household member."
                                        : addPersonStep === "choose"
                                            ? "Who are you adding to your household?"
                                            : addPersonStep === "adult"
                                                ? "Invite another adult to join Evergrove."
                                                : addPersonStep === "child"
                                                    ? "Add a child or create an account for someone age 13 or older."
                                                    : "Add a pet to your household."}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="eg-sheet-close"
                                onClick={resetForm}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {!editingId && addPersonStep !== "choose" && (
                            <button
                                type="button"
                                className="eg-sheet-back"
                                onClick={returnToPersonChooser}
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                        )}

                        {!editingId && addPersonStep === "choose" && (
                            <div className="eg-stack">
                                <button
                                    type="button"
                                    className="eg-person-type-row"
                                    onClick={() => {
                                        updateForm("role", "parent")
                                        setAddPersonStep("adult")
                                    }}
                                >
                                    <span className="eg-person-type-icon">
                                        👨
                                    </span>

                                    <span className="eg-person-type-copy">
                                        <strong>Adult</strong>
                                        <small>
                                            Invite a spouse, partner, or other adult.
                                        </small>
                                    </span>

                                    <ChevronRight size={20} />
                                </button>

                                <button
                                    type="button"
                                    className="eg-person-type-row"
                                    onClick={() => {
                                        updateForm("role", "child")
                                        setAddPersonStep("child")
                                    }}
                                >
                                    <span className="eg-person-type-icon">
                                        🧒
                                    </span>

                                    <span className="eg-person-type-copy">
                                        <strong>Child</strong>
                                        <small>
                                            Add a child or create an account for a teen.
                                        </small>
                                    </span>

                                    <ChevronRight size={20} />
                                </button>

                                <button
                                    type="button"
                                    className="eg-person-type-row"
                                    onClick={() => {
                                        updateForm("role", "pet")
                                        setAddPersonStep("pet")
                                    }}
                                >
                                    <span className="eg-person-type-icon">
                                        🐶
                                    </span>

                                    <span className="eg-person-type-copy">
                                        <strong>Pet</strong>
                                        <small>
                                            Add a pet to your household.
                                        </small>
                                    </span>

                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {!editingId && addPersonStep === "adult" && (
                            <AddAdultForm
                                value={adultInvite}
                                onChange={setAdultInvite}
                                onSubmit={handleAdultInviteSubmit}
                                inviting={inviting}
                            />
                        )}

                        {!editingId && addPersonStep === "child" && (
                            <AddChildForm
                                value={childForm}
                                onChange={setChildForm}
                                onSubmit={handleChildSubmit}
                                saving={saving}
                            />
                        )}

                        {(
                            editingId ||
                            addPersonStep === "pet"
                        ) && (
                                <form
                                    className="form-grid"
                                    onSubmit={handleSubmit}
                                >
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
                                                    placeholder={isPet ? "🐶" : "🧒"}
                                                />
                                            </label>

                                            <label>
                                                {isPet
                                                    ? "Birthday / Adoption Date"
                                                    : "Birthdate"}
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
                                                        updateForm(
                                                            "school",
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </label>

                                            <label>
                                                Grade
                                                <input
                                                    value={form.grade}
                                                    onChange={event =>
                                                        updateForm(
                                                            "grade",
                                                            event.target.value
                                                        )
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
                                                        updateForm(
                                                            "species",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Dog, cat, rabbit..."
                                                />
                                            </label>

                                            <label>
                                                Breed
                                                <input
                                                    value={form.breed}
                                                    onChange={event =>
                                                        updateForm(
                                                            "breed",
                                                            event.target.value
                                                        )
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
                                                    updateForm(
                                                        "notes",
                                                        event.target.value
                                                    )
                                                }
                                                rows="3"
                                            />
                                        </label>
                                    )}

                                    <Button
                                        className="full-width"
                                        type="submit"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Saving..."
                                            : editingId
                                                ? "Save Changes"
                                                : "Save Family Member"}
                                    </Button>
                                </form>
                            )}
                    </div>
                </BottomSheet>

                <ShareEvergroveCard />
            </div>
        </AppPage>
    )
}