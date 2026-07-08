function todayInTimezone(timezone) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date())
}

function formatCount(count, singular, plural = `${singular}s`) {
    if (!count) return null
    return `${count} ${count === 1 ? singular : plural}`
}

function buildBody({ eventCount, taskCount, dinner }) {
    const parts = [
        formatCount(eventCount, "event"),
        formatCount(taskCount, "To-Do", "To-Dos"),
        dinner ? `dinner: ${dinner}` : null
    ].filter(Boolean)

    if (parts.length === 0) {
        return "No big plans yet. Evergrove is ready when you are."
    }

    return `Today: ${parts.join(", ")}.`
}

export async function buildMorningBrief({
    supabase,
    userId,
    householdId,
    timezone = "America/Chicago"
}) {
    const today = todayInTimezone(timezone)

    const [{ data: events, error: eventsError }, { data: tasks, error: tasksError }, { data: mealPlans, error: mealsError }] =
        await Promise.all([
            supabase
                .from("calendar_events")
                .select("id")
                .eq("household_id", householdId)
                .lte("start_date", today)
                .or(`end_date.gte.${today},end_date.is.null`),

            supabase
                .from("tasks")
                .select("id")
                .eq("household_id", householdId)
                .eq("user_id", userId)
                .eq("due_date", today)
                .not("status", "in", '("complete","completed")'),

            supabase
                .from("meal_plans")
                .select("meal_name")
                .eq("household_id", householdId)
                .eq("planned_date", today)
                .limit(1)
        ])

    if (eventsError) throw eventsError
    if (tasksError) throw tasksError
    if (mealsError) throw mealsError

    const dinner = mealPlans?.[0]?.meal_name || null

    return {
        title: "Good morning from Evergrove 🌿",
        body: buildBody({
            eventCount: events?.length || 0,
            taskCount: tasks?.length || 0,
            dinner
        }),
        url: "/",
        metadata: {
            today,
            event_count: events?.length || 0,
            task_count: tasks?.length || 0,
            has_dinner: Boolean(dinner)
        }
    }
}