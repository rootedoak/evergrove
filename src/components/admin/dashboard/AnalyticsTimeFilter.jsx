const options = [
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
    { label: "90 Days", value: 90 },
    { label: "1 Year", value: 365 }
]

export default function AnalyticsTimeFilter({ value, onChange }) {
    return (
        <div className="analytics-time-filter">
            {options.map(option => (
                <button
                    key={option.value}
                    type="button"
                    className={
                        value === option.value
                            ? "active"
                            : ""
                    }
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}