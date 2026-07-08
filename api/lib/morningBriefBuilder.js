function todayInTimezone(timezone) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date())
}

function formatTime(value) {
    if (!value) return null

    const [hour, minute] = value.split(":")
    const date = new Date()
    date.setHours(Number(hour), Number(minute || 0), 0, 0)

    return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit"
    })
}

function getGreetingName(user) {
    return (
        user?.raw_user_meta_data?.full_name ||
        user?.email?.split("@")[0] ||
        "there"
    )
}

function dayTone(itemCount) {
    if (itemCount === 0) return "Looks like a quiet day."
    if (itemCount <= 2) return "Today looks pretty manageable."
    return "You’ve got a full day ahead."
}

function trimBody(body, maxLength = 220) {
    if (body.length <= maxLength) return body

    return `${body.slice(0, maxLength - 1).trim()}…`
}

export async function buildMorningBrief({
    supabase,
    userId,
    householdId,
    timezone = "America/Chicago"
}) {
    const today = todayInTimezone(timezone)

    const [
        { data: userData, error: userError },
        { data: events, error: eventsError },
        { data: tasks, error: tasksError },
        { data: mealPlans, error: mealsError }
    ] = await Promise.all([
        supabase.auth.admin.getUserById(userId),

        supabase
            .from("calendar_events")
            .select("id, title, name, start_time")
            .eq("household_id", householdId)
            .lte("start_date", today)
            .or(`end_date.gte.${today},end_date.is.null`)
            .order("start_time", { ascending: true, nullsFirst: false })
            .limit(2),

        supabase
            .from("tasks")
            .select("id, title")
            .eq("household_id", householdId)
            .eq("user_id", userId)
            .eq("due_date", today)
            .not("status", "in", '("complete","completed")')
            .limit(2),

        supabase
            .from("meal_plans")
            .select("meal_name")
            .eq("household_id", householdId)
            .eq("planned_date", today)
            .limit(1)
    ])

    if (userError) throw userError
    if (eventsError) throw eventsError
    if (tasksError) throw tasksError
    if (mealsError) throw mealsError

    const greetingName = getGreetingName(userData?.user)
    const highlights = []

    for (const event of events || []) {
        const eventTitle = event.title || event.name || "Family event"
        const time = formatTime(event.start_time)

        highlights.push(
            `📅 ${eventTitle}${time ? ` • ${time}` : ""}`
        )
    }

    for (const task of tasks || []) {
        highlights.push(`✅ ${task.title}`)
    }

    const dinner = mealPlans?.[0]?.meal_name

    if (dinner) {
        highlights.push(`🍽️ Dinner: ${dinner}`)
    }

    const visibleHighlights = highlights.slice(0, 4)

    const body = [
        `Good morning, ${greetingName}!`,
        dayTone(visibleHighlights.length),
        ...visibleHighlights,
        visibleHighlights.length === 0 ? "Enjoy it!" : "Have a great day!"
    ].join("\n")

    return {
        title: "🌿 Good Morning",
        body: trimBody(body),
        url: "/",
        metadata: {
            today,
            event_count: events?.length || 0,
            task_count: tasks?.length || 0,
            has_dinner: Boolean(dinner),
            highlight_count: visibleHighlights.length
        }
    }
}