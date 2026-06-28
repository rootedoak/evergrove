export default function TextAreaField({
    label,
    value,
    onChange,
    placeholder,
    rows = 3,
}) {
    return (
        <label className="eg-field">
            <span>{label}</span>

            <textarea
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                rows={rows}
            />
        </label>
    )
}