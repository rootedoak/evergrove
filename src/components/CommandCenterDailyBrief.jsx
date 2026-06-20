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

export default function CommandCenterDailyBrief({
    householdName = "Family",
    todayEvents = [],
    todayTasks = [],
    tonightDinner = null,
    upcomingItems = [],
}) {
    const taskCount = todayTasks.length
    const eventCount = todayEvents.length
    const topEvent = todayEvents[0]
    const topUpcoming = upcomingItems[0]

    return (
        <section className="command-center-brief">
            <div className="brief-header">
                <p className="brief-eyebrow">
                    {formatToday()}
                </p>

                <h1>
                    {getGreeting()}, {householdName}
                </h1>

                <p className="brief-subtitle">
                    Here’s what your family needs to know today.
                </p>
            </div>

            <div className="brief-summary-grid">
                <div className="brief-summary-item">
                    <span className="brief-icon">📅</span>
                    <div>
                        <strong>{eventCount}</strong>
                        <span>Today</span>
                    </div>
                </div>

                <div className="brief-summary-item">
                    <span className="brief-icon">✅</span>
                    <div>
                        <strong>{taskCount}</strong>
                        <span>Tasks</span>
                    </div>
                </div>

                <div className="brief-summary-item">
                    <span className="brief-icon">🍽️</span>
                    <div>
                        <strong>
                            {tonightDinner?.meal_name || tonightDinner?.name || "Not set"}
                        </strong>
                        <span>Dinner</span>
                    </div>
                </div>
            </div>

            <div className="brief-today-list">
                {topEvent && (
                    <div className="brief-today-item">
                        <span>📌</span>
                        <p>
                            <strong>{topEvent.title || topEvent.name}</strong>
                            {topEvent.time && <> • {topEvent.time}</>}
                        </p>
                    </div>
                )}

                {topUpcoming && (
                    <div className="brief-today-item">
                        <span>⏭️</span>
                        <p>
                            <strong>Coming up:</strong>{" "}
                            {topUpcoming.title || topUpcoming.name}
                        </p>
                    </div>
                )}

                {!topEvent && !topUpcoming && taskCount === 0 && !tonightDinner && (
                    <div className="brief-today-item">
                        <span>🌿</span>
                        <p>Your family has a lighter day today.</p>
                    </div>
                )}
            </div>
        </section>
    )
}