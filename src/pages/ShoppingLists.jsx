import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    Archive,
    Check,
    Plus,
    ShoppingCart,
    Trash2
} from "lucide-react"

import usePreferences from "../hooks/usePreferences"
import {
    archiveShoppingList,
    createShoppingList,
    createShoppingListItem,
    deleteShoppingList,
    deleteShoppingListItem,
    getShoppingLists,
    toggleShoppingListItem
} from "../services/shoppingService"

import AppPage from "../components/ui/AppPage"
import PageHeader from "../components/ui/PageHeader"
import Button from "../components/ui/Button"
import InsightCard from "../components/dashboard/InsightCard"
import SectionCard from "../components/ui/SectionCard"

const defaultShoppingCategoryOrder = [
    "Produce",
    "Meat",
    "Dairy",
    "Frozen",
    "Pantry",
    "Household",
    "Uncategorized"
]

function getItemMealSource(item) {
    return (
        item.meal_name ||
        item.source_meal_name ||
        item.used_in ||
        item.meal_plan_name ||
        item.metadata?.meal_name ||
        item.metadata?.source_meal_name ||
        item.metadata?.used_in ||
        ""
    )
}

export default function ShoppingLists() {
    const location = useLocation()
    const navigate = useNavigate()
    const createListRef = useRef(null)
    const addItemRef = useRef(null)

    const { preferences } = usePreferences()

    const shoppingCategoryOrder =
        preferences?.shopping_category_order?.length
            ? preferences.shopping_category_order
            : defaultShoppingCategoryOrder

    const [shoppingLists, setShoppingLists] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedListId, setSelectedListId] = useState("")
    const [newListTitle, setNewListTitle] = useState("")
    const [shoppingMode, setShoppingMode] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
    const [selectedItemInfo, setSelectedItemInfo] = useState(null)
    const [showListForm, setShowListForm] = useState(false)

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

    useEffect(() => {
        function handleResize() {
            setIsMobile(window.innerWidth <= 768)
        }

        window.addEventListener("resize", handleResize)

        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        if (!location.state?.openShoppingForm) return

        setShoppingMode(false)

        setTimeout(() => {
            if (selectedListId) {
                addItemRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                })
            } else {
                createListRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                })
            }
        }, 100)

        navigate(location.pathname, { replace: true, state: {} })
    }, [location, navigate, selectedListId])

    const sortedShoppingLists = useMemo(() => {
        return shoppingLists
            .filter(list => list.status !== "archived")
            .sort((a, b) => {
                if (a.status !== b.status) {
                    return a.status === "active" ? -1 : 1
                }

                return new Date(b.created_at || 0) - new Date(a.created_at || 0)
            })
    }, [shoppingLists])

    const selectedList = useMemo(() => {
        return shoppingLists.find(list => list.id === selectedListId)
    }, [shoppingLists, selectedListId])

    const selectedItems = selectedList?.shopping_list_items || []

    const openItemCount = selectedItems.filter(item => !item.checked).length
    const completedItemCount = selectedItems.filter(item => item.checked).length
    const totalItemCount = openItemCount + completedItemCount

    const completionPercentage =
        totalItemCount === 0
            ? 0
            : Math.round((completedItemCount / totalItemCount) * 100)

    const itemsByCategory = useMemo(() => {
        const groups = {}

        selectedItems.forEach(item => {
            const category = item.category?.trim() || "Uncategorized"

            if (!groups[category]) {
                groups[category] = []
            }

            groups[category].push(item)
        })

        return Object.entries(groups).sort(([categoryA], [categoryB]) => {
            const indexA = shoppingCategoryOrder.indexOf(categoryA)
            const indexB = shoppingCategoryOrder.indexOf(categoryB)

            if (indexA !== -1 && indexB !== -1) return indexA - indexB
            if (indexA !== -1) return -1
            if (indexB !== -1) return 1

            return categoryA.localeCompare(categoryB)
        })
    }, [selectedItems, shoppingCategoryOrder])

    function getListStats(list) {
        const items = list.shopping_list_items || []
        const remaining = items.filter(item => !item.checked).length
        const completed = items.filter(item => item.checked).length
        const total = remaining + completed
        const percent =
            total === 0 ? 0 : Math.round((completed / total) * 100)

        return { remaining, completed, total, percent }
    }

    async function handleCreateList(event) {
        event.preventDefault()
        if (!newListTitle.trim()) return

        const list = await createShoppingList({
            title: newListTitle,
            items: []
        })

        setNewListTitle("")
        setSelectedListId(list.id)
        setShowListForm(false)
        await loadData()
    }

    async function handleCreateItem(event) {
        event.preventDefault()
        if (!selectedList?.id || !itemForm.name.trim()) return

        await createShoppingListItem({
            shoppingListId: selectedList.id,
            name: itemForm.name,
            quantity: itemForm.quantity,
            category: itemForm.category || "Uncategorized"
        })

        setItemForm({
            name: "",
            quantity: "",
            category: ""
        })

        await loadData()
    }

    async function handleArchiveSelectedList() {
        if (!selectedList?.id) return

        await archiveShoppingList(selectedList.id)
        setShoppingMode(false)
        await loadData()
    }

    async function handleDeleteSelectedList() {
        if (!selectedList?.id) return
        if (!window.confirm("Delete this shopping list?")) return

        await deleteShoppingList(selectedList.id)
        setSelectedListId("")
        setShoppingMode(false)
        await loadData()
    }

    function handleHeaderAdd() {
        if (!selectedList) {
            setShowListForm(true)
            return
        }

        setShoppingMode(false)

        setTimeout(() => {
            addItemRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            })
        }, 100)
    }

    if (loading) {
        return <p className="muted-text">Loading shopping lists...</p>
    }

    return (
        <AppPage>
            <PageHeader
                eyebrow="Shopping"
                title="Shopping Lists"
                subtitle="Build shared household shopping lists for groceries, errands, and weekly needs."
                action={
                    <Button size="sm" onClick={handleHeaderAdd}>
                        <Plus size={16} />
                        Add
                    </Button>
                }
            />

            <div className="eg-stack">
                {error && <div className="error-banner">{error}</div>}

                <InsightCard
                    insight={{
                        title: selectedList
                            ? `${openItemCount} item${openItemCount === 1 ? "" : "s"} remaining`
                            : "No shopping list selected",
                        description: selectedList
                            ? `${completionPercentage}% complete • ${selectedList.title}`
                            : "Create a shopping list or generate one from Meals.",
                        actionLabel: selectedList
                            ? "Start Shopping"
                            : "Create List"
                    }}
                    onAction={() => {
                        if (selectedList) {
                            setShoppingMode(true)
                        } else {
                            setShowListForm(true)
                        }
                    }}
                />

                {showListForm && !shoppingMode && (
                    <SectionCard
                        title="Create Shopping List"
                        subtitle="Start a new household shopping list."
                        actions={<ShoppingCart size={20} />}
                    >
                        <form
                            ref={createListRef}
                            onSubmit={handleCreateList}
                            className="form-stack"
                        >
                            <div className="two-column-form">
                                <input
                                    className="form-input"
                                    value={newListTitle}
                                    onChange={event => setNewListTitle(event.target.value)}
                                    placeholder="Example: Weekly Groceries"
                                />

                                <Button type="submit">
                                    <Plus size={16} />
                                    Create List
                                </Button>
                            </div>
                        </form>
                    </SectionCard>
                )}

                {shoppingLists.length > 0 ? (
                    <SectionCard
                        title={shoppingMode ? "Shopping Mode" : "Shopping Lists"}
                        subtitle={
                            shoppingMode
                                ? "Tap items as you shop."
                                : "Select a list, then manage its items."
                        }
                        action={
                            <div className="eg-actions-row">
                                <Button
                                    size="sm"
                                    variant={shoppingMode ? "secondary" : "primary"}
                                    onClick={() => setShoppingMode(current => !current)}
                                    disabled={!selectedList}
                                >
                                    {shoppingMode ? "Exit Shopping" : "Start Shopping"}
                                </Button>

                                {!shoppingMode && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleArchiveSelectedList}
                                            disabled={!selectedList}
                                        >
                                            <Archive size={16} />
                                            Archive
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleDeleteSelectedList}
                                            disabled={!selectedList}
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </div>
                        }
                    >
                        <div className={shoppingMode ? "shopping-mode-layout" : "shopping-master-detail"}>
                            {!shoppingMode && (
                                <div className="shopping-list-sidebar">
                                    {sortedShoppingLists.map(list => {
                                        const stats = getListStats(list)
                                        const isSelected = list.id === selectedListId

                                        return (
                                            <button
                                                key={list.id}
                                                type="button"
                                                onClick={() => setSelectedListId(list.id)}
                                                className={
                                                    isSelected
                                                        ? "shopping-list-card selected"
                                                        : "shopping-list-card"
                                                }
                                            >
                                                <div className="eg-shopping-list-card-content">
                                                    <strong>{list.title}</strong>

                                                    <span>
                                                        {stats.remaining} remaining
                                                        {stats.completed > 0
                                                            ? ` • ${stats.completed} done`
                                                            : ""}
                                                    </span>

                                                    <div className="shopping-progress-bar">
                                                        <div
                                                            className="shopping-progress-fill"
                                                            style={{ width: `${stats.percent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="shopping-list-detail">
                                {selectedList ? (
                                    <>
                                        <div className="eg-shopping-current-summary compact">
                                            <div>
                                                <h3>{selectedList.title}</h3>

                                                <span>
                                                    {openItemCount} remaining • {completedItemCount} completed
                                                </span>
                                            </div>

                                            <strong>{completionPercentage}%</strong>
                                        </div>

                                        <div className="shopping-progress-bar">
                                            <div
                                                className="shopping-progress-fill"
                                                style={{ width: `${completionPercentage}%` }}
                                            />
                                        </div>

                                        <div className="shopping-progress-bar">
                                            <div
                                                className="shopping-progress-fill"
                                                style={{ width: `${completionPercentage}%` }}
                                            />
                                        </div>

                                        {!shoppingMode && (
                                            <form
                                                ref={addItemRef}
                                                onSubmit={handleCreateItem}
                                                className="form-stack shopping-item-form"
                                            >
                                                <div className="three-column-form">
                                                    <input
                                                        className="form-input"
                                                        value={itemForm.name}
                                                        onChange={event =>
                                                            setItemForm({
                                                                ...itemForm,
                                                                name: event.target.value
                                                            })
                                                        }
                                                        placeholder="Item"
                                                    />

                                                    <input
                                                        className="form-input"
                                                        value={itemForm.quantity}
                                                        onChange={event =>
                                                            setItemForm({
                                                                ...itemForm,
                                                                quantity: event.target.value
                                                            })
                                                        }
                                                        placeholder="Quantity"
                                                    />

                                                    <select
                                                        className="form-input"
                                                        value={itemForm.category}
                                                        onChange={event =>
                                                            setItemForm({
                                                                ...itemForm,
                                                                category: event.target.value
                                                            })
                                                        }
                                                    >
                                                        <option value="">Category</option>

                                                        {shoppingCategoryOrder.map(category => (
                                                            <option key={category} value={category}>
                                                                {category}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <Button variant="secondary" type="submit">
                                                    <Plus size={16} />
                                                    Add Item
                                                </Button>
                                            </form>
                                        )}

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
                                                            <div
                                                                key={item.id}
                                                                className={
                                                                    shoppingMode
                                                                        ? "eg-shopping-item-row shopping-mode-item"
                                                                        : "eg-shopping-item-row"
                                                                }
                                                            >
                                                                <button
                                                                    className={
                                                                        item.checked
                                                                            ? "check-button checked"
                                                                            : "check-button"
                                                                    }
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        await toggleShoppingListItem(
                                                                            item.id,
                                                                            !item.checked
                                                                        )
                                                                        await loadData()
                                                                    }}
                                                                >
                                                                    {item.checked && <Check size={14} />}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="row-grow shopping-item-info-trigger"
                                                                    onClick={() => setSelectedItemInfo(item)}
                                                                >
                                                                    <p
                                                                        className={
                                                                            item.checked
                                                                                ? "row-title completed"
                                                                                : "row-title"
                                                                        }
                                                                    >
                                                                        {item.quantity ? `${item.quantity} ` : ""}
                                                                        {item.name}
                                                                    </p>
                                                                </button>

                                                                {!shoppingMode && (
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
                                                                )}
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
                    </SectionCard>
                ) : (
                    <SectionCard>
                        <p className="muted-text">
                            No shopping lists yet. Create one above or generate one from the Meals page.
                        </p>
                    </SectionCard>
                )}

                {selectedItemInfo && (
                    <div
                        className="task-action-backdrop"
                        onClick={() => setSelectedItemInfo(null)}
                    >
                        <div
                            className="task-action-sheet"
                            onClick={event => event.stopPropagation()}
                        >
                            <h3>{selectedItemInfo.name}</h3>

                            <p className="muted-text">
                                {selectedItemInfo.quantity
                                    ? `Quantity: ${selectedItemInfo.quantity}`
                                    : "No quantity listed"}
                            </p>

                            <p className="muted-text">
                                Category: {selectedItemInfo.category || "Uncategorized"}
                            </p>

                            <p className="muted-text">
                                Used in: {getItemMealSource(selectedItemInfo) || "No linked meal found"}
                            </p>

                            <button
                                type="button"
                                onClick={() => setSelectedItemInfo(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppPage>
    )
}