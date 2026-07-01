import { Check, Plus, ShoppingCart, Trash2 } from "lucide-react"

import SectionCard from "../ui/SectionCard"
import Button from "../ui/Button"
import EmptyState from "../ui/EmptyState"

export default function GrocerySummaryCard({
    groceryExpanded,
    setGroceryExpanded,
    openGroceryItems,
    handleGenerateShoppingList,
    handleCreateGroceryItem,
    groceryForm,
    setGroceryForm,
    shoppingCategoryOrder,
    groceryItemsByCategory,
    toggleGroceryItem,
    deleteGroceryItem,
    loadData
}) {
    return (
        <SectionCard
            title="Groceries"
            subtitle="Generated from planned home meals."
            action={
                <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={handleGenerateShoppingList}
                    disabled={openGroceryItems.length === 0}
                >
                    <ShoppingCart size={16} />
                    Build List
                </Button>
            }
        >
            <button
                type="button"
                className="eg-grocery-summary-row"
                onClick={() => setGroceryExpanded(current => !current)}
            >
                <div className="eg-grocery-summary-icon">
                    🛒
                </div>

                <div className="eg-grocery-summary-content">
                    <strong>
                        {openGroceryItems.length} item{openGroceryItems.length === 1 ? "" : "s"} remaining
                    </strong>

                    <span>
                        Generated from planned meals
                    </span>
                </div>

                <span className="eg-grocery-summary-action">
                    {groceryExpanded ? "Hide" : "View"}
                </span>
            </button>

            {groceryExpanded && (
                <div className="grocery-layout">
                    <form onSubmit={handleCreateGroceryItem} className="form-stack grocery-form">
                        <input
                            className="form-input"
                            value={groceryForm.name}
                            onChange={event =>
                                setGroceryForm({ ...groceryForm, name: event.target.value })
                            }
                            placeholder="Item"
                        />

                        <div className="two-column-form">
                            <input
                                className="form-input"
                                value={groceryForm.quantity}
                                onChange={event =>
                                    setGroceryForm({ ...groceryForm, quantity: event.target.value })
                                }
                                placeholder="Quantity"
                            />

                            <select
                                className="form-input"
                                value={groceryForm.category}
                                onChange={event =>
                                    setGroceryForm({
                                        ...groceryForm,
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
                            Add Grocery Item
                        </Button>
                    </form>

                    <div className="list-stack grocery-list-stack">
                        {groceryItemsByCategory.length === 0 && (
                            <EmptyState
                                title="No groceries yet"
                                message="Plan meals or add grocery items manually."
                            />
                        )}

                        {groceryItemsByCategory.map(([category, items]) => (
                            <div key={category} className="grocery-category-group">
                                <div className="grocery-category-header">
                                    <h4>{category}</h4>
                                    <span>
                                        {items.length} item{items.length === 1 ? "" : "s"}
                                    </span>
                                </div>

                                {items.map(group => (
                                    <div key={group.name} className="list-row consolidated-grocery-row">
                                        <button
                                            className={group.checked ? "check-button checked" : "check-button"}
                                            type="button"
                                            onClick={async () => {
                                                await Promise.all(
                                                    group.items.map(item =>
                                                        toggleGroceryItem(item.id, !group.checked)
                                                    )
                                                )

                                                await loadData()
                                            }}
                                        >
                                            {group.checked && <Check size={14} />}
                                        </button>

                                        <div className="row-grow">
                                            <p className={group.checked ? "row-title completed" : "row-title"}>
                                                {group.quantity ? `${group.quantity} ` : ""}
                                                {group.name}
                                                {group.items.length > 1 ? ` (${group.items.length})` : ""}
                                            </p>

                                            {group.usedIn.length > 0 && (
                                                <div className="used-in-list">
                                                    <p>Used In:</p>

                                                    <ul>
                                                        {group.usedIn.map(mealName => (
                                                            <li key={mealName}>{mealName}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            className="icon-danger-button"
                                            type="button"
                                            onClick={async () => {
                                                await Promise.all(
                                                    group.items.map(item => deleteGroceryItem(item.id))
                                                )

                                                await loadData()
                                            }}
                                            aria-label="Delete grocery item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </SectionCard>
    )
}