export default function SelectField({
    label,
    value,
    onChange,
    options = [],
}) {
    return (
        <label className="eg-field">
            <span>{label}</span>

            <select
                value={value}
                onChange={event => onChange(event.target.value)}
            >
                {options.map(option => (
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    )
}