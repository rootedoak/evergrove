const HABIT_DEFAULT_RULES = [
    {
        keywords: [
            "read",
            "reading",
            "book",
            "study",
            "homework"
        ],
        icon: "BookOpen",
        color: "blue"
    },
    {
        keywords: [
            "exercise",
            "workout",
            "gym",
            "strength",
            "lift",
            "lifting"
        ],
        icon: "Dumbbell",
        color: "green"
    },
    {
        keywords: [
            "water",
            "hydrate",
            "hydration",
            "drink"
        ],
        icon: "Droplets",
        color: "teal"
    },
    {
        keywords: [
            "vitamin",
            "vitamins",
            "medicine",
            "medication",
            "pill",
            "supplement"
        ],
        icon: "Pill",
        color: "purple"
    },
    {
        keywords: [
            "walk",
            "walking",
            "steps",
            "run",
            "running",
            "jog"
        ],
        icon: "Footprints",
        color: "orange"
    },
    {
        keywords: [
            "fruit",
            "vegetable",
            "healthy food",
            "nutrition",
            "eat healthy"
        ],
        icon: "Apple",
        color: "red"
    },
    {
        keywords: [
            "sleep",
            "bed",
            "bedtime",
            "rest"
        ],
        icon: "Moon",
        color: "indigo"
    },
    {
        keywords: [
            "wake",
            "wake up",
            "morning",
            "sunlight"
        ],
        icon: "Sun",
        color: "yellow"
    },
    {
        keywords: [
            "meditate",
            "meditation",
            "mindfulness",
            "focus",
            "breathe",
            "breathing"
        ],
        icon: "Brain",
        color: "purple"
    },
    {
        keywords: [
            "gratitude",
            "thankful",
            "kindness",
            "love"
        ],
        icon: "Heart",
        color: "pink"
    },
    {
        keywords: [
            "journal",
            "journaling",
            "write",
            "writing"
        ],
        icon: "NotebookPen",
        color: "blue"
    },
    {
        keywords: [
            "brush teeth",
            "teeth",
            "floss",
            "dental"
        ],
        icon: "Smile",
        color: "teal"
    },
    {
        keywords: [
            "clean",
            "cleaning",
            "tidy",
            "organize"
        ],
        icon: "Sparkles",
        color: "teal"
    },
    {
        keywords: [
            "make bed",
            "bedroom",
            "room",
            "chores",
            "chore"
        ],
        icon: "House",
        color: "orange"
    },
    {
        keywords: [
            "dog",
            "pet",
            "feed pet",
            "feed dog",
            "feed cat"
        ],
        icon: "PawPrint",
        color: "orange"
    }
]

export const HABIT_COLORS = [
    "evergreen",
    "blue",
    "green",
    "teal",
    "purple",
    "orange",
    "yellow",
    "red",
    "pink",
    "indigo",
    "gray"
]

export function getHabitDefaults(name) {
    const normalizedName = String(name || "")
        .trim()
        .toLowerCase()

    if (!normalizedName) {
        return {
            icon: "Leaf",
            color: "evergreen"
        }
    }

    const matchingRule = HABIT_DEFAULT_RULES.find(
        rule =>
            rule.keywords.some(keyword =>
                normalizedName.includes(keyword)
            )
    )

    if (!matchingRule) {
        return {
            icon: "Leaf",
            color: "evergreen"
        }
    }

    return {
        icon: matchingRule.icon,
        color: matchingRule.color
    }
}