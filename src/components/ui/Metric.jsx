export default function Metric({
    label,
    value,
    tone = "primary",
}) {
    return (
        <div className={`eg-metric ${tone}`}>
            <strong>{value}</strong>
            <span>{label}</span>
        </div>
    )
}