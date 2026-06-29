export default function ActionMenu({
    title,
    open,
    onOpenChange,
    actions = [],
    ariaLabel = "Open actions"
}) {
    return (
        <div className="eg-overflow-menu-wrap">
            <button
                type="button"
                className="eg-overflow-button"
                onClick={() => onOpenChange(!open)}
                aria-label={ariaLabel}
            >
                ⋮
            </button>

            {open && (
                <div
                    className="task-action-backdrop"
                    onClick={() => onOpenChange(false)}
                >
                    <div
                        className="task-action-sheet"
                        onClick={event => event.stopPropagation()}
                    >
                        {title && <h3>{title}</h3>}

                        {actions.map(action => (
                            <button
                                key={action.label}
                                type="button"
                                className={action.danger ? "danger" : ""}
                                onClick={() => {
                                    onOpenChange(false)
                                    action.onClick?.()
                                }}
                            >
                                {action.label}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}