export default function TextField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
}) {
    return (
        <label className="eg-field">
            <span>{label}</span>

            <input
                type={type}
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                required={required}
            />
        </label>
    )
}