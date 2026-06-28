import { ChevronRight } from "lucide-react"

export default function ListRow({
    icon,
    title,
    subtitle,
    meta,
    action,
    onClick,
    completed = false,
    danger = false,
}) {
    const Wrapper = onClick ? "button" : "div"

    return (
        <Wrapper
            type={onClick ? "button" : undefined}
            className={`eg-list-row ${completed ? "completed" : ""} ${danger ? "danger" : ""}`}
            onClick={onClick}
        >
            {icon && (
                <span className="eg-list-row-icon">
                    {icon}
                </span>
            )}

            <div className="eg-list-row-content">
                <strong>{title}</strong>

                {subtitle && (
                    <p>{subtitle}</p>
                )}

                {meta && (
                    <small>{meta}</small>
                )}
            </div>

            {action ? (
                <div className="eg-list-row-action">
                    {action}
                </div>
            ) : onClick ? (
                <ChevronRight size={18} />
            ) : null}
        </Wrapper>
    )
}