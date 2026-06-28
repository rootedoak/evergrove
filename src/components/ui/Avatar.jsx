export default function Avatar({
    name = "",
    image,
    size = "md",
}) {
    const initials = getInitials(name)

    return (
        <span className={`eg-avatar ${size}`}>
            {image ? (
                <img src={image} alt="" />
            ) : (
                initials
            )}
        </span>
    )
}

function getInitials(name) {
    if (!name) return "?"

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase()
}