export function getInitials(name = "") {
    return name
        .split(" ")
        .filter(Boolean)
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

export function getVisibilityLabel(visibility) {
    return visibility === "private" ? "Private" : "Household"
}

export function getVisibilityIcon(visibility) {
    return visibility === "private" ? "🔒" : "🏠"
}