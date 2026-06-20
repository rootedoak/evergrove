const DEFAULT_REACTIONS = ["👍", "❤️", "🎉", "😂"]

export default function ReactionBar({
    targetId,
    summary = {},
    onToggle,
    reactions = DEFAULT_REACTIONS,
}) {
    if (!targetId) return null

    return (
        <div className="reaction-bar">
            {reactions.map((reaction) => {
                const count = summary[reaction] || 0

                return (
                    <button
                        key={reaction}
                        type="button"
                        className={
                            count > 0
                                ? "reaction-button has-reactions"
                                : "reaction-button"
                        }
                        onClick={() =>
                            onToggle({
                                targetId,
                                reaction,
                            })
                        }
                    >
                        <span>{reaction}</span>

                        {count > 0 && (
                            <span className="reaction-count">
                                {count}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}