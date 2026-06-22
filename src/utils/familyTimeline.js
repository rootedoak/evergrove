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

    let nextBirthday = new Date(today.getFullYear(), month - 1, day)

    if (nextBirthday < today) {
        nextBirthday = new Date(today.getFullYear() + 1, month - 1, day)
    }

    return nextBirthday
}

function getCalendarIcon(eventType) {
    if (eventType === "Activity") return "🏃"
    if (eventType === "School") return "🎒"
    if (eventType === "Trip") return "🚗"
    if (eventType === "Holiday") return "🎉"
    if (eventType === "Reminder") return "🔔"

    return "📌"
}

export function buildFamilyTimeline(
    tasks = [],
    schoolItems = [],
    familyMembers = [],
    trips = [],
    timelineDays = 90,
    calendarEvents = []
) {
    const events = []

        ; (Array.isArray(schoolItems) ? schoolItems : []).forEach(item => {
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

        ; (Array.isArray(familyMembers) ? familyMembers : []).forEach(member => {
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

        ; (Array.isArray(trips) ? trips : []).forEach(trip => {
            if (!trip.start_date) return

            const attendees = trip.trip_family_members
                ?.map(attendee => attendee.family_members?.name)
                .filter(Boolean)
                .join(", ")

            const startDate = createLocalDate(trip.start_date)
            const endDate = createLocalDate(trip.end_date || trip.start_date)
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

        ; (Array.isArray(calendarEvents) ? calendarEvents : []).forEach(event => {
            if (!event.start_date) return

            const startDate = createLocalDate(event.start_date)
            const endDate = createLocalDate(event.end_date || event.start_date)
            const currentDate = new Date(startDate)

            while (currentDate <= endDate) {
                events.push({
                    id: `calendar-event-${event.id}-${toDateStringLocal(currentDate)}`,
                    date: toDateStringLocal(currentDate),
                    icon: getCalendarIcon(event.event_type),
                    title: event.title,
                    subtitle: event.event_type || event.location || "Calendar Event",
                    event_type: "calendar_event"
                })

                currentDate.setDate(currentDate.getDate() + 1)
            }
        })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + Number(timelineDays || 90))

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