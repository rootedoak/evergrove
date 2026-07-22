import { supabase } from "../lib/supabase"

function todayLocal() {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

function normalizeHabitPayload(habit) {
    const goalType =
        habit.goal_type || "checkbox"

    const frequencyType =
        habit.frequency_type || "daily"

    const isArchived =
        Boolean(habit.is_archived)

    return {
        household_id:
            habit.household_id,

        assigned_family_member_id:
            habit.assigned_family_member_id,

        name:
            habit.name?.trim(),

        description:
            habit.description?.trim() || null,

        icon:
            habit.icon || null,

        color:
            habit.color || null,

        frequency_type:
            frequencyType,

        days_of_week:
            frequencyType === "daily"
                ? null
                : habit.days_of_week || null,

        goal_type:
            goalType,

        goal_value:
            goalType === "checkbox"
                ? null
                : Number(habit.goal_value),

        goal_unit:
            goalType === "checkbox"
                ? null
                : habit.goal_unit?.trim() || null,

        reminder_enabled:
            Boolean(habit.reminder_enabled),

        reminder_time:
            habit.reminder_enabled
                ? habit.reminder_time || null
                : null,

        streak_enabled:
            habit.streak_enabled !== false,

        start_date:
            habit.start_date || todayLocal(),

        end_date:
            habit.end_date || null,

        is_archived:
            isArchived,

        display_order:
            Number.isFinite(
                Number(habit.display_order)
            )
                ? Number(habit.display_order)
                : 0,

        archived_at:
            isArchived
                ? habit.archived_at ||
                new Date().toISOString()
                : null
    }
}

export async function getHabits({
    householdId,
    includeArchived = false
}) {
    if (!householdId) {
        throw new Error(
            "A household ID is required."
        )
    }

    let query = supabase
        .from("habit_definitions")
        .select(`
            *,
            assigned_family_member:family_members!habit_definitions_assigned_family_member_id_fkey (
                id,
                name,
                role,
                member_type,
                linked_user_id
            )
        `)
        .eq(
            "household_id",
            householdId
        )
        .order(
            "is_archived",
            {
                ascending: true
            }
        )
        .order(
            "display_order",
            {
                ascending: true
            }
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        )

    if (!includeArchived) {
        query = query.eq(
            "is_archived",
            false
        )
    }

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return data || []
}

export async function getHabitById(
    habitId
) {
    if (!habitId) {
        throw new Error(
            "A habit ID is required."
        )
    }

    const {
        data,
        error
    } = await supabase
        .from("habit_definitions")
        .select(`
            *,
            assigned_family_member:family_members!habit_definitions_assigned_family_member_id_fkey (
                id,
                name,
                role,
                member_type,
                linked_user_id
            )
        `)
        .eq(
            "id",
            habitId
        )
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function createHabit(
    habit
) {
    const payload =
        normalizeHabitPayload(habit)

    if (!payload.name) {
        throw new Error(
            "Habit name is required."
        )
    }

    if (!payload.household_id) {
        throw new Error(
            "Household ID is required."
        )
    }

    if (
        !payload.assigned_family_member_id
    ) {
        throw new Error(
            "An assigned family member is required."
        )
    }

    const {
        data,
        error
    } = await supabase
        .from("habit_definitions")
        .insert(payload)
        .select(`
            *,
            assigned_family_member:family_members!habit_definitions_assigned_family_member_id_fkey (
                id,
                name,
                role,
                member_type,
                linked_user_id
            )
        `)
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function updateHabit({
    habitId,
    updates
}) {
    if (!habitId) {
        throw new Error(
            "A habit ID is required."
        )
    }

    if (!updates) {
        throw new Error(
            "Habit updates are required."
        )
    }

    const payload = {}

    if (
        "assigned_family_member_id" in
        updates
    ) {
        payload.assigned_family_member_id =
            updates.assigned_family_member_id
    }

    if ("name" in updates) {
        const name =
            updates.name?.trim()

        if (!name) {
            throw new Error(
                "Habit name is required."
            )
        }

        payload.name = name
    }

    if ("description" in updates) {
        payload.description =
            updates.description?.trim() ||
            null
    }

    if ("icon" in updates) {
        payload.icon =
            updates.icon || null
    }

    if ("color" in updates) {
        payload.color =
            updates.color || null
    }

    if (
        "frequency_type" in updates
    ) {
        payload.frequency_type =
            updates.frequency_type

        if (
            updates.frequency_type ===
            "daily"
        ) {
            payload.days_of_week = null
        }
    }

    if (
        "days_of_week" in updates &&
        updates.frequency_type !== "daily"
    ) {
        payload.days_of_week =
            updates.days_of_week || null
    }

    if ("goal_type" in updates) {
        payload.goal_type =
            updates.goal_type

        if (
            updates.goal_type ===
            "checkbox"
        ) {
            payload.goal_value = null
            payload.goal_unit = null
        }
    }

    if (
        "goal_value" in updates &&
        updates.goal_type !== "checkbox"
    ) {
        const goalValue =
            Number(updates.goal_value)

        if (
            !Number.isFinite(goalValue) ||
            goalValue <= 0
        ) {
            throw new Error(
                "Goal value must be greater than zero."
            )
        }

        payload.goal_value =
            goalValue
    }

    if (
        "goal_unit" in updates &&
        updates.goal_type !== "checkbox"
    ) {
        payload.goal_unit =
            updates.goal_unit?.trim() ||
            null
    }

    if (
        "reminder_enabled" in updates
    ) {
        payload.reminder_enabled =
            Boolean(
                updates.reminder_enabled
            )

        if (
            !updates.reminder_enabled
        ) {
            payload.reminder_time = null
        }
    }

    if (
        "reminder_time" in updates &&
        updates.reminder_enabled !== false
    ) {
        payload.reminder_time =
            updates.reminder_time || null
    }

    if (
        "streak_enabled" in updates
    ) {
        payload.streak_enabled =
            Boolean(
                updates.streak_enabled
            )
    }

    if ("start_date" in updates) {
        payload.start_date =
            updates.start_date
    }

    if ("end_date" in updates) {
        payload.end_date =
            updates.end_date || null
    }

    if ("display_order" in updates) {
        const displayOrder =
            Number(updates.display_order)

        if (
            !Number.isFinite(
                displayOrder
            )
        ) {
            throw new Error(
                "Display order must be a number."
            )
        }

        payload.display_order =
            displayOrder
    }

    if ("is_archived" in updates) {
        const isArchived =
            Boolean(
                updates.is_archived
            )

        payload.is_archived =
            isArchived

        payload.archived_at =
            isArchived
                ? updates.archived_at ||
                new Date().toISOString()
                : null
    } else if (
        "archived_at" in updates
    ) {
        payload.archived_at =
            updates.archived_at || null
    }

    if (
        Object.keys(payload).length === 0
    ) {
        throw new Error(
            "No valid habit updates were provided."
        )
    }

    const {
        data,
        error
    } = await supabase
        .from("habit_definitions")
        .update(payload)
        .eq(
            "id",
            habitId
        )
        .select(`
            *,
            assigned_family_member:family_members!habit_definitions_assigned_family_member_id_fkey (
                id,
                name,
                role,
                member_type,
                linked_user_id
            )
        `)
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function archiveHabit(
    habitId
) {
    if (!habitId) {
        throw new Error(
            "A habit ID is required."
        )
    }

    const {
        data,
        error
    } = await supabase
        .from("habit_definitions")
        .update({
            is_archived: true,
            archived_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            habitId
        )
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function restoreHabit(
    habitId
) {
    if (!habitId) {
        throw new Error(
            "A habit ID is required."
        )
    }

    const {
        data,
        error
    } = await supabase
        .from("habit_definitions")
        .update({
            is_archived: false,
            archived_at: null
        })
        .eq(
            "id",
            habitId
        )
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function deleteHabit(
    habitId
) {
    if (!habitId) {
        throw new Error(
            "A habit ID is required."
        )
    }

    const {
        error
    } = await supabase
        .from("habit_definitions")
        .delete()
        .eq(
            "id",
            habitId
        )

    if (error) {
        throw error
    }

    return true
}

export async function getHabitProgress({
    habitId,
    startDate,
    endDate
}) {
    if (!habitId) {
        throw new Error(
            "A habit ID is required."
        )
    }

    let query = supabase
        .from("habit_progress")
        .select("*")
        .eq(
            "habit_definition_id",
            habitId
        )
        .order(
            "progress_date",
            {
                ascending: true
            }
        )

    if (startDate) {
        query = query.gte(
            "progress_date",
            startDate
        )
    }

    if (endDate) {
        query = query.lte(
            "progress_date",
            endDate
        )
    }

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return data || []
}

export async function getHouseholdHabitProgress({
    householdId,
    startDate,
    endDate
}) {
    if (!householdId) {
        throw new Error(
            "A household ID is required."
        )
    }

    let query = supabase
        .from("habit_progress")
        .select(`
            *,
            habit_definition:habit_definitions!inner (
                id,
                household_id,
                assigned_family_member_id,
                name,
                goal_type,
                goal_value,
                goal_unit
            )
        `)
        .eq(
            "habit_definition.household_id",
            householdId
        )
        .order(
            "progress_date",
            {
                ascending: true
            }
        )

    if (startDate) {
        query = query.gte(
            "progress_date",
            startDate
        )
    }

    if (endDate) {
        query = query.lte(
            "progress_date",
            endDate
        )
    }

    const {
        data,
        error
    } = await query

    if (error) {
        throw error
    }

    return data || []
}

export async function setHabitProgress({
    habit,
    progressDate = todayLocal(),
    progressValue,
    isComplete
}) {
    if (!habit?.id) {
        throw new Error(
            "A habit is required."
        )
    }

    let nextProgressValue =
        Number(progressValue ?? 0)

    if (
        !Number.isFinite(
            nextProgressValue
        ) ||
        nextProgressValue < 0
    ) {
        throw new Error(
            "Progress value must be zero or greater."
        )
    }

    let nextIsComplete =
        Boolean(isComplete)

    if (
        habit.goal_type ===
        "checkbox"
    ) {
        nextProgressValue =
            nextIsComplete ? 1 : 0
    } else if (
        isComplete === undefined
    ) {
        nextIsComplete =
            nextProgressValue >=
            Number(
                habit.goal_value || 0
            )
    }

    const payload = {
        habit_definition_id:
            habit.id,

        progress_date:
            progressDate,

        progress_value:
            nextProgressValue,

        is_complete:
            nextIsComplete,

        completed_at:
            nextIsComplete
                ? new Date().toISOString()
                : null
    }

    const {
        data,
        error
    } = await supabase
        .from("habit_progress")
        .upsert(
            payload,
            {
                onConflict:
                    "habit_definition_id,progress_date"
            }
        )
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function toggleHabitComplete({
    habit,
    progressDate = todayLocal(),
    currentlyComplete = false
}) {
    return setHabitProgress({
        habit,
        progressDate,
        progressValue:
            currentlyComplete ? 0 : 1,
        isComplete:
            !currentlyComplete
    })
}

export async function deleteHabitProgress({
    habitId,
    progressDate
}) {
    if (
        !habitId ||
        !progressDate
    ) {
        throw new Error(
            "Habit ID and progress date are required."
        )
    }

    const {
        error
    } = await supabase
        .from("habit_progress")
        .delete()
        .eq(
            "habit_definition_id",
            habitId
        )
        .eq(
            "progress_date",
            progressDate
        )

    if (error) {
        throw error
    }

    return true
}

export function getTodayLocal() {
    return todayLocal()
}

export async function adjustHabitProgress({
    habitDefinitionId,
    progressDate,
    delta
}) {
    const { data, error } = await supabase.rpc(
        "adjust_habit_progress",
        {
            p_habit_definition_id: habitDefinitionId,
            p_progress_date: progressDate,
            p_delta: delta
        }
    )

    if (error) {
        throw error
    }

    return data
}