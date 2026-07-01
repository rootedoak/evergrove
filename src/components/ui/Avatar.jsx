export default function Avatar({
    member,
    size = "md",
    className = ""
}) {
    const initials = getInitials(member?.name)
    const emoji = member?.avatar_emoji

    return (
        <span className={`eg-avatar eg-avatar-${size} ${className}`}>
            {member?.avatar_url ? (
                <img
                    src={member.avatar_url}
                    alt={member.name || "Family member"}
                />
            ) : emoji ? (
                <span className="eg-avatar-emoji">{emoji}</span>
            ) : (
                <strong>{initials}</strong>
            )}
        </span>
    )
}

function getInitials(name = "") {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join("") || "?"
}