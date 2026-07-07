import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts"

export default function AnalyticsBarChart({
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
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{
                                top: 10,
                                right: 24,
                                left: 24,
                                bottom: 10
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis
                                type="category"
                                dataKey={xKey}
                                width={90}
                            />
                            <Tooltip />
                            <Bar
                                dataKey={yKey}
                                radius={[0, 8, 8, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}