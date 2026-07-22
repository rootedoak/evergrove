import {
    useEffect,
    useState
} from "react"

import BottomSheet from "../ui/BottomSheet"
import SectionCard from "../ui/SectionCard"
import FormSection from "../ui/FormSection"
import TextField from "../ui/TextField"
import TextAreaField from "../ui/TextAreaField"
import SelectField from "../ui/SelectField"
import Button from "../ui/Button"

import {
    getHabitDefaults
} from "../../utils/habitDefaults"

const initialForm = {
    name: "",
    description: "",
    assigned_family_member_id: "",
    frequency_type: "daily",
    goal_type: "checkbox",
    goal_value: 1,
    goal_unit: "",
    reminder_enabled: false,
    reminder_time: "",
    streak_enabled: true
}

function normalizeHabit(habit) {
    if (!habit) {
        return {
            ...initialForm
        }
    }

    return {
        name: habit.name || "",
        description: habit.description || "",
        assigned_family_member_id:
            habit.assigned_family_member_id || "",
        frequency_type:
            habit.frequency_type || "daily",
        goal_type:
            habit.goal_type || "checkbox",
        goal_value:
            Number(habit.goal_value || 1),
        goal_unit:
            habit.goal_unit || "",
        reminder_enabled:
            Boolean(habit.reminder_enabled),
        reminder_time:
            habit.reminder_time || "",
        streak_enabled:
            habit.streak_enabled !== false
    }
}

function normalizeTemplate(template) {
    if (!template) {
        return {
            ...initialForm
        }
    }

    const goalType =
        template.goalType === "count"
            ? "count"
            : "checkbox"

    return {
        ...initialForm,
        name: template.name || "",
        description:
            template.description || "",
        frequency_type:
            template.frequencyType ||
            template.frequency_type ||
            "daily",
        goal_type: goalType,
        goal_value:
            goalType === "count"
                ? Number(
                    template.targetCount ||
                    template.goalValue ||
                    1
                )
                : 1,
        goal_unit:
            template.goalUnit ||
            template.goal_unit ||
            ""
    }
}

export default function HabitFormSheet({
    open,
    habit,
    template,
    familyMembers = [],
    currentMemberId,
    isTeen,
    saving,
    onClose,
    onSave
}) {
    const [form, setForm] =
        useState(initialForm)

    const [formError, setFormError] =
        useState("")

    useEffect(() => {
        if (!open) return

        const normalized = habit
            ? normalizeHabit(habit)
            : normalizeTemplate(template)

        if (
            !habit &&
            isTeen &&
            currentMemberId
        ) {
            normalized.assigned_family_member_id =
                currentMemberId
        }

        setFormError("")

        setForm(normalized)
    }, [
        habit,
        template,
        isTeen,
        currentMemberId,
        open
    ])

    function updateForm(field, value) {
        setForm(current => ({
            ...current,
            [field]: value
        }))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setFormError("")

        const name =
            form.name.trim()

        const assignedMemberId =
            form.assigned_family_member_id ||
            currentMemberId ||
            null

        const goalValue =
            Number(form.goal_value)

        const goalUnit =
            form.goal_unit.trim()

        if (!name) {
            setFormError(
                "Enter a name for this habit."
            )
            return
        }

        if (
            !isTeen &&
            !assignedMemberId
        ) {
            setFormError(
                "Select a family member."
            )
            return
        }

        if (
            form.goal_type === "count" &&
            (
                !Number.isFinite(goalValue) ||
                goalValue < 1
            )
        ) {
            setFormError(
                "Enter a daily goal of at least 1."
            )
            return
        }

        if (
            form.goal_type === "count" &&
            !goalUnit
        ) {
            setFormError(
                "Enter a unit such as glasses, minutes, or pages."
            )
            return
        }

        if (
            form.reminder_enabled &&
            !form.reminder_time
        ) {
            setFormError(
                "Select a reminder time."
            )
            return
        }

        const defaults =
            getHabitDefaults(name)

        const payload = {
            name,
            description:
                form.description.trim() ||
                null,
            assigned_family_member_id:
                assignedMemberId,
            icon:
                habit?.icon ||
                template?.iconKey ||
                defaults.icon,
            color:
                habit?.color ||
                template?.color ||
                defaults.color,
            frequency_type:
                form.frequency_type,
            days_of_week: null,
            goal_type:
                form.goal_type,
            goal_value:
                form.goal_type ===
                    "checkbox"
                    ? 1
                    : goalValue,
            goal_unit:
                form.goal_type ===
                    "checkbox"
                    ? null
                    : goalUnit,
            reminder_enabled:
                form.reminder_enabled,
            reminder_time:
                form.reminder_enabled
                    ? form.reminder_time
                    : null,
            streak_enabled:
                form.streak_enabled
        }

        try {
            await onSave(payload)
        } catch (error) {
            console.error(error)

            setFormError(
                error?.message ||
                "Habit save failed."
            )
        }
    }

    return (
        <BottomSheet
            open={open}
            onClose={onClose}
        >
            <SectionCard
                title={
                    habit
                        ? "Edit Habit"
                        : "Add Habit"
                }
            >
                <form
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <FormSection>
                        <TextField
                            label="Habit"
                            value={form.name}
                            onChange={value =>
                                updateForm(
                                    "name",
                                    value
                                )
                            }
                            placeholder="Drink water"
                            required
                        />

                        <TextAreaField
                            label="Description"
                            value={
                                form.description
                            }
                            onChange={value =>
                                updateForm(
                                    "description",
                                    value
                                )
                            }
                            placeholder="Optional details or encouragement"
                            rows={3}
                        />

                        {!isTeen && (
                            <SelectField
                                label="Family Member"
                                value={
                                    form.assigned_family_member_id
                                }
                                onChange={value =>
                                    updateForm(
                                        "assigned_family_member_id",
                                        value
                                    )
                                }
                                options={[
                                    {
                                        value: "",
                                        label:
                                            "Select a family member"
                                    },
                                    ...familyMembers.map(
                                        member => ({
                                            value:
                                                member.id,
                                            label:
                                                `${member.avatar_emoji
                                                    ? `${member.avatar_emoji} `
                                                    : ""}${member.name}`
                                        })
                                    )
                                ]}
                                required
                            />
                        )}

                        <SelectField
                            label="Goal"
                            value={form.goal_type}
                            onChange={value =>
                                updateForm(
                                    "goal_type",
                                    value
                                )
                            }
                            options={[
                                {
                                    value:
                                        "checkbox",
                                    label:
                                        "Complete once"
                                },
                                {
                                    value:
                                        "count",
                                    label:
                                        "Reach a number"
                                }
                            ]}
                        />

                        {form.goal_type ===
                            "count" && (
                                <>
                                    <TextField
                                        label="Daily Goal"
                                        type="number"
                                        min="1"
                                        value={
                                            form.goal_value
                                        }
                                        onChange={value =>
                                            updateForm(
                                                "goal_value",
                                                value
                                            )
                                        }
                                        required
                                    />

                                    <TextField
                                        label="Unit"
                                        value={
                                            form.goal_unit
                                        }
                                        onChange={value =>
                                            updateForm(
                                                "goal_unit",
                                                value
                                            )
                                        }
                                        placeholder="glasses, minutes, pages"
                                        required
                                    />
                                </>
                            )}

                        <SelectField
                            label="Reminder"
                            value={
                                form.reminder_enabled
                                    ? "enabled"
                                    : "disabled"
                            }
                            onChange={value =>
                                updateForm(
                                    "reminder_enabled",
                                    value ===
                                    "enabled"
                                )
                            }
                            options={[
                                {
                                    value:
                                        "disabled",
                                    label:
                                        "No reminder"
                                },
                                {
                                    value:
                                        "enabled",
                                    label:
                                        "Remind me"
                                }
                            ]}
                        />

                        {form.reminder_enabled && (
                            <TextField
                                label="Reminder Time"
                                type="time"
                                value={
                                    form.reminder_time
                                }
                                onChange={value =>
                                    updateForm(
                                        "reminder_time",
                                        value
                                    )
                                }
                                required
                            />
                        )}

                        {formError && (
                            <p
                                className="eg-form-error"
                                role="alert"
                            >
                                {formError}
                            </p>
                        )}

                        <Button
                            type="submit"
                            size="lg"
                            disabled={
                                saving ||
                                !form.name.trim() ||
                                (
                                    !isTeen &&
                                    !form.assigned_family_member_id
                                )
                            }
                        >
                            {saving
                                ? "Saving..."
                                : habit
                                    ? "Save Changes"
                                    : "Add Habit"}
                        </Button>
                    </FormSection>
                </form>
            </SectionCard>
        </BottomSheet>
    )
}