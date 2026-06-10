const typeIcons = {
    Activity: "📅",
    Travel: "🚗",
    Lodging: "🏨",
    Appointment: "🗓️",
    School: "🎒",
    Birthday: "🎂",
    Holiday: "🎉",
    Other: "📌"
}

function getActivityIcon(activity) {
    return typeIcons[activity.activity_type] || typeIcons.Activity
}

function getMemberName(activity) {
    return activity.family_members?.name || ""
}

function getActivitySubtitle(activity) {
    const parts = [
        getMemberName(activity),
        activity.location
    ].filter(Boolean)

    return parts.join(" • ")
}

function parseDateParts(dateString) {
    const cleanDate = String(dateString).slice(0, 10)
    const [year, month, day] = cleanDate.split("-").map(Number)

    return { year, month, day }
}

function createLocalDate(dateString) {
    const { year, month, day } = parseDateParts(dateString)
    return new Date(year, month - 1, day)
}

function toDateStringLocal(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

function getNextBirthdayDate(birthdate) {
    const { month, day } = parseDateParts(birthdate)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let nextBirthday = new Date(
        today.getFullYear(),
        month - 1,
        day
    )

    if (nextBirthday < today) {
        nextBirthday = new Date(
            today.getFullYear() + 1,
            month - 1,
            day
        )
    }

    return nextBirthday
}

function formatTime(timeString) {
    if (!timeString) return ""

    const [hours, minutes] = timeString.split(":")
    const date = new Date()
    date.setHours(Number(hours), Number(minutes), 0, 0)

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    })
}

function formatTimeRange(startTime, endTime) {
    if (startTime && endTime) {
        return `${formatTime(startTime)} - ${formatTime(endTime)}`
    }

    if (startTime) return formatTime(startTime)

    return ""
}

export function buildFamilyTimeline(
    activities,
    tasks,
    schoolItems = [],
    familyMembers = [],
    trips = [],
    timelineDays = 90,
    activitySessions = [],
    calendarEvents = []
) {
    const events = []

    const activityIdsWithSessions = new Set(
        activitySessions
            .map(session => session.activity_id)
            .filter(Boolean)
    )

    activitySessions.forEach(session => {
        if (!session.session_date) return

        const activity = session.activities
        const member = activity?.family_members
        const timeRange = formatTimeRange(
            session.start_time,
            session.end_time
        )

        events.push({
            id: `activity-session-${session.id}`,
            date: session.session_date,
            icon: member?.avatar_emoji || "📅",
            title: activity?.event_name || activity?.name || "Activity session",
            subtitle: [
                member?.name,
                timeRange,
                session.location
            ].filter(Boolean).join(" • "),
            activity_id: session.activity_id,
            event_type: "activity_session"
        })
    })

    activities.forEach(activity => {
        const subtitle = getActivitySubtitle(activity)
        const icon = getActivityIcon(activity)
        const hasSessions = activityIdsWithSessions.has(activity.id)

        if (activity.registration_open_date) {
            events.push({
                id: `${activity.id}-registration-open`,
                date: activity.registration_open_date,
                icon: "📣",
                title: `${activity.name} registration opens`,
                subtitle,
                activity_id: activity.id,
                parent_activity_id: activity.parent_activity_id || null,
                activity_type: activity.activity_type || "Activity",
                location: activity.location || null,
                event_type: "registration_open"
            })
        }

        if (activity.registration_close_date) {
            events.push({
                id: `${activity.id}-registration-close`,
                date: activity.registration_close_date,
                icon: "⏳",
                title: `${activity.name} registration closes`,
                subtitle,
                activity_id: activity.id,
                parent_activity_id: activity.parent_activity_id || null,
                activity_type: activity.activity_type || "Activity",
                location: activity.location || null,
                event_type: "registration_close"
            })
        }

        if (!hasSessions && activity.start_date) {
            events.push({
                id: `${activity.id}-start`,
                date: activity.start_date,
                icon,
                title: `${activity.name}`,
                subtitle,
                activity_id: activity.id,
                parent_activity_id: activity.parent_activity_id || null,
                activity_type: activity.activity_type || "Activity",
                location: activity.location || null,
                event_type: "activity_start"
            })
        }

        if (
            !hasSessions &&
            activity.end_date &&
            activity.end_date !== activity.start_date
        ) {
            events.push({
                id: `${activity.id}-end`,
                date: activity.end_date,
                icon: "🏁",
                title: `${activity.name}`,
                subtitle,
                activity_id: activity.id,
                parent_activity_id: activity.parent_activity_id || null,
                activity_type: activity.activity_type || "Activity",
                location: activity.location || null,
                event_type: "activity_end"
            })
        }
    })

    schoolItems.forEach(item => {
        if (!item.due_date) return

        events.push({
            id: `school-${item.id}`,
            date: item.due_date,
            icon: "🏫",
            title: item.title,
            subtitle: item.family_members?.name || "",
            event_type: "school"
        })
    })

    familyMembers.forEach(member => {
        if (!member.birthdate) return

        const { year } = parseDateParts(member.birthdate)
        const nextBirthday = getNextBirthdayDate(member.birthdate)
        const age = nextBirthday.getFullYear() - year

        events.push({
            id: `birthday-${member.id}`,
            date: toDateStringLocal(nextBirthday),
            icon: "🎂",
            title: `${member.name} turns ${age}`,
            subtitle: "Birthday",
            event_type: "birthday"
        })
    })

    trips.forEach(trip => {
        const attendees = trip.trip_family_members
            ?.map(attendee => attendee.family_members?.name)
            .filter(Boolean)
            .join(", ")

        if (!trip.start_date) return

        const startDate = createLocalDate(trip.start_date)
        const endDate = createLocalDate(
            trip.end_date || trip.start_date
        )

        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            events.push({
                id: `trip-${trip.id}-${toDateStringLocal(currentDate)}`,
                date: toDateStringLocal(currentDate),
                icon: "🚗",
                title: trip.name,
                subtitle: attendees || trip.destination || "",
                event_type: "trip"
            })

            currentDate.setDate(currentDate.getDate() + 1)
        }
    })

    calendarEvents.forEach(event => {
        if (!event.start_date) return

        const startDate = createLocalDate(event.start_date)
        const endDate = createLocalDate(
            event.end_date || event.start_date
        )

        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            events.push({
                id: `calendar-event-${event.id}-${toDateStringLocal(currentDate)}`,
                date: toDateStringLocal(currentDate),
                icon: "📌",
                title: event.title,
                subtitle:
                    event.event_type ||
                    event.location ||
                    "Calendar Event",
                event_type: "calendar_event"
            })

            currentDate.setDate(currentDate.getDate() + 1)
        }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(today)
    endDate.setDate(
        endDate.getDate() + Number(timelineDays || 90)
    )

    return events
        .filter(event => {
            if (!event.date) return false

            const eventDate = createLocalDate(event.date)

            return eventDate >= today && eventDate <= endDate
        })
        .sort((a, b) => {
            const firstDate = createLocalDate(a.date)
            const secondDate = createLocalDate(b.date)

            if (firstDate - secondDate !== 0) {
                return firstDate - secondDate
            }

            return a.title.localeCompare(b.title)
        })
}