import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts"

export default function AnalyticsLineChart({
    title,
    description,
    data,
    xKey,
    yKey,
    emptyMessage = "No chart data yet."
}) {
    return (
        <div className="admin-chart-card">
            <div className="admin-chart-header">
                <h3>{title}</h3>
                {description && <p>{description}</p>}
            </div>

            {!data?.length ? (
                <div className="admin-empty-state">
                    {emptyMessage}
                </div>
            ) : (
                <div className="admin-chart-body">
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 24,
                                left: 8,
                                bottom: 10
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xKey} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey={yKey}
                                strokeWidth={3}
                                dot
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}