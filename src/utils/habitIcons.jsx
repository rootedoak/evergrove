import {
    Apple,
    BookOpen,
    Brain,
    Droplets,
    Dumbbell,
    Footprints,
    Heart,
    House,
    Leaf,
    Moon,
    NotebookPen,
    PawPrint,
    Pill,
    Smile,
    Sparkles,
    Sun
} from "lucide-react"

const HABIT_ICON_MAP = {
    Apple,
    BookOpen,
    Brain,
    Droplets,
    Dumbbell,
    Footprints,
    Heart,
    House,
    Leaf,
    Moon,
    NotebookPen,
    PawPrint,
    Pill,
    Smile,
    Sparkles,
    Sun
}

export function getHabitIcon(iconName) {
    return HABIT_ICON_MAP[iconName] || Leaf
}

export const HABIT_ICON_NAMES =
    Object.keys(HABIT_ICON_MAP)