function formatToday() {
    return new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
    })
}

function getGreeting() {
    const hour = new Date().getHours()

    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
}

function getItemTitle(item) {
    return item?.title || item?.name || item?.meal_name || "Untitled"
}

function getItemTime(item) {
    return item?.time_label || item?.time || ""
}

export default function CommandCenterDailyBrief({
    householdName = "Family",
    userName = "",
    todayEvents = [],
    todayTasks = [],
    tonightDinner = null,
    upcomingItems = [],
    attentionCount = 0,
    onOpenEvents,
    onOpenTasks,
    onOpenDinner,
}) {
    const taskCount = todayTasks.length
    const eventCount = todayEvents.length

    const topEvents = todayEvents.slice(0, 2)
    const topUpcoming = upcomingItems.slice(0, 2)

    const dinnerName =
        tonightDinner?.meal_name ||
        tonightDinner?.meal?.name ||
        tonightDinner?.name ||
        tonightDinner?.restaurant_name ||
        "Not set"

    return (
        <section className="command-center-brief">
            <div className="brief-header">
                <p className="brief-eyebrow">{formatToday()}</p>

                <h1>{getGreeting()}, {userName || householdName}</h1>

                <p className="brief-subtitle">
                    Here’s what your family needs to know today.
                </p>
            </div>

            <div className="brief-summary-grid">
                <button
                    type="button"
                    className="brief-summary-item brief-summary-button"
                    onClick={onOpenEvents}
                >
                    <span className="brief-icon">📅</span>
                    <div>
                        <strong>{eventCount}</strong>
                        <span>{eventCount === 1 ? "event today" : "events today"}</span>
                    </div>
                </button>

                <button
                    type="button"
                    className="brief-summary-item brief-summary-button"
                    onClick={onOpenTasks}
                >
                    <span className="brief-icon">✅</span>
                    <div>
                        <strong>{taskCount}</strong>
                        <span>{taskCount === 1 ? "task due" : "tasks due"}</span>
                    </div>
                </button>

                <button
                    type="button"
                    className="brief-summary-item brief-summary-button"
                    onClick={onOpenDinner}
                >
                    <span className="brief-icon">🍽️</span>
                    <div>
                        <strong>{dinnerName}</strong>
                        <span>Dinner</span>
                    </div>
                </button>
            </div>

            <div className="brief-digest">
                {attentionCount > 0 && (
                    <div className="brief-digest-row attention">
                        <span>⚠️</span>
                        <p>
                            <strong>{attentionCount}</strong>{" "}
                            {attentionCount === 1
                                ? "item needs attention"
                                : "items need attention"}
                        </p>
                    </div>
                )}

                {topEvents.length > 0 && (
                    <div className="brief-digest-group">
                        <p className="brief-digest-label">Today</p>

                        {topEvents.map((event) => (
                            <div className="brief-digest-row" key={event.id}>
                                <span>{event.icon || "📌"}</span>
                                <p>
                                    <strong>{getItemTitle(event)}</strong>
                                    {getItemTime(event) && <> • {getItemTime(event)}</>}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {topUpcoming.length > 0 && (
                    <div className="brief-digest-group">
                        <p className="brief-digest-label">Coming soon</p>

                        {topUpcoming.map((item) => (
                            <div className="brief-digest-row" key={item.id}>
                                <span>{item.icon || "⏭️"}</span>
                                <p>
                                    <strong>{getItemTitle(item)}</strong>
                                    {item.subtitle && <> • {item.subtitle}</>}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {topEvents.length === 0 &&
                    topUpcoming.length === 0 &&
                    taskCount === 0 &&
                    attentionCount === 0 &&
                    !tonightDinner && (
                        <div className="brief-digest-row">
                            <span>🌿</span>
                            <p>Your family has a lighter day today.</p>
                        </div>
                    )}
            </div>
        </section>
    )
}