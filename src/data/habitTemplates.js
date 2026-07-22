import {
    BookOpen,
    BriefcaseBusiness,
    Dumbbell,
    HeartHandshake,
    House,
    Music,
    PackageCheck,
    PawPrint,
    Pill,
    Sparkles,
    UsersRound,
    Utensils,
    Waves
} from "lucide-react"

export const habitTemplates = [
    {
        id: "drink-water",
        category: "Health",
        name: "Drink Water",
        description: "Stay hydrated throughout the day.",
        icon: Waves,
        iconKey: "waves",
        color: "blue",
        goalType: "count",
        targetCount: 8,
        goalUnit: "glasses"
    },
    {
        id: "take-medication",
        category: "Health",
        name: "Take Medication",
        description: "Remember daily medication or vitamins.",
        icon: Pill,
        iconKey: "pill",
        color: "green",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    },
    {
        id: "exercise",
        category: "Health",
        name: "Exercise",
        description: "Make time for intentional movement.",
        icon: Dumbbell,
        iconKey: "dumbbell",
        color: "orange",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    },
    {
        id: "read",
        category: "Personal",
        name: "Read for 20 Minutes",
        description: "Set aside a little time to read.",
        icon: BookOpen,
        iconKey: "book-open",
        color: "purple",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    },
    {
        id: "practice-instrument",
        category: "Personal",
        name: "Practice an Instrument",
        description: "Build consistency through regular practice.",
        icon: Music,
        iconKey: "music",
        color: "purple",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    },
    {
        id: "prepare-tomorrow",
        category: "Home",
        name: "Prepare for Tomorrow",
        description: "Get clothes, bags, and plans ready.",
        icon: PackageCheck,
        iconKey: "package-check",
        color: "blue",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    },
    {
        id: "tidy-room",
        category: "Home",
        name: "Tidy One Room",
        description: "Reset one space before the day ends.",
        icon: Sparkles,
        iconKey: "sparkles",
        color: "green",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    },
    {
        id: "meal-cleanup",
        category: "Home",
        name: "Clean Up After Dinner",
        description: "Finish the evening with a clean kitchen.",
        icon: Utensils,
        iconKey: "utensils",
        color: "orange",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    },
    {
        id: "walk-dog",
        category: "Family",
        name: "Walk the Dog",
        description: "Make sure the family pet gets outside.",
        icon: PawPrint,
        iconKey: "paw-print",
        color: "green",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    },
    {
        id: "pack-school-bags",
        category: "Family",
        name: "Pack School Bags",
        description: "Get school items ready for the next day.",
        icon: BriefcaseBusiness,
        iconKey: "briefcase-business",
        color: "blue",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    },
    {
        id: "family-check-in",
        category: "Family",
        name: "Family Check-In",
        description: "Take a moment to connect as a household.",
        icon: UsersRound,
        iconKey: "users-round",
        color: "purple",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    },
    {
        id: "help-someone",
        category: "Family",
        name: "Help Someone at Home",
        description: "Complete one helpful act for the household.",
        icon: HeartHandshake,
        iconKey: "heart-handshake",
        color: "orange",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    },
    {
        id: "house-reset",
        category: "Home",
        name: "10-Minute Home Reset",
        description: "Spend ten minutes putting things back in place.",
        icon: House,
        iconKey: "house",
        color: "green",
        goalType: "checkbox",
        targetCount: 1,
        goalUnit: ""
    }
]

export const habitTemplateCategories = [
    "Health",
    "Home",
    "Family",
    "Personal"
]

export default habitTemplates