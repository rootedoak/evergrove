import { useEffect, useRef, useState } from "react"
import { NavLink, Route, Routes } from "react-router-dom"
import {
  Bell,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  Home,
  Menu,
  Repeat,
  School,
  Users,
  Plane,
  User,
  X
} from "lucide-react"

import { supabase } from "./lib/supabase"
import { runFamilyAutomation } from "./utils/runFamilyAutomation"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Family from "./pages/Family"
import Activities from "./pages/Activities"
import Tasks from "./pages/Tasks"
import Reminders from "./pages/Reminders"
import SchoolHub from "./pages/School"
import Documents from "./pages/Documents"
import Routines from "./pages/Routines"
import Trips from "./pages/Trips"

import Profile from "./pages/Profile"

import "./App.css"

const navItems = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/family", icon: Users, label: "Family" },
  { to: "/activities", icon: CalendarDays, label: "Activities" },
  { to: "/school", icon: School, label: "School" },
  { to: "/tasks", icon: ClipboardList, label: "Tasks" },
  { to: "/routines", icon: Repeat, label: "Routines" },
  { to: "/trips", icon: Plane, label: "Trips" },
  { to: "/reminders", icon: Bell, label: "Reminders" },
  { to: "/documents", icon: FolderOpen, label: "Documents" },
  { to: "/profile", icon: User, label: "Profile" }
]

function NavItem({ to, icon: Icon, label, end, onClick }) {
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
    </NavLink>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
          <div className="brand">
            <div className="brand-mark">E</div>

            <div>
              <h1>Evergrove</h1>
              <p>Family command center</p>
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
              end={item.end}
              onClick={() => setMobileNavOpen(false)}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Built for the daily rhythm of family life.</p>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/family" element={<Family />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/school" element={<SchoolHub />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  )
}