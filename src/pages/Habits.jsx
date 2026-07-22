import {
    useEffect,
    useState
} from "react"

import {
    CheckCircle2,
    Plus
} from "lucide-react"

import AppPage from "../components/ui/AppPage"
import PageHeader from "../components/ui/PageHeader"
import Button from "../components/ui/Button"
import ConfirmActionSheet from "../components/ui/ConfirmActionSheet"
import EmptyState from "../components/ui/EmptyState"
import SectionCard from "../components/ui/SectionCard"
import ActionMenu from "../components/ui/ActionMenu"

import HabitFormSheet from "../components/habits/HabitFormSheet"
import HabitTemplateSheet from "../components/habits/HabitTemplateSheet"

import useHabits from "../hooks/useHabits"
import useHouseholdRole from "../hooks/useHouseholdRole"

import {
    archiveHabit,
    createHabit,
    deleteHabit,
    toggleHabitComplete,
    updateHabit
} from "../services/habitService"

import {
    getFamilyMembers
} from "../services/familyService"

import { supabase } from "../lib/supabase"

import {
    getHabitIcon
} from "../utils/habitIcons"

import {
    getHabitColor
} from "../utils/habitColors"

export default function Habits() {
    const {
        isTeen
    } = useHouseholdRole()

    const [familyMembers, setFamilyMembers] =
        useState([])

    const [householdId, setHouseholdId] =
        useState(null)

    const [currentUserId, setCurrentUserId] =
        useState(null)

    const [loadingMembers, setLoadingMembers] =
        useState(true)

    const [showForm, setShowForm] =
        useState(false)

    const [editingHabit, setEditingHabit] =
        useState(null)

    const [saving, setSaving] =
        useState(false)

    const [habitMenuOpen, setHabitMenuOpen] =
        useState(null)

    const [pendingAction, setPendingAction] =
        useState(null)

    const [confirmSaving, setConfirmSaving] =
        useState(false)

    const [templateSheetOpen, setTemplateSheetOpen] =
        useState(false)

    const [selectedTemplate, setSelectedTemplate] =
        useState(null)

    const {
        habits,
        completedToday,
        remainingToday,
        completionPercentage,
        loading,
        error,
        setTodayProgress,
        updateCountHabit,
        refreshHabits
    } = useHabits(householdId)

    const currentMember =
        familyMembers.find(
            member =>
                member.user_id ===
                currentUserId
        ) || null

    async function loadFamilyMembers() {
        try {
            setLoadingMembers(true)

            const {
                data: {
                    user
                },
                error: authError
            } =
                await supabase.auth.getUser()

            if (authError) {
                throw authError
            }

            const memberData =
                await getFamilyMembers()

            const members =
                memberData || []

            setCurrentUserId(
                user?.id || null
            )

            setFamilyMembers(
                members
            )

            setHouseholdId(
                members[0]
                    ?.household_id ||
                null
            )
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingMembers(false)
        }
    }

    useEffect(() => {
        loadFamilyMembers()
    }, [])

    function openHabitTemplateSheet() {
        setEditingHabit(null)
        setSelectedTemplate(null)
        setTemplateSheetOpen(true)
    }

    function openEditHabitForm(habit) {
        setEditingHabit(habit)
        setSelectedTemplate(null)
        setHabitMenuOpen(null)
        setShowForm(true)
    }

    function closeForm() {
        if (saving) return

        setShowForm(false)
        setEditingHabit(null)
        setSelectedTemplate(null)
    }

    async function handleSaveHabit(payload) {
        if (!householdId) {
            alert(
                "No household was found for this habit."
            )
            return
        }

        setSaving(true)

        try {
            if (editingHabit) {
                await updateHabit({
                    habitId: editingHabit.id,
                    updates: payload
                })
            } else {
                await createHabit({
                    ...payload,
                    household_id:
                        householdId
                })
            }

            await refreshHabits()

            setShowForm(false)
            setEditingHabit(null)
            setSelectedTemplate(null)
        } catch (error) {
            console.error(error)

            alert(
                error.message ||
                "Habit save failed."
            )
        } finally {
            setSaving(false)
        }
    }

    async function handleToggleComplete(habit) {
        const previousProgress =
            habit.todayProgress || null

        const nextComplete =
            !habit.completedToday

        const optimisticProgress = {
            ...(previousProgress || {}),
            habit_definition_id: habit.id,
            progress_date:
                new Date()
                    .toLocaleDateString("en-CA"),
            progress_value:
                nextComplete ? 1 : 0,
            is_complete:
                nextComplete,
            completed_at:
                nextComplete
                    ? new Date().toISOString()
                    : null
        }

        setTodayProgress(current => {
            const existingIndex =
                current.findIndex(
                    progress =>
                        progress.habit_definition_id ===
                        habit.id
                )

            if (existingIndex === -1) {
                return [
                    ...current,
                    optimisticProgress
                ]
            }

            return current.map(progress =>
                progress.habit_definition_id ===
                    habit.id
                    ? optimisticProgress
                    : progress
            )
        })

        try {
            const savedProgress =
                await toggleHabitComplete({
                    habit,
                    currentlyComplete:
                        habit.completedToday
                })

            setTodayProgress(current =>
                current.map(progress =>
                    progress.habit_definition_id ===
                        habit.id
                        ? savedProgress
                        : progress
                )
            )
        } catch (error) {
            console.error(error)

            setTodayProgress(current => {
                if (!previousProgress) {
                    return current.filter(
                        progress =>
                            progress.habit_definition_id !==
                            habit.id
                    )
                }

                return current.map(progress =>
                    progress.habit_definition_id ===
                        habit.id
                        ? previousProgress
                        : progress
                )
            })

            alert(
                error.message ||
                "Could not update this habit."
            )
        }
    }

    function requestArchiveHabit(habit) {
        setHabitMenuOpen(null)

        setPendingAction({
            type: "archive",
            habit
        })
    }

    function requestDeleteHabit(habit) {
        setHabitMenuOpen(null)

        setPendingAction({
            type: "delete",
            habit
        })
    }

    function closeConfirmation() {
        if (confirmSaving) return

        setPendingAction(null)
    }

    async function handleConfirmAction() {
        if (!pendingAction) return

        setConfirmSaving(true)

        try {
            if (
                pendingAction.type ===
                "archive"
            ) {
                await archiveHabit(
                    pendingAction.habit.id
                )
            }

            if (
                pendingAction.type ===
                "delete"
            ) {
                await deleteHabit(
                    pendingAction.habit.id
                )
            }

            await refreshHabits()
            setPendingAction(null)
        } catch (error) {
            console.error(error)

            alert(
                error.message ||
                `Could not ${pendingAction.type} this habit.`
            )
        } finally {
            setConfirmSaving(false)
        }
    }

    function getAssignedMember(habit) {
        if (
            habit.assigned_family_member
        ) {
            return (
                habit
                    .assigned_family_member
            )
        }

        if (habit.family_members) {
            return habit.family_members
        }

        return (
            familyMembers.find(
                member =>
                    member.id ===
                    habit
                        .assigned_family_member_id
            ) || null
        )
    }

    function getHabitGoalText(habit) {
        if (
            habit.goal_type === "count"
        ) {
            return `${habit.goal_value || 1} ${habit.goal_unit || ""}`.trim()
        }

        return "Once daily"
    }

    function isCountHabit(habit) {
        return habit.goal_type === "count"
    }

    function handleCreateCustomHabit() {
        setEditingHabit(null)
        setSelectedTemplate(null)
        setTemplateSheetOpen(false)
        setShowForm(true)
    }

    function handleSelectHabitTemplate(template) {
        setEditingHabit(null)
        setSelectedTemplate(template)
        setTemplateSheetOpen(false)
        setShowForm(true)
    }

    function closeTemplateSheet() {
        setTemplateSheetOpen(false)
        setSelectedTemplate(null)
    }

    const pageLoading =
        loadingMembers ||
        loading

    const subtitle =
        habits.length > 0
            ? `${completedToday.length} of ${habits.length} complete today`
            : "Build small routines that add up over time."

    return (
        <AppPage>
            <PageHeader
                eyebrow={
                    isTeen
                        ? "My Day"
                        : "Family"
                }
                title="Habits"
                subtitle={subtitle}
                action={
                    <Button
                        onClick={
                            openHabitTemplateSheet
                        }
                    >
                        <Plus size={17} />
                        Add
                    </Button>
                }
            />

            <div className="eg-stack">
                {error && (
                    <SectionCard>
                        <p className="dashboard-empty">
                            We couldn&apos;t load
                            your habits. Please try
                            again.
                        </p>
                    </SectionCard>
                )}

                {pageLoading ? (
                    <SectionCard>
                        <p>
                            Loading habits...
                        </p>
                    </SectionCard>
                ) : habits.length === 0 ? (
                    <SectionCard>
                        <EmptyState
                            title="No habits yet"
                            message="Add a habit you want to practice regularly."
                            action={
                                <Button
                                    onClick={
                                        openHabitTemplateSheet
                                    }
                                >
                                    <Plus
                                        size={17}
                                    />
                                    Add Your First
                                    Habit
                                </Button>
                            }
                        />
                    </SectionCard>
                ) : (
                    <>
                        <SectionCard>
                            <div className="eg-habit-summary">

                                <div>
                                    <p className="eg-section-eyebrow">
                                        Today's Progress
                                    </p>

                                    <h2>
                                        {completedToday.length} of {habits.length}
                                    </h2>

                                    <p className="dashboard-empty">
                                        {remainingToday.length === 0
                                            ? "Everything is complete."
                                            : `${remainingToday.length} remaining`}
                                    </p>
                                </div>

                                <strong className="eg-habit-progress-percent">
                                    {completionPercentage}%
                                </strong>

                            </div>

                            <div
                                className="eg-habit-progress-track"
                                aria-label={`${completionPercentage}% complete`}
                            >
                                <div
                                    className="eg-habit-progress-fill"
                                    style={{
                                        width: `${completionPercentage}%`
                                    }}
                                />
                            </div>
                        </SectionCard>

                        <SectionCard title="Your Habits">
                            <div className="eg-habit-list">
                                {habits.map(
                                    habit => {
                                        const Icon =
                                            getHabitIcon(
                                                habit.icon
                                            )

                                        const color =
                                            getHabitColor(
                                                habit.color
                                            )

                                        const assignedMember =
                                            getAssignedMember(
                                                habit
                                            )

                                        return (
                                            <div
                                                key={
                                                    habit.id
                                                }
                                                className={`eg-habit-row ${habit.completedToday
                                                    ? "complete"
                                                    : ""
                                                    }`}
                                            >
                                                <div
                                                    className={`
                                                        eg-habit-icon
                                                        ${color.className}
                                                    `}
                                                >
                                                    <Icon
                                                        size={
                                                            20
                                                        }
                                                    />
                                                </div>

                                                <div className="eg-habit-row-content">
                                                    <strong>
                                                        {
                                                            habit.name
                                                        }
                                                    </strong>

                                                    <p>
                                                        {assignedMember?.name || "Family member"}
                                                    </p>

                                                    <div className="eg-habit-meta">
                                                        <span>{getHabitGoalText(habit)}</span>

                                                        <span
                                                            className={
                                                                habit.completedToday
                                                                    ? "eg-habit-status complete"
                                                                    : "eg-habit-status"
                                                            }
                                                        >
                                                            {habit.completedToday
                                                                ? "Completed today"
                                                                : "Active"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="eg-habit-row-actions">
                                                    {isCountHabit(habit) ? (
                                                        <div
                                                            className="eg-habit-counter"
                                                            aria-label={`${habit.progressValue} of ${habit.goal_value || 1} ${habit.goal_unit || ""}`}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="eg-habit-counter-button"
                                                                disabled={
                                                                    habit.isUpdating ||
                                                                    habit.progressValue <= 0
                                                                }
                                                                onClick={() =>
                                                                    updateCountHabit(
                                                                        habit.id,
                                                                        -1
                                                                    )
                                                                }
                                                                aria-label={`Remove one ${habit.goal_unit || "item"} from ${habit.name}`}
                                                            >
                                                                −
                                                            </button>

                                                            <span className="eg-habit-counter-value">
                                                                {habit.progressValue}
                                                                <small>
                                                                    {" "}
                                                                    / {habit.goal_value || 1}
                                                                </small>
                                                            </span>

                                                            <button
                                                                type="button"
                                                                className="eg-habit-counter-button"
                                                                disabled={habit.isUpdating}
                                                                onClick={() =>
                                                                    updateCountHabit(
                                                                        habit.id,
                                                                        1
                                                                    )
                                                                }
                                                                aria-label={`Add one ${habit.goal_unit || "item"} to ${habit.name}`}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className={`eg-habit-check ${habit.completedToday
                                                                ? "complete"
                                                                : ""
                                                                }`}
                                                            onClick={() =>
                                                                handleToggleComplete(habit)
                                                            }
                                                            aria-label={
                                                                habit.completedToday
                                                                    ? `Mark ${habit.name} incomplete`
                                                                    : `Complete ${habit.name}`
                                                            }
                                                        >
                                                            {habit.completedToday && (
                                                                <CheckCircle2 size={19} />
                                                            )}
                                                        </button>
                                                    )}

                                                    <ActionMenu
                                                        title={habit.name}
                                                        open={
                                                            habitMenuOpen ===
                                                            habit.id
                                                        }
                                                        onOpenChange={
                                                            isOpen =>
                                                                setHabitMenuOpen(
                                                                    isOpen
                                                                        ? habit.id
                                                                        : null
                                                                )
                                                        }
                                                        ariaLabel={`Manage ${habit.name}`}
                                                        actions={[
                                                            {
                                                                label: "Edit",
                                                                onClick: () =>
                                                                    openEditHabitForm(
                                                                        habit
                                                                    )
                                                            },
                                                            {
                                                                label: "Archive",
                                                                onClick: () =>
                                                                    requestArchiveHabit(
                                                                        habit
                                                                    )
                                                            },
                                                            {
                                                                label: "Delete",
                                                                danger: true,
                                                                onClick: () =>
                                                                    requestDeleteHabit(
                                                                        habit
                                                                    )
                                                            }
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    }
                                )}
                            </div>
                        </SectionCard>
                    </>
                )}
            </div>

            <HabitFormSheet
                open={showForm}
                habit={editingHabit}
                template={selectedTemplate}
                familyMembers={
                    familyMembers
                }
                currentMemberId={
                    currentMember?.id ||
                    null
                }
                isTeen={isTeen}
                saving={saving}
                onClose={closeForm}
                onSave={
                    handleSaveHabit
                }
            />

            <HabitTemplateSheet
                open={templateSheetOpen}
                onClose={closeTemplateSheet}
                onCreateCustom={handleCreateCustomHabit}
                onSelectTemplate={handleSelectHabitTemplate}
            />

            <ConfirmActionSheet
                open={Boolean(pendingAction)}
                title={
                    pendingAction?.type ===
                        "delete"
                        ? "Delete Habit"
                        : "Archive Habit"
                }
                itemName={
                    pendingAction?.habit?.name
                }
                message={
                    pendingAction?.type ===
                        "delete"
                        ? "This permanently deletes the habit and its progress history. This action cannot be undone."
                        : "This habit will be removed from your active list. You can restore it later."
                }
                confirmLabel={
                    pendingAction?.type ===
                        "delete"
                        ? "Delete"
                        : "Archive"
                }
                variant={
                    pendingAction?.type ===
                        "delete"
                        ? "danger"
                        : "archive"
                }
                saving={confirmSaving}
                onClose={closeConfirmation}
                onConfirm={handleConfirmAction}
            />
        </AppPage>
    )
}