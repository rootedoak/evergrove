export function createInsight({
    id,
    category,
    score,
    icon,
    title,
    description,
    actionLabel,
    taskOptions,
    execute,
    completed,
}) {
    return {
        id,
        category,
        score,
        icon,
        title,
        description,
        actionLabel,
        taskOptions,
        execute,
        completed,
    }
}