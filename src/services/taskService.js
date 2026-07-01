import { supabase } from "../lib/supabase"
import { completeRoutine } from "./routineService"
import { createTaskInboxNotification } from "./taskInboxNotificationService"

import { createFeedEvent } from "./feedService"
import { trackEvent } from "./analyticsService"

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user
}

async function getCurrentUserId() {
    const user = await getCurrentUser()
    return user.id
}

async function getCurrentHouseholdId(userId) {
    const { data, error } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle()

    if (error) throw error

    return data?.household_id || null
}

export async function getTasks() {
    const user = await getCurrentUser()
    const householdId = await getCurrentHouseholdId(user.id)

    let query = supabase
        .from("tasks")
        .select(`
            *,
            family_members (
                id,
                name,
                avatar_emoji,
                avatar_url
            ),
            activities (
                id,
                name
            ),
            routines (
                id,
                title,
                frequency,
                next_due
            ),
            trips (
                id,
                name,
                destination,
                start_date,
                end_date
            )
        `)

    if (householdId) {
        query = query
            .eq("household_id", householdId)
            .or(`visibility.eq.household,and(visibility.eq.private,user_id.eq.${user.id})`)
    } else {
        query = query.eq("user_id", user.id)
    }

    const { data, error } = await query
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })

    if (error) throw error

    return data || []
}

export async function createTask(task) {
    const user = await getCurrentUser()
    const householdId = await getCurrentHouseholdId(user.id)

    if (!householdId) {
        throw new Error("No household found for current user.")
    }

    const { household_id, user_id, ...cleanTask } = task

    const { data, error } = await supabase
        .from("tasks")
        .insert([
            {
                ...cleanTask,
                user_id: user.id,
                household_id: householdId,
                visibility: cleanTask.visibility || "household"
            }
        ])
        .select()
        .single()

    if (error) throw error

    await createTaskInboxNotification(data)

    await trackEvent({
        eventName: "task_created",
        eventType: "productivity",
        source: "tasks",
        metadata: {
            task_id: data.id,
            visibility: data.visibility || "household",
            has_due_date: Boolean(data.due_date),
            family_member_id: data.family_member_id || null,
            activity_id: data.activity_id || null,
            routine_id: data.routine_id || null,
            trip_id: data.trip_id || null,
        },
    })

    return data
}

export async function updateTask(id, updates) {
    const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .maybeSingle()

    if (error) throw error

    const isCompleted =
        updates.status === "complete" ||
        updates.status === "completed" ||
        updates.completed === true

    if (isCompleted) {
        await createFeedEvent({
            event_type: "task_completed",
            title: data.title,
            description: "Task completed",
            reference_type: "task",
            reference_id: data.id,
            metadata: {
                task_id: data.id,
                task_title: data.title,
                family_member_id: data.family_member_id || null,
            },
        })

        await trackEvent({
            eventName: "task_completed",
            eventType: "productivity",
            source: "tasks",
            metadata: {
                task_id: data.id,
                visibility: data.visibility || null,
                family_member_id: data.family_member_id || null,
                activity_id: data.activity_id || null,
                routine_id: data.routine_id || null,
                trip_id: data.trip_id || null,
            },
        })
    }

    return data
}

export async function deleteTask(id) {
    const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)

    if (error) throw error
}

export async function completeTask(task) {
    const updatedTask = await updateTask(task.id, {
        status: "complete"
    })

    if (task.routine_id) {
        await completeRoutine({
            id: task.routine_id,
            next_due: task.routines?.next_due || task.due_date,
            frequency: task.routines?.frequency || "weekly"
        })
    }

    return updatedTask
}