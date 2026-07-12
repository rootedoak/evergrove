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

    return date.toLocaleTimeString(undefined, {
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

function dayTone(itemCount) {
    if (itemCount === 0) return "Looks like a quiet day."
    if (itemCount <= 2) return "Today looks pretty manageable."
    return "You’ve got a full day ahead."
}

function dayEnding(itemCount) {
    if (itemCount === 0) return "Enjoy the slower pace today."
    if (itemCount >= 4) return "You’ve got this."
    return "Have a great day!"
}

function buildTitle(itemCount) {
    if (itemCount === 0) return "🌿 Enjoy your quiet day"
    if (itemCount >= 4) return "🌿 Good Morning • Busy day ahead"
    return "🌿 Good Morning"
}

function trimBody(body, maxLength = 240) {
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
            .eq("start_date", today)
            .limit(1),

        supabase
            .from("calendar_events")
            .select("id, title, start_date, end_date, start_time")
            .eq("household_id", householdId)
            .or(
                `start_date.eq.${today},and(start_date.lte.${today},end_date.gte.${today})`
            )
            .order("start_time", {
                ascending: true,
                nullsFirst: false
            })
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
    if (familyMemberError) throw familyMemberError
    if (birthdayError) throw birthdayError
    if (tripsError) throw tripsError
    if (eventsError) throw eventsError
    if (tasksError) throw tasksError
    if (mealsError) throw mealsError

    const highlights = []

    for (const birthday of birthdays || []) {
        if (monthDay(birthday.birthdate) === todayMonthDay) {
            highlights.push(`🎂 ${birthday.name}'s birthday`)
        }
    }

    for (const trip of trips || []) {
        const tripName = trip.name || "Trip"
        const destination = trip.destination
            ? ` to ${trip.destination}`
            : ""

        highlights.push(
            `✈️ ${tripName}${destination} starts today`
        )
    }

    for (const event of events || []) {
        const eventTitle = event.title || "Family event"
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

    const greetingName = getGreetingName({
        familyMember,
        user: userData?.user
    })

    const body = [
        `Good morning, ${greetingName}!`,
        dayTone(visibleHighlights.length),
        ...visibleHighlights,
        dayEnding(visibleHighlights.length)
    ].join("\n")

    return {
        title: buildTitle(visibleHighlights.length),
        body: trimBody(body),
        url: "/",
        metadata: {
            today,
            timezone,
            birthday_count:
                birthdays?.filter(
                    item =>
                        monthDay(item.birthdate) === todayMonthDay
                ).length || 0,
            trip_count: trips?.length || 0,
            event_count: events?.length || 0,
            task_count: tasks?.length || 0,
            has_dinner: Boolean(dinner),
            highlight_count: visibleHighlights.length
        }
    }
}