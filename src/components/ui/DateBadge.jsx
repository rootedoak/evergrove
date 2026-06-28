export default function DateBadge({
    date,
    label,
}) {
    const parsedDate = createDate(date)

    const day = parsedDate.toLocaleDateString(undefined, {
        day: "2-digit"
    })

    const month = parsedDate.toLocaleDateString(undefined, {
        month: "short"
    })

    const weekday = parsedDate.toLocaleDateString(undefined, {
        weekday: "short"
    })

    return (
        <div className="eg-date-badge-wrapper">
            <div className="eg-date-badge">
                <span>{month}</span>
                <strong>{day}</strong>
            </div>

            <div className="eg-date-badge-label">
                {label || weekday}
            </div>
        </div>
    )
}

function createDate(dateString) {
    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day)
}