import BottomSheet from "../ui/BottomSheet"
import Button from "../ui/Button"

export default function CalendarEventDetailSheet({
    event,
    open,
    onClose,
    onEdit,
}) {
    if (!event) return null

    const timeLabel = getTimeLabel(event)

    return (
        <BottomSheet open={open} onClose={onClose}>
            <div className="eg-event-summary">
                <div className="eg-event-summary-icon">
                    {event.icon || "📅"}
                </div>

                <div className="eg-event-summary-heading">
                    <h2>{event.title}</h2>

                    {event.date && (
                        <p>{formatDisplayDate(event.date)}</p>
                    )}

                    {timeLabel && (
                        <p className="eg-event-time">{timeLabel}</p>
                    )}
                </div>

                <div className="eg-event-summary-details">
                    {event.date && (
                        <SummaryRow
                            icon="📅"
                            label="Date"
                            value={formatDisplayDate(event.date)}
                        />
                    )}

                    {timeLabel && (
                        <SummaryRow
                            icon="🕘"
                            label="Time"
                            value={timeLabel}
                        />
                    )}

                    {event.subtitle && (
                        <SummaryRow
                            icon="👥"
                            label="Type"
                            value={event.subtitle}
                        />
                    )}

                    {event.location && (
                        <SummaryRow
                            icon="📍"
                            label="Location"
                            value={event.location}
                        />
                    )}

                    {event.notes && (
                        <SummaryRow
                            icon="📝"
                            label="Notes"
                            value={event.notes}
                        />
                    )}
                </div>

                <Button
                    size="lg"
                    onClick={() => {
                        onClose()
                        onEdit(event)
                    }}
                >
                    Edit Event
                </Button>
            </div>
        </BottomSheet>
    )
}

function SummaryRow({ icon, label, value }) {
    if (!value) return null

    return (
        <div className="eg-event-summary-row">
            <span>{icon}</span>

            <div>
                <small>{label}</small>
                <strong>{value}</strong>
            </div>
        </div>
    )
}

function getTimeLabel(event) {
    const startTime = event.start_time || event.startTime || ""
    const endTime = event.end_time || event.endTime || ""

    if (!startTime && !endTime) return ""

    if (startTime && endTime) {
        return `${formatTime(startTime)} – ${formatTime(endTime)}`
    }

    return formatTime(startTime || endTime)
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

function formatDisplayDate(dateString) {
    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    })
}