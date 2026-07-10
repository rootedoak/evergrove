import { NavLink, Outlet } from "react-router-dom"
import {
    BarChart3,
    BookOpen,
    Bug,
    Flag,
    Home,
    House,
    MessageSquare,
    Palette,
    Rocket,
    Shield,
    ShieldCheck,
    TrendingUp,
    Users,
    Wrench
} from "lucide-react"

import {
    APP_NAME,
    APP_VERSION,
    APP_STATUS
} from "../../config/appConfig"

const adminNavSections = [
    {
        label: null,
        items: [
            { to: "/admin", label: "Dashboard", icon: Home, end: true }
        ]
    },
    {
        label: "Operations",
        items: [
            { to: "/admin/households", label: "Households", icon: House },
            { to: "/admin/users", label: "Users", icon: Users },
            { to: "/admin/support", label: "Support", icon: MessageSquare },
            { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
            {
                to: "/admin/sales",
                label: "Sales & Marketing",
                icon: TrendingUp
            }
        ]
    },
    {
        label: "Beta",
        items: [
            { to: "/admin/beta", label: "Beta Testing", icon: Shield },
            { to: "/admin/feature-flags", label: "Feature Flags", icon: Flag }
        ]
    },
    {
        label: "Company",
        items: [
            {
                to: "/admin/foundations",
                label: "Foundations",
                icon: BookOpen
            },
            {
                to: "/admin/brand",
                label: "Brand",
                icon: Palette
            },
            {
                to: "/admin/go-to-market",
                label: "Go to Market",
                icon: Rocket
            },
            {
                to: "/admin/growth",
                label: "Growth",
                icon: TrendingUp
            },
            {
                to: "/admin/trust",
                label: "Trust Center",
                icon: ShieldCheck
            }
        ]
    },
    {
        label: "System",
        items: [
            { to: "/admin/releases", label: "Releases", icon: Rocket },
            { to: "/admin/errors", label: "Errors", icon: Bug },
            { to: "/admin/maintenance", label: "Maintenance", icon: Wrench }
        ]
    }
]

export default function AdminLayout() {
    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <div className="admin-brand-mark">E</div>

                    <div>
                        <h1>Evergrove HQ</h1>
                        <p>Owner Console</p>
                    </div>
                </div>

                <nav className="admin-nav">
                    {adminNavSections.map((section, index) => (
                        <div
                            key={section.label || index}
                            className="admin-nav-section"
                        >
                            {section.label && (
                                <p className="admin-nav-section-label">
                                    {section.label}
                                </p>
                            )}

                            {section.items.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        isActive
                                            ? "admin-nav-item active"
                                            : "admin-nav-item"
                                    }
                                >
                                    <item.icon size={18} />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <p>{APP_NAME}</p>
                    <p>
                        v{APP_VERSION} {APP_STATUS}
                    </p>
                </div>
            </aside>

            <section className="admin-main">
                <header className="admin-topbar">
                    <div className="admin-global-search">
                        <input
                            type="search"
                            placeholder="Search households, users, emails..."
                        />
                    </div>

                    <NavLink
                        to="/"
                        className="admin-return-link"
                    >
                        Return to App
                    </NavLink>
                </header>

                <main className="admin-content">
                    <Outlet />
                </main>
            </section>
        </div>
    )
}