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

function addDays(date, days) {
    const next = new Date(`${date}T00:00:00`)
    next.setDate(next.getDate() + days)
    return next.toISOString().slice(0, 10)
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
            return addDays(currentDueDate, 30)
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
        .order("next_due", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })

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
                household_id: household.id
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

export async function completeRoutine(routine) {
    const today = new Date().toISOString().slice(0, 10)

    const baseDate =
        routine.schedule_basis === "due_date"
            ? routine.next_due || today
            : today

    const nextDue = getNextDueDate(
        baseDate,
        routine.frequency
    )

    return updateRoutine(routine.id, {
        last_completed: today,
        next_due: nextDue,
        task_created: false
    })
}

export async function createTaskFromRoutine(routine) {
    const task = await createTask({
        title: routine.title,
        description:
            routine.description ||
            `Created from routine: ${routine.title}`,
        due_date: routine.next_due || null,
        status: "open",
        family_member_id: routine.family_member_id || null,
        activity_id: null,
        routine_id: routine.id
    })

    await updateRoutine(routine.id, {
        task_created: true
    })

    return task
}