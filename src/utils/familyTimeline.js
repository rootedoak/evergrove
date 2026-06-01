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

export function buildFamilyTimeline(
    activities,
    tasks,
    schoolItems = [],
    familyMembers = [],
    trips = []
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

        const birthDate = new Date(member.birthdate)
        const today = new Date()

        let nextBirthday = new Date(
            today.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate()
        )

        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1)
        }

        const age =
            nextBirthday.getFullYear() - birthDate.getFullYear()

        events.push({
            id: `birthday-${member.id}`,
            date: nextBirthday.toISOString().split("T")[0],
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

    return events
        .filter(event => {
            const eventDate = new Date(`${event.date}T00:00:00`)
            return eventDate >= today
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
}