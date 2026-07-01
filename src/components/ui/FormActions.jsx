export default function FormActions({
    children,
    align = "end",
    stacked = false,
    className = ""
}) {
    return (
        <div
            className={[
                "eg-form-actions",
                align === "between" ? "between" : "",
                stacked ? "stacked" : "",
                className
            ].filter(Boolean).join(" ")}
        >
            {children}
        </div>
    )
}