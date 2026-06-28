export default function SectionHeader({ title, action }) {
    return (
        <div className="eg-row-between">
            <h2 className="eg-section-title">{title}</h2>
            {action}
        </div>
    )
}