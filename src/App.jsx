import { useEffect, useRef, useState } from "react"
import logo from "./assets/evergrove-logo.svg"

import PWAInstallBanner from "./components/PWAInstallBanner"

import {
  APP_NAME,
  APP_VERSION,
  APP_STATUS
} from "./config/appConfig"

import { NavLink, Route, Routes } from "react-router-dom"
import {
  Bell,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  Home,
  Info,
  Mail,
  Menu,
  Plane,
  Repeat,
  School,
  Settings,
  ShoppingCart,
  User,
  UtensilsCrossed,
  X
} from "lucide-react"

import Analytics from "./pages/Analytics"

import { supabase } from "./lib/supabase"
import { runFamilyAutomation } from "./utils/runFamilyAutomation"
import usePreferences from "./hooks/usePreferences"

import Login from "./pages/Login"
import Family from "./pages/Family"
import Dashboard from "./pages/Dashboard"
import Activities from "./pages/Activities"
import Tasks from "./pages/Tasks"
import Reminders from "./pages/Reminders"
import SchoolHub from "./pages/School"
import Documents from "./pages/Documents"
import Routines from "./pages/Routines"
import CalendarPage from "./pages/Calendar"
import Trips from "./pages/Trips"
import Profile from "./pages/Profile"
import Meals from "./pages/Meals"
import ShoppingLists from "./pages/ShoppingLists"
import About from "./pages/About"
import PersonalInbox from "./pages/PersonalInbox"
import PersonalInboxEngine from "./components/PersonalInboxEngine"
import usePersonalInbox from "./hooks/usePersonalInbox"

import "./App.css"

const navItems = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/personal-inbox", icon: Mail, label: "Inbox" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/tasks", icon: ClipboardList, label: "To-Do" },
  { to: "/meals", icon: UtensilsCrossed, label: "Meals" },
  { to: "/shopping", icon: ShoppingCart, label: "Shopping" },
  { to: "/documents", icon: FolderOpen, label: "Documents" },
  { to: "/profile", icon: Settings, label: "Settings" },
  { to: "/about", icon: Info, label: "About" }
]

function NavItem({ to, icon: Icon, label, end, onClick, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        isActive ? "nav-item active" : "nav-item"
      }
    >
      <Icon size={18} />
      <span>{label}</span>

      {badge > 0 && (
        <span className="nav-inbox-badge">
          {badge}
        </span>
      )}
    </NavLink>
  )
}

function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { preferences } = usePreferences()

  const { items: inboxItems } = usePersonalInbox()

  const unreadInboxCount = inboxItems.filter(
    item => item.status === "unread"
  ).length

  const householdName = preferences?.household_name || "My Household"

  return (
    <div className="app-shell">
      <button
        className="mobile-nav-toggle"
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      {mobileNavOpen && (
        <button
          className="mobile-nav-backdrop"
          type="button"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={mobileNavOpen ? "sidebar open" : "sidebar"}>
        <div className="sidebar-top">
          <div className="brand sidebar-household-brand">
            <img
              src={logo}
              alt="Evergrove"
              className="sidebar-logo"
            />

            <div>
              <h1>{householdName}</h1>
              <p>Family Command Center</p>
            </div>
          </div>

          <button
            className="sidebar-close"
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="nav" aria-label="Primary navigation">
          {navItems.map(item => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              badge={
                item.to === "/personal-inbox"
                  ? unreadInboxCount
                  : 0
              }
              end={item.end}
              onClick={() => setMobileNavOpen(false)}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>{APP_NAME}</p>
          <p>
            v{APP_VERSION} {APP_STATUS}
          </p>
        </div>
      </aside>

      <PWAInstallBanner />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings/family" element={<Family />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/school" element={<SchoolHub />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/shopping" element={<ShoppingLists />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/personal-inbox" element={<PersonalInbox />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const automationRanForUserRef = useRef(null)

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setCheckingSession(false)
    }

    loadSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const userId = session?.user?.id

    if (!userId) return
    if (automationRanForUserRef.current === userId) return

    automationRanForUserRef.current = userId
    runFamilyAutomation()
  }, [session])

  if (checkingSession) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="brand-mark">E</div>
          <p>Loading Evergrove...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Login onLogin={() => { }} />
  }

  return (
    <>
      <PersonalInboxEngine />
      <AppLayout />
    </>
  )
}