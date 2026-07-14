function todayInTimezone(timezone) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date())
}

function monthDay(value) {
    if (!value) return null
    return String(value).slice(5, 10)
}

function formatTime(value) {
    if (!value) return null

    const [hour, minute] = value.split(":")
    const date = new Date()

    date.setHours(
        Number(hour),
        Number(minute || 0),
        0,
        0
    )

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    })
}

function firstName(value) {
    if (!value) return null
    return String(value).trim().split(" ")[0]
}

function getGreetingName({ familyMember, user }) {
    return (
        firstName(familyMember?.name) ||
        firstName(user?.raw_user_meta_data?.full_name) ||
        user?.email?.split("@")[0] ||
        "there"
    )
}

function pluralize(count, singular, plural = `${singular}s`) {
    return count === 1 ? singular : plural
}

function summarizeItems({
    label,
    items,
    formatItem,
    visibleCount = 2
}) {
    if (!items?.length) return null

    const visibleItems = items
        .slice(0, visibleCount)
        .map(formatItem)

    const remainingCount =
        Math.max(items.length - visibleItems.length, 0)

    const remainingText =
        remainingCount > 0
            ? `; plus ${remainingCount} more`
            : ""

    return `${label}: ${visibleItems.join("; ")}${remainingText}.`
}

function trimBody(body, maxLength = 240) {
    if (body.length <= maxLength) return body

    return `${body
        .slice(0, maxLength - 1)
        .trim()
        .replace(/[;,.:\s]+$/, "")}…`
}

export async function buildMorningBrief({
    supabase,
    userId,
    householdId,
    timezone = "America/Chicago"
}) {
    const today = todayInTimezone(timezone)
    const todayMonthDay = monthDay(today)

    const [
        { data: userData, error: userError },
        { data: familyMember, error: familyMemberError },
        { data: birthdays, error: birthdayError },
        { data: trips, error: tripsError },
        { data: events, error: eventsError },
        { data: tasks, error: tasksError },
        { data: mealPlans, error: mealsError }
    ] = await Promise.all([
        supabase.auth.admin.getUserById(userId),

        supabase
            .from("family_members")
            .select("name")
            .eq("household_id", householdId)
            .eq("user_id", userId)
            .maybeSingle(),

        supabase
            .from("family_members")
            .select("name, birthdate")
            .eq("household_id", householdId)
            .not("birthdate", "is", null),

        supabase
            .from("trips")
            .select("name, destination, start_date")
            .eq("household_id", householdId)
            .eq("start_date", today),

        supabase
            .from("calendar_events")
            .select(
                "id, title, start_date, end_date, start_time"
            )
            .eq("household_id", householdId)
            .or(
                `start_date.eq.${today},and(start_date.lte.${today},end_date.gte.${today})`
            )
            .order("start_time", {
                ascending: true,
                nullsFirst: false
            }),

        supabase
            .from("tasks")
            .select("id, title")
            .eq("household_id", householdId)
            .eq("user_id", userId)
            .eq("due_date", today)
            .not(
                "status",
                "in",
                '("complete","completed")'
            ),

        supabase
            .from("meal_plans")
            .select("meal_name")
            .eq("household_id", householdId)
            .eq("planned_date", today)
            .limit(1)
    ])

    if (userError) throw userError
    if (familyMemberError) throw familyMemberError
    if (birthdayError) throw birthdayError
    if (tripsError) throw tripsError
    if (eventsError) throw eventsError
    if (tasksError) throw tasksError
    if (mealsError) throw mealsError

    const todaysBirthdays =
        birthdays?.filter(
            birthday =>
                monthDay(birthday.birthdate) ===
                todayMonthDay
        ) ?? []

    const greetingName = getGreetingName({
        familyMember,
        user: userData?.user
    })

    const lines = []

    const birthdaySummary = summarizeItems({
        label: pluralize(
            todaysBirthdays.length,
            "Birthday",
            "Birthdays"
        ),
        items: todaysBirthdays,
        formatItem: birthday =>
            birthday.name || "Family member"
    })

    if (birthdaySummary) {
        lines.push(birthdaySummary)
    }

    const tripSummary = summarizeItems({
        label: pluralize(
            trips?.length || 0,
            "Trip",
            "Trips"
        ),
        items: trips || [],
        formatItem: trip => {
            const tripName = trip.name || "Trip"

            return trip.destination
                ? `${tripName} to ${trip.destination} starts today`
                : `${tripName} starts today`
        }
    })

    if (tripSummary) {
        lines.push(tripSummary)
    }

    const eventSummary = summarizeItems({
        label: "Calendar",
        items: events || [],
        formatItem: event => {
            const eventTitle =
                event.title || "Family event"

            const time = formatTime(event.start_time)

            return time
                ? `${eventTitle} at ${time}`
                : eventTitle
        }
    })

    if (eventSummary) {
        lines.push(eventSummary)
    }

    const taskSummary = summarizeItems({
        label: "To-dos",
        items: tasks || [],
        formatItem: task =>
            task.title || "Untitled to-do"
    })

    if (taskSummary) {
        lines.push(taskSummary)
    }

    const dinner = mealPlans?.[0]?.meal_name

    if (dinner) {
        lines.push(`Dinner: ${dinner}.`)
    }

    if (lines.length === 0) {
        lines.push(
            "Nothing is currently scheduled in Evergrove for today."
        )
    }

    return {
        title: `Good morning, ${greetingName}`,
        body: trimBody(lines.join("\n")),
        url: "/",
        metadata: {
            today,
            timezone,
            birthday_count: todaysBirthdays.length,
            trip_count: trips?.length || 0,
            event_count: events?.length || 0,
            task_count: tasks?.length || 0,
            has_dinner: Boolean(dinner),
            highlight_count: lines.length
        }
    }
}