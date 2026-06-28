import { ChevronRight } from "lucide-react"

export default function TimelineRow({
    icon,
    title,
    subtitle,
    meta,
    detail,
    onClick,
}) {
    const Wrapper = onClick ? "button" : "div"

    return (
        <Wrapper
            type={onClick ? "button" : undefined}
            className="eg-timeline-row"
            onClick={onClick}
        >
            <span className="eg-timeline-icon">
                {icon}
            </span>

            <div className="eg-timeline-content">
                <strong>{title}</strong>

                {subtitle && <p>{subtitle}</p>}

                {detail && <small>{detail}</small>}
            </div>

            <div className="eg-timeline-meta">
                {meta && <span>{meta}</span>}
                {onClick && <ChevronRight size={17} />}
            </div>
        </Wrapper>
    )
}