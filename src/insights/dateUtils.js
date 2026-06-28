export function createLocalDate(dateString) {
    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day)
}

export function getDateStringOffset(baseDateString, offsetDays) {
    const date = createLocalDate(baseDateString)
    date.setDate(date.getDate() + offsetDays)

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-")
}