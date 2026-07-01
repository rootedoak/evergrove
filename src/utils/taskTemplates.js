const taskTemplates = {
    birthday: [
        "Buy birthday gift for {{name}}",
        "Wrap birthday present for {{name}}",
        "Order or pick up birthday cake",
    ],

    camping: [
        "Pack tent",
        "Buy ice",
        "Fill propane",
        "Charge lanterns",
    ],

    trip: [
        "Confirm reservation",
        "Pack bags",
        "Check weather",
        "Charge devices",
    ],

    christmas: [
        "Make Christmas gift list",
        "Buy Christmas gifts",
        "Wrap Christmas presents",
        "Plan Christmas meal",
        "Check Christmas decorations",
    ],

    christmas_gifts: [
        "Make Christmas gift list",
        "Set Christmas gift budget",
        "Buy Christmas gifts",
    ],

    christmas_shopping: [
        "Check Christmas shopping list",
        "Buy stocking stuffers",
        "Pick up wrapping paper",
    ],

    christmas_meal: [
        "Plan Christmas meal",
        "Make Christmas grocery list",
        "Confirm who is coming for Christmas",
    ],

    christmas_final: [
        "Wrap remaining Christmas presents",
        "Prepare Christmas Eve items",
        "Charge camera or phone for pictures",
    ],

    independence_day_prep: [
        "Plan July 4th meal",
        "Buy drinks and ice",
        "Buy fireworks",
        "Pick up grilling supplies",
        "Check outdoor chairs and shade",
    ],

    independence_day_final: [
        "Set out sunscreen",
        "Pack cooler",
        "Review July 4th plans",
    ],

    halloween_prep: [
        "Decide on Halloween costumes",
        "Buy Halloween candy",
        "Check Halloween decorations",
    ],

    halloween_final: [
        "Set out costumes",
        "Charge phone for pictures",
        "Prepare candy bowl",
    ],

    thanksgiving_prep: [
        "Plan Thanksgiving menu",
        "Confirm who is coming for Thanksgiving",
        "Make Thanksgiving grocery list",
        "Check serving dishes and cookware",
    ],

    thanksgiving_shopping: [
        "Buy Thanksgiving groceries",
        "Pick up drinks and ice",
        "Check pantry staples",
    ],

    thanksgiving_final: [
        "Thaw turkey if needed",
        "Clean main gathering areas",
        "Set out serving dishes",
        "Prep make-ahead sides",
    ],
}

export function getTaskTemplate(type, values = {}) {
    const template = taskTemplates[type] || []

    return template.map(task =>
        replaceTemplateValues(task, values)
    )
}

function replaceTemplateValues(text, values) {
    return Object.entries(values).reduce(
        (result, [key, value]) =>
            result.replaceAll(`{{${key}}}`, value || ""),
        text
    )
}