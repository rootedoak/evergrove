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
    const [year, month, day] = dateString.split("-").map(Number)

    return {
        year,
        month,
        day
    }
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

export function buildFamilyTimeline(
    activities,
    tasks,
    schoolItems = [],
    familyMembers = [],
    trips = [],
    timelineDays = 90
) {
    const events = []

    activities.forEach(activity => {
        const subtitle = getActivitySubtitle(activity)
        const icon = getActivityIcon(activity)

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

        if (activity.start_date) {
            events.push({
                id: `${activity.id}-start`,
                date: activity.start_date,
                icon,
                title: `${activity.name} starts`,
                subtitle,
                activity_id: activity.id,
                parent_activity_id: activity.parent_activity_id || null,
                activity_type: activity.activity_type || "Activity",
                location: activity.location || null,
                event_type: "activity_start"
            })
        }

        if (
            activity.end_date &&
            activity.end_date !== activity.start_date
        ) {
            events.push({
                id: `${activity.id}-end`,
                date: activity.end_date,
                icon: "🏁",
                title: `${activity.name} ends`,
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

        if (trip.start_date) {
            events.push({
                id: `trip-${trip.id}-start`,
                date: trip.start_date,
                icon: "🚗",
                title: `${trip.name} starts`,
                subtitle: attendees || trip.destination || "",
                event_type: "trip_start"
            })
        }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const ninetyDaysFromNow = new Date(today)
    ninetyDaysFromNow.setDate(
        ninetyDaysFromNow.getDate() + Number(timelineDays || 90)
    )

    return events
        .filter(event => {
            if (!event.date) return false

            const eventDate = createLocalDate(event.date)

            return (
                eventDate >= today &&
                eventDate <= ninetyDaysFromNow
            )
        })
        .sort((a, b) => {
            const firstDate = createLocalDate(a.date)
            const secondDate = createLocalDate(b.date)

            return firstDate - secondDate
        })
}