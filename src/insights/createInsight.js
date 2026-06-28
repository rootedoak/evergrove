export function createInsight({
    id,
    category,
    score,
    icon,
    title,
    description,
    actionLabel,
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
        execute,
        completed,
    }
}