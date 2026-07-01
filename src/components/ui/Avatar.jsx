import { useEffect, useState } from "react"

export default function Avatar({
    member,
    name,
    avatarUrl,
    emoji,
    size = "md",
    className = ""
}) {
    const displayName = member?.name || name || ""
    const displayEmoji = member?.avatar_emoji || emoji || ""
    const displayUrl = member?.avatar_url || avatarUrl || ""

    const [imageFailed, setImageFailed] = useState(false)

    useEffect(() => {
        setImageFailed(false)
    }, [displayUrl])

    return (
        <span className={`eg-avatar eg-avatar-${size} ${className}`}>
            {displayUrl && !imageFailed ? (
                <img
                    src={displayUrl}
                    alt={displayName || "Family member"}
                    onError={() => setImageFailed(true)}
                />
            ) : displayEmoji ? (
                <span className="eg-avatar-emoji">{displayEmoji}</span>
            ) : (
                <strong>{getInitials(displayName)}</strong>
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