import { supabase } from "../lib/supabase"
import { completeRoutine } from "./routineService"
import { createTaskInboxNotification } from "./taskInboxNotificationService"

import { createFeedEvent } from "./feedService"
import { trackUsageEvent } from "./analytics/usageEventService"

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

async function getCurrentHouseholdMembership(userId) {
    const { data, error } = await supabase
        .from("household_members")
        .select(`
            household_id,
            role
        `)
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle()

    if (error) throw error

    return data || null
}

async function getCurrentHouseholdId(userId) {
    const membership =
        await getCurrentHouseholdMembership(userId)

    return membership?.household_id || null
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
        query = query.eq("household_id", householdId)
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

    await trackUsageEvent({
        eventType: "task_created",
        entityType: "task",
        entityId: data.id,
        metadata: {
            source: "tasks",
            visibility: data.visibility || "household",
            has_due_date: Boolean(data.due_date),
            family_member_id: data.family_member_id || null,
            activity_id: data.activity_id || null,
            routine_id: data.routine_id || null,
            trip_id: data.trip_id || null
        }
    })

    return data
}

async function updateAssignedTaskStatus(id, status) {
    const { data, error } = await supabase.rpc(
        "set_my_assigned_task_status",
        {
            target_task_id: id,
            target_status: status
        }
    )

    if (error) throw error

    return data
}

export async function updateTask(id, updates) {
    const user = await getCurrentUser()

    const membership =
        await getCurrentHouseholdMembership(user.id)

    const isTeen = membership?.role === "teen"

    const updateKeys = Object.keys(updates)

    const isStatusOnlyUpdate =
        updateKeys.length === 1 &&
        updateKeys[0] === "status" &&
        ["open", "complete"].includes(updates.status)

    let data

    if (isTeen && isStatusOnlyUpdate) {
        data = await updateAssignedTaskStatus(
            id,
            updates.status
        )
    } else {
        const response = await supabase
            .from("tasks")
            .update(updates)
            .eq("id", id)
            .select()
            .maybeSingle()

        if (response.error) throw response.error

        data = response.data
    }

    if (!data) {
        throw new Error(
            "Task could not be updated or is not available."
        )
    }

    const isCompleted =
        updates.status === "complete" ||
        updates.status === "completed" ||
        updates.completed === true

    if (isCompleted) {
        if (data.visibility !== "private") {
            await createFeedEvent({
                event_type: "task_completed",
                title: data.title,
                description: "Task completed",
                reference_type: "task",
                reference_id: data.id,
                metadata: {
                    task_id: data.id,
                    task_title: data.title,
                    family_member_id:
                        data.family_member_id || null
                }
            })
        }

        await trackUsageEvent({
            eventType: "task_completed",
            entityType: "task",
            entityId: data.id,
            metadata: {
                source: "tasks",
                visibility: data.visibility || null,
                family_member_id:
                    data.family_member_id || null,
                activity_id:
                    data.activity_id || null,
                routine_id:
                    data.routine_id || null,
                trip_id:
                    data.trip_id || null
            }
        })
    }

    return data
}

export async function deleteTask(id) {
    await trackUsageEvent({
        eventType: "task_deleted",
        entityType: "task",
        entityId: id,
        metadata: {
            source: "tasks"
        }
    })

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