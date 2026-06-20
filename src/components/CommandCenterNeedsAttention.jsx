function getDateOnly(value) {
    if (!value) return ""
    return String(value).slice(0, 10)
}

function createLocalDate(dateString) {
    if (!dateString) return null

    const [year, month, day] = getDateOnly(dateString)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day)
}

function getDaysUntil(dateString, todayString) {
    if (!dateString || !todayString) return null

    const today = createLocalDate(todayString)
    const target = createLocalDate(dateString)

    return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function getUrgencyLabel(daysUntil) {
    if (daysUntil < 0) return "Overdue"
    if (daysUntil === 0) return "Due today"
    if (daysUntil === 1) return "Due tomorrow"
    return `Due in ${daysUntil} days`
}

export default function CommandCenterNeedsAttention({
    tasks = [],
    schoolItems = [],
    taskSuggestions = [],
    todayString,
    onCreateSuggestedTask,
    onCompleteTask,
}) {
    const overdueTasks = tasks
        .filter(task => task.status !== "complete")
        .filter(task => task.due_date && task.due_date < todayString)
        .slice(0, 3)

    const dueSoonTasks = tasks
        .filter(task => task.status !== "complete")
        .filter(task => {
            const days = getDaysUntil(task.due_date, todayString)
            return days !== null && days >= 0 && days <= 1
        })
        .slice(0, 3)

    const dueSoonSchoolItems = schoolItems
        .filter(item => !item.completed)
        .filter(item => {
            const days = getDaysUntil(item.due_date, todayString)
            return days !== null && days >= 0 && days <= 2
        })
        .slice(0, 3)

    const registrationSuggestions = taskSuggestions
        .slice(0, 2)

    const items = [
        ...overdueTasks.map(task => ({
            id: `overdue-task-${task.id}`,
            icon: "🔴",
            title: task.title,
            detail: "Overdue task",
            actionLabel: "Complete",
            onAction: () => onCompleteTask?.(task),
        })),
        ...dueSoonTasks.map(task => {
            const days = getDaysUntil(task.due_date, todayString)

            return {
                id: `due-task-${task.id}`,
                icon: days === 0 ? "🔴" : "🟡",
                title: task.title,
                detail: getUrgencyLabel(days),
                actionLabel: "Complete",
                onAction: () => onCompleteTask?.(task),
            }
        }),
        ...dueSoonSchoolItems.map(item => {
            const days = getDaysUntil(item.due_date, todayString)

            return {
                id: `school-${item.id}`,
                icon: days === 0 ? "🔴" : "🟡",
                title: item.title,
                detail: `${item.family_members?.name || "School"} • ${getUrgencyLabel(days)}`,
            }
        }),
        ...registrationSuggestions.map(suggestion => ({
            id: `suggestion-${suggestion.activityId}`,
            icon: "🟡",
            title: suggestion.title,
            detail:
                suggestion.daysRemaining !== null
                    ? `Registration closes in ${suggestion.daysRemaining} ${suggestion.daysRemaining === 1 ? "day" : "days"
                    }`
                    : "Suggested next step",
            actionLabel: "Create",
            onAction: () => onCreateSuggestedTask?.(suggestion),
        })),
    ].slice(0, 6)

    return (
        <section className="command-center-attention">
            <div className="attention-header">
                <div>
                    <p className="card-kicker">Priority</p>
                    <h2>Needs Attention</h2>
                </div>

                {items.length > 0 && (
                    <span className="attention-count">
                        {items.length}
                    </span>
                )}
            </div>

            {items.length === 0 ? (
                <div className="attention-empty">
                    <span>🌿</span>
                    <p>Nothing urgent right now.</p>
                </div>
            ) : (
                <div className="attention-list">
                    {items.map(item => (
                        <div className="attention-item" key={item.id}>
                            <span className="attention-icon">
                                {item.icon}
                            </span>

                            <div className="attention-content">
                                <strong>{item.title}</strong>
                                <p>{item.detail}</p>
                            </div>

                            {item.actionLabel && (
                                <button
                                    type="button"
                                    className="attention-action"
                                    onClick={item.onAction}
                                >
                                    {item.actionLabel}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}