import { supabase } from "../lib/supabase"
import { createTask } from "./taskService"
import { getCurrentHousehold } from "./householdService"

async function getCurrentUserId() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user.id
}

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

function createLocalDate(dateString) {
    if (!dateString) return null

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day, 12, 0, 0)
}

function formatLocalDate(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-")
}

function addDays(dateString, days) {
    const date = createLocalDate(dateString)

    if (!date) return null

    date.setDate(date.getDate() + days)

    return formatLocalDate(date)
}

function addMonths(dateString, months = 1) {
    const date = createLocalDate(dateString)

    if (!date) return null

    const originalDay = date.getDate()

    date.setDate(1)
    date.setMonth(date.getMonth() + months)

    const lastDayOfMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    ).getDate()

    date.setDate(
        Math.min(originalDay, lastDayOfMonth)
    )

    return formatLocalDate(date)
}

function getNextDueDate(currentDueDate, frequency) {
    if (!currentDueDate) return null

    switch (frequency) {
        case "daily":
            return addDays(currentDueDate, 1)

        case "every_2_days":
            return addDays(currentDueDate, 2)

        case "weekly":
            return addDays(currentDueDate, 7)

        case "every_2_weeks":
            return addDays(currentDueDate, 14)

        case "monthly":
            return addMonths(currentDueDate, 1)

        default:
            return addDays(currentDueDate, 7)
    }
}

export async function getRoutines() {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("routines")
        .select(`
            *,
            family_members (
                id,
                name,
                avatar_emoji
            )
        `)
        .eq("household_id", household.id)
        .order("next_due", {
            ascending: true,
            nullsFirst: false
        })
        .order("created_at", {
            ascending: false
        })

    if (error) throw error

    return data || []
}

export async function createRoutine(routine) {
    const userId = await getCurrentUserId()
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("routines")
        .insert([
            {
                ...routine,
                user_id: userId,
                household_id: household.id,
                task_created:
                    routine.task_created ?? false
            }
        ])
        .select()
        .single()

    if (error) throw error

    return data
}

export async function updateRoutine(id, updates) {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("routines")
        .update(updates)
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteRoutine(id) {
    const household = await getCurrentHousehold()

    const { error } = await supabase
        .from("routines")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error
}

export async function completeRoutine(routineOrId) {
    const household = await getCurrentHousehold()

    const routineId =
        typeof routineOrId === "string"
            ? routineOrId
            : routineOrId?.id

    if (!routineId) {
        throw new Error("Routine ID is required.")
    }

    const { data: routine, error } = await supabase
        .from("routines")
        .select(`
            id,
            frequency,
            next_due,
            schedule_basis
        `)
        .eq("id", routineId)
        .eq("household_id", household.id)
        .single()

    if (error) throw error

    const today = getLocalDateString()

    const baseDate =
        routine.schedule_basis === "due_date"
            ? routine.next_due || today
            : today

    const nextDue = getNextDueDate(
        baseDate,
        routine.frequency
    )

    return updateRoutine(
        routine.id,
        {
            last_completed: today,
            next_due: nextDue,
            task_created: false
        }
    )
}

export async function createTaskFromRoutine(routine) {
    const household = await getCurrentHousehold()

    const {
        data: claimedRoutine,
        error: claimError
    } = await supabase
        .from("routines")
        .update({
            task_created: true
        })
        .eq("id", routine.id)
        .eq("household_id", household.id)
        .or(
            "task_created.is.null,task_created.eq.false"
        )
        .select()
        .maybeSingle()

    if (claimError) {
        throw claimError
    }

    if (!claimedRoutine) {
        return null
    }

    try {
        const task = await createTask({
            title: routine.title,
            description:
                routine.description ||
                `Created from routine: ${routine.title}`,
            due_date: routine.next_due || null,
            status: "open",
            family_member_id:
                routine.family_member_id || null,
            activity_id: null,
            routine_id: routine.id
        })

        return task
    } catch (error) {
        await supabase
            .from("routines")
            .update({
                task_created: false
            })
            .eq("id", routine.id)
            .eq("household_id", household.id)

        throw error
    }
}
