import { useEffect, useMemo, useState } from "react"
import {
    Archive,
    Check,
    Plus,
    ShoppingCart,
    Trash2
} from "lucide-react"
import {
    archiveShoppingList,
    createShoppingList,
    createShoppingListItem,
    deleteShoppingList,
    deleteShoppingListItem,
    getShoppingLists,
    toggleShoppingListItem
} from "../services/shoppingService"

export default function ShoppingLists() {
    const [shoppingLists, setShoppingLists] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedListId, setSelectedListId] = useState("")
    const [newListTitle, setNewListTitle] = useState("")
    const [itemForm, setItemForm] = useState({
        name: "",
        quantity: "",
        category: ""
    })

    async function loadData() {
        try {
            setLoading(true)
            setError("")

            const data = await getShoppingLists()
            setShoppingLists(data)

            const activeList = data.find(list => list.status === "active")
            setSelectedListId(current =>
                current || activeList?.id || data[0]?.id || ""
            )
        } catch (err) {
            console.error(err)
            setError("Could not load shopping lists.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const selectedList = useMemo(() => {
        return shoppingLists.find(list => list.id === selectedListId)
    }, [shoppingLists, selectedListId])

    const itemsByCategory = useMemo(() => {
        const groups = {}

            ; (selectedList?.shopping_list_items || []).forEach(item => {
                const category = item.category?.trim() || "Uncategorized"

                if (!groups[category]) {
                    groups[category] = []
                }

                groups[category].push(item)
            })

        return Object.entries(groups).sort(([categoryA], [categoryB]) => {
            if (categoryA === "Uncategorized") return 1
            if (categoryB === "Uncategorized") return -1
            return categoryA.localeCompare(categoryB)
        })
    }, [selectedList])

    const openItemCount = (selectedList?.shopping_list_items || []).filter(
        item => !item.checked
    ).length

    const completedItemCount = (selectedList?.shopping_list_items || []).filter(
        item => item.checked
    ).length

    async function handleCreateList(event) {
        event.preventDefault()

        if (!newListTitle.trim()) return

        const list = await createShoppingList({
            title: newListTitle,
            items: []
        })

        setNewListTitle("")
        setSelectedListId(list.id)
        await loadData()
    }

    async function handleCreateItem(event) {
        event.preventDefault()

        if (!selectedList?.id || !itemForm.name.trim()) return

        await createShoppingListItem({
            shoppingListId: selectedList.id,
            name: itemForm.name,
            quantity: itemForm.quantity,
            category: itemForm.category
        })

        setItemForm({
            name: "",
            quantity: "",
            category: ""
        })

        await loadData()
    }

    if (loading) {
        return <p className="muted-text">Loading shopping lists...</p>
    }

    return (
        <div className="page-shell">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Evergrove</p>
                    <h2>Shopping Lists</h2>
                    <p>
                        Build shared household shopping lists for groceries, errands, and weekly needs.
                    </p>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="dashboard-grid">
                <section className="panel hero-panel">
                    <div className="panel-icon">
                        <ShoppingCart size={22} />
                    </div>

                    <div>
                        <p className="eyebrow">Selected List</p>
                        <h3>{selectedList?.title || "No shopping list yet"}</h3>
                        <p className="muted-text">
                            {openItemCount} remaining
                            {selectedList ? ` • ${completedItemCount} completed` : ""}
                        </p>
                    </div>
                </section>

                <section className="panel stat-panel">
                    <ShoppingCart size={22} />

                    <div>
                        <p className="eyebrow">Lists</p>
                        <h3>{shoppingLists.length}</h3>
                        <p className="muted-text">total lists</p>
                    </div>
                </section>
            </div>

            <section className="panel">
                <div className="section-heading">
                    <div>
                        <h3>Create Shopping List</h3>
                        <p>Start a new household shopping list.</p>
                    </div>
                    <ShoppingCart size={20} />
                </div>

                <form onSubmit={handleCreateList} className="form-stack">
                    <div className="two-column-form">
                        <input
                            className="form-input"
                            value={newListTitle}
                            onChange={event => setNewListTitle(event.target.value)}
                            placeholder="Example: Weekly Groceries"
                        />

                        <button className="primary-button" type="submit">
                            <Plus size={16} />
                            Create List
                        </button>
                    </div>
                </form>
            </section>

            {shoppingLists.length > 0 ? (
                <section className="panel">
                    <div className="section-heading">
                        <div>
                            <h3>Shopping Lists</h3>
                            <p>Select a list on the left, then manage its items on the right.</p>
                        </div>

                        <div className="button-row">
                            <button
                                className="secondary-button"
                                type="button"
                                onClick={async () => {
                                    if (!selectedList?.id) return
                                    await archiveShoppingList(selectedList.id)
                                    await loadData()
                                }}
                            >
                                <Archive size={16} />
                                Archive
                            </button>

                            <button
                                className="secondary-button"
                                type="button"
                                onClick={async () => {
                                    if (!selectedList?.id) return
                                    if (!window.confirm("Delete this shopping list?")) return
                                    await deleteShoppingList(selectedList.id)
                                    setSelectedListId("")
                                    await loadData()
                                }}
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </div>
                    </div>

                    <div className="shopping-master-detail">
                        <div className="shopping-list-sidebar">
                            {shoppingLists.map(list => {
                                const remainingCount = (list.shopping_list_items || []).filter(
                                    item => !item.checked
                                ).length

                                const completedCount = (list.shopping_list_items || []).filter(
                                    item => item.checked
                                ).length

                                const isSelected = list.id === selectedListId

                                return (
                                    <button
                                        key={list.id}
                                        type="button"
                                        onClick={() => setSelectedListId(list.id)}
                                        className={isSelected ? "shopping-list-card selected" : "shopping-list-card"}
                                    >
                                        <div>
                                            <p className="row-title">
                                                {list.title}
                                            </p>

                                            <p className="row-subtitle">
                                                {remainingCount} remaining
                                                {completedCount > 0 ? ` • ${completedCount} done` : ""}
                                            </p>

                                            {list.status === "archived" && (
                                                <span className="shopping-list-status">
                                                    Archived
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="shopping-list-detail">
                            {selectedList ? (
                                <>
                                    <div className="shopping-detail-header">
                                        <div>
                                            <p className="eyebrow">Current List</p>
                                            <h3>{selectedList.title}</h3>
                                            <p className="muted-text">
                                                {openItemCount} remaining • {completedItemCount} completed
                                            </p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleCreateItem} className="form-stack shopping-item-form">
                                        <div className="three-column-form">
                                            <input
                                                className="form-input"
                                                value={itemForm.name}
                                                onChange={event =>
                                                    setItemForm({ ...itemForm, name: event.target.value })
                                                }
                                                placeholder="Item"
                                            />

                                            <input
                                                className="form-input"
                                                value={itemForm.quantity}
                                                onChange={event =>
                                                    setItemForm({ ...itemForm, quantity: event.target.value })
                                                }
                                                placeholder="Quantity"
                                            />

                                            <input
                                                className="form-input"
                                                value={itemForm.category}
                                                onChange={event =>
                                                    setItemForm({ ...itemForm, category: event.target.value })
                                                }
                                                placeholder="Category"
                                            />
                                        </div>

                                        <button className="secondary-button" type="submit">
                                            <Plus size={16} />
                                            Add Item
                                        </button>
                                    </form>

                                    <div className="list-stack grocery-list-stack">
                                        {itemsByCategory.length === 0 ? (
                                            <p className="muted-text">
                                                No items on this list yet.
                                            </p>
                                        ) : (
                                            itemsByCategory.map(([category, items]) => (
                                                <div key={category} className="grocery-category-group">
                                                    <div className="grocery-category-header">
                                                        <h4>{category}</h4>
                                                        <span>
                                                            {items.length} item{items.length === 1 ? "" : "s"}
                                                        </span>
                                                    </div>

                                                    {items.map(item => (
                                                        <div key={item.id} className="list-row consolidated-grocery-row">
                                                            <button
                                                                className={item.checked ? "check-button checked" : "check-button"}
                                                                type="button"
                                                                onClick={async () => {
                                                                    await toggleShoppingListItem(item.id, !item.checked)
                                                                    await loadData()
                                                                }}
                                                            >
                                                                {item.checked && <Check size={14} />}
                                                            </button>

                                                            <div className="row-grow">
                                                                <p className={item.checked ? "row-title completed" : "row-title"}>
                                                                    {item.quantity ? `${item.quantity} ` : ""}
                                                                    {item.name}
                                                                </p>
                                                            </div>

                                                            <button
                                                                className="icon-danger-button"
                                                                type="button"
                                                                onClick={async () => {
                                                                    await deleteShoppingListItem(item.id)
                                                                    await loadData()
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="muted-text">
                                    Select a shopping list to view details.
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            ) : (
                <section className="panel">
                    <p className="muted-text">
                        No shopping lists yet. Create one above or generate one from the Meals page.
                    </p>
                </section>
            )}
        </div>
    )
}