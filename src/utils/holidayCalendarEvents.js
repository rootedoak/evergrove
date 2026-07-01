import { holidayDefinitions } from "../intelligence/holidayDefinitions"

function getNthWeekdayOfMonth(year, month, weekday, occurrence) {
    const date = new Date(year, month - 1, 1)
    let count = 0

    while (date.getMonth() === month - 1) {
        if (date.getDay() === weekday) {
            count += 1

            if (count === occurrence) {
                return [
                    date.getFullYear(),
                    String(date.getMonth() + 1).padStart(2, "0"),
                    String(date.getDate()).padStart(2, "0"),
                ].join("-")
            }
        }

        date.setDate(date.getDate() + 1)
    }

    return null
}

function getHolidayDate(year, holiday) {
    if (holiday.type === "nth-weekday") {
        return getNthWeekdayOfMonth(
            year,
            holiday.month,
            holiday.weekday,
            holiday.occurrence
        )
    }

    return [
        year,
        String(holiday.month).padStart(2, "0"),
        String(holiday.day).padStart(2, "0"),
    ].join("-")
}

export function getHolidayCalendarEvents(year) {
    return holidayDefinitions
        .map(holiday => {
            const date = getHolidayDate(year, holiday)
            if (!date) return null

            return {
                id: `holiday-${holiday.id}-${year}`,
                type: "holiday",
                sourceType: "holiday",
                sourceId: holiday.id,
                canDelete: false,
                date,
                icon: holiday.icon || "🎉",
                title: holiday.name,
                subtitle: "Holiday",
                sortTime: 99998,
                start_time: "",
                end_time: "",
                notes: ""
            }
        })
        .filter(Boolean)
}