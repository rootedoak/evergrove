export default function EmptyState({
    title = "Nothing here yet",
    message,
    action,
}) {
    return (
        <div className="eg-empty-state">
            <strong>{title}</strong>

            {message && (
                <p>{message}</p>
            )}

            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    )
}