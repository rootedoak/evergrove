import { useState } from "react"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"
import AnalyticsKpiCard from "../../../components/admin/dashboard/AnalyticsKpiCard"

export default function SalesMarketing() {
    const [salesGoal, setSalesGoal] = useState(5)

    const metrics = {
        mrr: 0,
        activeSubscriptions: 0,
        payingHouseholds: 0,
        topReferrers: []
    }

    const progress =
        salesGoal > 0
            ? Math.min(
                Math.round((metrics.payingHouseholds / salesGoal) * 100),
                100
            )
            : 0

    return (
        <div className="admin-page">

            <AdminPageHeader
                eyebrow="Growth"
                title="Sales & Marketing"
                description="Track revenue, subscriptions, sales goals, and referral momentum."
            />

            <section className="admin-grid admin-grid-3">
                <AnalyticsKpiCard
                    title="MRR"
                    value={`$${metrics.mrr}`}
                    subtitle="Monthly recurring revenue"
                    icon="sessions"
                />

                <AnalyticsKpiCard
                    title="Active Subscriptions"
                    value={metrics.activeSubscriptions}
                    subtitle="Paying household subscriptions"
                    icon="wau"
                />

                <AnalyticsKpiCard
                    title="Paying Households"
                    value={`${metrics.payingHouseholds} / ${salesGoal}`}
                    subtitle={`${progress}% of current sales goal`}
                    icon="dau"
                />
            </section>

            <AdminCard title="Sales Goal">
                <div className="admin-form-row">
                    <label>
                        Current Target
                        <input
                            className="admin-input"
                            type="number"
                            min="1"
                            value={salesGoal}
                            onChange={(event) =>
                                setSalesGoal(Number(event.target.value))
                            }
                        />
                    </label>
                </div>

                <div className="admin-progress-track">
                    <div
                        className="admin-progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <p className="admin-muted">
                    Current beta target: {salesGoal} paying households.
                </p>
            </AdminCard>

            <AdminCard title="Top Referrers">
                {metrics.topReferrers.length === 0 ? (
                    <AdminEmptyState>
                        Referral tracking is not connected yet. Once referrals are captured,
                        this section will show which users are generating the most new households.
                    </AdminEmptyState>
                ) : (
                    <div className="admin-simple-list">
                        {metrics.topReferrers.map(referrer => (
                            <div
                                key={referrer.userId}
                                className="admin-simple-row"
                            >
                                <span>{referrer.name}</span>
                                <strong>{referrer.referrals}</strong>
                            </div>
                        ))}
                    </div>
                )}
            </AdminCard>

        </div>
    )
}