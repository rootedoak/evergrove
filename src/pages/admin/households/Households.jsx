import AdminCard from "../../../components/admin/AdminCard"
import AdminTable from "../../../components/admin/AdminTable"
import AdminStatusChip from "../../../components/admin/AdminStatusChip"

import useHouseholds from "../../../hooks/admin/useHouseholds"
import { useNavigate } from "react-router-dom"
import AdminPageHeader from "../../../components/admin/AdminPageHeader"

export default function Households() {
    const {
        households,
        loading
    } = useHouseholds()

    const navigate = useNavigate()

    const columns = [
        {
            key: "household",
            label: "Household"
        },
        {
            key: "members",
            label: "Members"
        },
        {
            key: "status",
            label: "Status",
            render: () => (
                <AdminStatusChip status="healthy">
                    Healthy
                </AdminStatusChip>
            )
        }
    ]

    return (
        <div className="admin-page">

            <AdminPageHeader
                eyebrow="Operations"
                title="Households"
                description="Search, review and support Evergrove households."
            />

            <AdminCard
                title="Household Directory"
            >

                {loading ? (

                    <p>Loading households...</p>

                ) : (

                    <AdminTable
                        columns={columns}
                        rows={households}
                        emptyMessage="No households found."
                        onRowClick={(household) =>
                            navigate(`/admin/households/${household.id}`)
                        }
                    />

                )}

            </AdminCard>

        </div>
    )
}