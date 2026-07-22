import { Link } from "react-router-dom"

import SectionCard from "../ui/SectionCard"

import {
    getHabitIcon
} from "../../utils/habitIcons"

import {
    getHabitColor
} from "../../utils/habitColors"

import getTodayHabitSummary from "../../utils/habits/getTodayHabitSummary"

export default function HabitProgressCard({
    habits = [],
    completedToday = []
}) {
    const {
        total,
        completed,
        remaining,
        percentage,
        remainingHabits,
        allComplete
    } = getTodayHabitSummary({
        habits,
        completedToday
    })

    if (total === 0) {
        return null
    }

    const visibleRemainingHabits =
        remainingHabits.slice(0, 3)

    return (
        <SectionCard title="Habits">
            <div className="eg-dashboard-habits">
                <div className="eg-dashboard-habits-progress">
                    <div
                        className="eg-dashboard-habit-track"
                        aria-label={`${percentage}% complete`}
                    >
                        <div
                            className="eg-dashboard-habit-fill"
                            style={{
                                width: `${percentage}%`
                            }}
                        />
                    </div>

                    <span>
                        {percentage}%
                    </span>
                </div>

                <div className="eg-dashboard-habits-message">
                    <strong>
                        {allComplete
                            ? "All habits complete"
                            : `${remaining} habit${remaining === 1 ? "" : "s"} left today`}
                    </strong>

                    <p>
                        {allComplete
                            ? "Nice work. Everything is done for today."
                            : `${completed} of ${total} completed`}
                    </p>
                </div>

                {visibleRemainingHabits.length > 0 && (
                    <div className="eg-dashboard-habit-list">
                        {visibleRemainingHabits.map(
                            habit => {
                                const Icon =
                                    getHabitIcon(
                                        habit.icon
                                    )

                                const color =
                                    getHabitColor(
                                        habit.color
                                    )

                                return (
                                    <Link
                                        key={habit.id}
                                        className="eg-dashboard-habit-row"
                                        to="/habits"
                                    >
                                        <div
                                            className={`
                                                eg-dashboard-habit-icon
                                                ${color.className}
                                            `}
                                        >
                                            <Icon size={17} />
                                        </div>

                                        <span>
                                            {habit.name}
                                        </span>
                                    </Link>
                                )
                            }
                        )}
                    </div>
                )}

                <Link
                    className="eg-dashboard-habits-link"
                    to="/habits"
                >
                    View all habits
                    <span aria-hidden="true">
                        →
                    </span>
                </Link>
            </div>
        </SectionCard>
    )
}