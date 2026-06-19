export function getLocalDateString(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

export function isTodayOrPast(dateString) {
    if (!dateString) return false

    return dateString <= getLocalDateString()
}

export function isDateInCurrentWeek(
    dateString,
    weekStartsOn = "sunday"
) {
    if (!dateString) return false

    const today = new Date()
    const date = new Date(`${dateString}T00:00:00`)

    const start = new Date(today)
    const day = start.getDay()

    const offset =
        weekStartsOn === "monday"
            ? day === 0
                ? -6
                : 1 - day
            : -day

    start.setDate(start.getDate() + offset)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return date >= start && date <= end
}

export function addDays(date, days) {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}