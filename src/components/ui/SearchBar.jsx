import { Search } from "lucide-react"

export default function SearchBar({
    value,
    onChange,
    placeholder = "Search..."
}) {
    return (
        <div className="eg-search-field">
            <Search size={16} />

            <input
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
            />
        </div>
    )
}