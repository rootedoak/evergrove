import SectionCard from "../ui/SectionCard"

export default function AttentionCard({
    overdueCount = 0,
    todayEventsCount = 0,
    unreadInboxCount = 0,
    announcementsCount = 0,
    onOpenOverdue,
    onOpenToday,
    onOpenInbox,
    onOpenAnnouncements,
}) {
    return (
        <SectionCard title="Attention">
            <div className="eg-attention-grid">
                <AttentionMetric
                    value={overdueCount}
                    label="Overdue"
                    sublabel="To-Dos"
                    tone="danger"
                    onClick={onOpenOverdue}
                />

                <AttentionMetric
                    value={todayEventsCount}
                    label="Schedule"
                    sublabel="Today"
                    tone="warning"
                    onClick={onOpenToday}
                />

                <AttentionMetric
                    value={unreadInboxCount}
                    label="Inbox"
                    sublabel="Unread"
                    tone="primary"
                    onClick={onOpenInbox}
                />

                <AttentionMetric
                    value={announcementsCount}
                    label="Updates"
                    sublabel="Household"
                    tone="primary"
                    onClick={onOpenAnnouncements}
                />
            </div>
        </SectionCard>
    )
}

function AttentionMetric({ value, label, sublabel, tone, onClick }) {
    const Wrapper = onClick ? "button" : "div"

    return (
        <Wrapper
            type={onClick ? "button" : undefined}
            className="eg-attention-metric"
            onClick={onClick}
        >
            <span className={`eg-attention-dot ${tone}`}>
                {value}
            </span>

            <strong>{label}</strong>
            <small>{sublabel}</small>
        </Wrapper>
    )
}