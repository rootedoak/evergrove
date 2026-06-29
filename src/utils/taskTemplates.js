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