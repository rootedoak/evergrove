import { Plus, Star, UtensilsCrossed } from "lucide-react"

import SectionCard from "../ui/SectionCard"
import Button from "../ui/Button"
import EmptyState from "../ui/EmptyState"
import SearchBar from "../ui/SearchBar"

export default function SavedMealsSection({
    showMealForm,
    handleCreateMeal,
    mealForm,
    setMealForm,
    shoppingCategoryOrder,
    updateIngredient,
    addIngredientRow,
    removeIngredientRow,
    editingMealId,
    cancelEditMeal,
    mealSearch,
    setMealSearch,
    filteredMeals,
    quickAddMealId,
    quickAddDate,
    setQuickAddDate,
    quickAddNotes,
    setQuickAddNotes,
    startQuickAdd,
    cancelQuickAdd,
    handleQuickAdd,
    mealMenuOpen,
    setMealMenuOpen,
    startEditMeal,
    deleteMeal,
    meals,
    setMeals
}) {
    return (
        <SectionCard
            title="Saved Meals"
            subtitle={`${filteredMeals.length} meal${filteredMeals.length === 1 ? "" : "s"} ready to plan`}
            actions={<UtensilsCrossed size={20} />}
        >
            {showMealForm && (
                <form onSubmit={handleCreateMeal} className="eg-meal-form">
                    <div className="eg-form-grid">
                        <input
                            className="form-input"
                            value={mealForm.name}
                            onChange={event =>
                                setMealForm({ ...mealForm, name: event.target.value })
                            }
                            placeholder="Meal name"
                        />

                        <select
                            className="form-input"
                            value={mealForm.category}
                            onChange={event =>
                                setMealForm({
                                    ...mealForm,
                                    category: event.target.value
                                })
                            }
                        >
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Dessert">Dessert</option>
                            <option value="Snack">Snack</option>
                        </select>
                    </div>

                    <input
                        className="form-input"
                        value={mealForm.description}
                        onChange={event =>
                            setMealForm({ ...mealForm, description: event.target.value })
                        }
                        placeholder="Short description"
                    />

                    <input
                        className="form-input"
                        value={mealForm.recipe_url}
                        onChange={event =>
                            setMealForm({
                                ...mealForm,
                                recipe_url: event.target.value
                            })
                        }
                        placeholder="Recipe URL"
                    />

                    <label className="eg-check-row">
                        <input
                            type="checkbox"
                            checked={mealForm.is_favorite}
                            onChange={event =>
                                setMealForm({
                                    ...mealForm,
                                    is_favorite: event.target.checked
                                })
                            }
                        />

                        <span>Mark as favorite</span>
                    </label>

                    <div className="eg-ingredient-section">
                        <div className="eg-section-mini-header">
                            <strong>Ingredients</strong>
                            <span>{mealForm.ingredients.length}</span>
                        </div>

                        <div className="eg-ingredient-stack">
                            {mealForm.ingredients.map((ingredient, index) => (
                                <div key={index} className="eg-ingredient-row">
                                    <input
                                        className="form-input"
                                        value={ingredient.name}
                                        onChange={event =>
                                            updateIngredient(index, "name", event.target.value)
                                        }
                                        placeholder="Ingredient"
                                    />

                                    <input
                                        className="form-input"
                                        value={ingredient.quantity}
                                        onChange={event =>
                                            updateIngredient(index, "quantity", event.target.value)
                                        }
                                        placeholder="Qty"
                                    />

                                    <select
                                        className="form-input"
                                        value={ingredient.category}
                                        onChange={event =>
                                            updateIngredient(index, "category", event.target.value)
                                        }
                                    >
                                        <option value="">Category</option>

                                        {shoppingCategoryOrder.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        className="eg-mini-danger"
                                        onClick={() => removeIngredientRow(index)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        <Button variant="secondary" type="button" onClick={addIngredientRow}>
                            <Plus size={16} />
                            Add Ingredient
                        </Button>
                    </div>

                    <div className="eg-actions-row">
                        <Button type="submit">
                            {editingMealId ? "Update Meal" : "Save Meal"}
                        </Button>

                        {editingMealId && (
                            <Button variant="secondary" type="button" onClick={cancelEditMeal}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            )}

            <SearchBar
                value={mealSearch}
                onChange={setMealSearch}
                placeholder="Search meals..."
            />

            <div className="eg-saved-meal-list">
                {filteredMeals.map(meal => {
                    const timesMade = meal.meal_plans?.length || 0

                    const lastMade =
                        meal.meal_plans?.length
                            ? [...meal.meal_plans]
                                .sort((a, b) =>
                                    b.planned_date.localeCompare(a.planned_date)
                                )[0]?.planned_date
                            : null

                    const lastMadeLabel = lastMade
                        ? new Date(`${lastMade}T00:00:00`).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric"
                        })
                        : null

                    return (
                        <div key={meal.id} className="eg-saved-meal-row">
                            <button
                                type="button"
                                className="eg-saved-meal-main"
                                onClick={() => startQuickAdd(meal)}
                            >
                                <div className="eg-meal-avatar">
                                    {meal.is_favorite ? <Star size={16} fill="currentColor" /> : "🍽️"}
                                </div>

                                <div>
                                    <strong>{meal.name}</strong>

                                    <p>
                                        {meal.category || "Dinner"}
                                        {timesMade > 0 ? ` • Made ${timesMade}x` : ""}
                                        {lastMadeLabel ? ` • Last ${lastMadeLabel}` : ""}
                                    </p>

                                    {meal.description && (
                                        <span>{meal.description}</span>
                                    )}
                                </div>
                            </button>

                            <button
                                type="button"
                                className="eg-overflow-button"
                                onClick={() =>
                                    setMealMenuOpen(
                                        mealMenuOpen === meal.id ? null : meal.id
                                    )
                                }
                                aria-label="Open meal actions"
                            >
                                ⋮
                            </button>

                            {quickAddMealId === meal.id && (
                                <div
                                    className="task-action-backdrop"
                                    onClick={cancelQuickAdd}
                                >
                                    <div
                                        className="task-action-sheet"
                                        onClick={event => event.stopPropagation()}
                                    >
                                        <h3>Add to Week</h3>

                                        <p className="muted-text">
                                            {meal.name}
                                        </p>

                                        <input
                                            className="form-input"
                                            type="date"
                                            value={quickAddDate}
                                            onChange={event => setQuickAddDate(event.target.value)}
                                        />

                                        <input
                                            className="form-input"
                                            value={quickAddNotes}
                                            onChange={event => setQuickAddNotes(event.target.value)}
                                            placeholder="Notes"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => handleQuickAdd(meal)}
                                        >
                                            Add Meal
                                        </button>

                                        <button
                                            type="button"
                                            onClick={cancelQuickAdd}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {mealMenuOpen === meal.id && (
                                <div
                                    className="task-action-backdrop"
                                    onClick={() => setMealMenuOpen(null)}
                                >
                                    <div
                                        className="task-action-sheet"
                                        onClick={event => event.stopPropagation()}
                                    >
                                        <h3>{meal.name}</h3>

                                        {meal.recipe_url && (
                                            <a
                                                href={
                                                    meal.recipe_url.startsWith("http")
                                                        ? meal.recipe_url
                                                        : `https://${meal.recipe_url}`
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                View Recipe
                                            </a>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMealMenuOpen(null)
                                                startEditMeal(meal)
                                            }}
                                        >
                                            Edit Meal
                                        </button>

                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={async () => {
                                                setMealMenuOpen(null)

                                                const previousMeals = meals

                                                setMeals(current =>
                                                    current.filter(item => item.id !== meal.id)
                                                )

                                                try {
                                                    await deleteMeal(meal.id)
                                                } catch (error) {
                                                    console.error(error)
                                                    setMeals(previousMeals)
                                                    alert(error.message || "Could not delete meal.")
                                                }
                                            }}
                                        >
                                            Delete Meal
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setMealMenuOpen(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {filteredMeals.length === 0 && (
                    <EmptyState
                        title="No saved meals found"
                        message="Try a different search or add a new saved meal."
                    />
                )}
            </div>
        </SectionCard>
    )
}