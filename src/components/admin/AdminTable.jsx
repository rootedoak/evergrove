export default function AdminTable({
    columns,
    rows,
    emptyMessage = "No records found.",
    onRowClick
}) {
    if (!rows?.length) {
        return (
            <div className="admin-empty-state">
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className="admin-table-wrap">
            <table className="admin-table">
                <thead>
                    <tr>
                        {columns.map(column => (
                            <th key={column.key}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.map(row => (
                        <tr
                            key={row.id}
                            onClick={() => onRowClick?.(row)}
                            className={onRowClick ? "clickable" : ""}
                        >
                            {columns.map(column => (
                                <td key={column.key}>
                                    {column.render
                                        ? column.render(row)
                                        : row[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}