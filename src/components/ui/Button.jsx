export default function Button({
    children,
    variant = "primary",
    size = "md",
    type = "button",
    className = "",
    ...props
}) {
    return (
        <button
            type={type}
            className={`eg-button ${variant} ${size} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}