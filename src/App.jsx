import { useEffect, useRef, useState } from "react"
import { NavLink, Route, Routes, Navigate, useLocation, useParams } from "react-router-dom"
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  Home,
  Info,
  Mail,
  MoreHorizontal,
  Repeat,
  Settings,
  ShoppingCart,
  User,
  Users,
  UtensilsCrossed,
  X
} from "lucide-react"

import logo from "./assets/evergrove-logo.svg"

import "./App.css"

import {
  APP_NAME,
  APP_VERSION,
  APP_STATUS
} from "./config/appConfig"

import { supabase } from "./lib/supabase"
import { runFamilyAutomation } from "./utils/runFamilyAutomation"

import GuidedWalkthrough from "./components/GuidedWalkthrough"

import usePreferences from "./hooks/usePreferences"
import usePersonalInbox from "./hooks/usePersonalInbox"

import PWAInstallBanner from "./components/PWAInstallBanner"
import PersonalInboxEngine from "./components/PersonalInboxEngine"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Family from "./pages/Family"
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
import Analytics from "./pages/Analytics"
import Onboarding from "./pages/Onboarding"
import InvitePage from "./pages/InvitePage"
import JoinHousehold from "./pages/JoinHousehold"

import UIKit from "./pages/UIKit"

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

const mobileNavItems = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/tasks", icon: ClipboardList, label: "To-Do" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/meals", icon: UtensilsCrossed, label: "Meals" },
  { to: "/personal-inbox", icon: Mail, label: "Inbox" }
]

const moreNavItems = [
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings/family", icon: Users, label: "Family" },
  { to: "/shopping", icon: ShoppingCart, label: "Shopping" },
  { to: "/documents", icon: FolderOpen, label: "Documents" },
  { to: "/trips", icon: CalendarDays, label: "Trips" },
  { to: "/school", icon: ClipboardList, label: "School" },
  { to: "/routines", icon: Repeat, label: "Routines" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/about", icon: Info, label: "About" }
]

function LoadingScreen({ message = "Loading Evergrove..." }) {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <div className="brand-mark">E</div>
        <p>{message}</p>
      </div>
    </div>
  )
}

function NavItem({ to, icon: Icon, label, end, onClick, badge = 0 }) {
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

function MobileBottomNav({ unreadInboxCount, onMoreClick }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {mobileNavItems.map(item => (
        <NavItem
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          end={item.end}
          badge={item.to === "/personal-inbox" ? unreadInboxCount : 0}
        />
      ))}

      <button
        type="button"
        className="nav-item mobile-more-button"
        onClick={onMoreClick}
      >
        <MoreHorizontal size={18} />
        <span>More</span>
      </button>
    </nav>
  )
}

function MobileMoreSheet({ open, onClose }) {
  if (!open) return null

  return (
    <div className="eg-bottom-sheet-backdrop" onClick={onClose}>
      <div className="eg-bottom-sheet" onClick={event => event.stopPropagation()}>
        <div className="eg-sheet-handle" />

        <div className="eg-sheet-header">
          <div>
            <h3>More</h3>
            <p>Everything else in Evergrove</p>
          </div>

          <button type="button" className="eg-icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="eg-more-grid">
          {moreNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className="eg-more-item"
              onClick={onClose}
            >
              <span>
                <item.icon size={22} />
              </span>

              <strong>{item.label}</strong>
            </NavLink>
          ))}
        </div>
        <div className="eg-more-footer">
          <button
            type="button"
            className="eg-button danger lg"
            onClick={async () => {
              await supabase.auth.signOut()
              onClose()
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

function AuthenticatedInviteRedirect() {
  const { token } = useParams()

  useEffect(() => {
    if (token) {
      window.localStorage.setItem("evergrove_InviteToken", token)
    }
  }, [token])

  return <Navigate to="/join-household" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/settings/family" element={<Family />} />
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
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/join-household" element={<JoinHousehold />} />
      <Route path="/invite/:token" element={<AuthenticatedInviteRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/uikit" element={<UIKit />} />
    </Routes>
  )
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/login" element={<Login onLogin={() => { }} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function OnboardingGuard({ children }) {
  const location = useLocation()
  const { preferences, loading, refreshPreferences } = usePreferences()

  if (loading) {
    return <LoadingScreen />
  }

  const hasCompletedOnboarding =
    preferences?.has_completed_onboarding === true

  const hasCompletedGuidedWalkthrough =
    preferences?.has_completed_guided_walkthrough === true

  if (
    hasCompletedOnboarding &&
    location.pathname === "/join-household"
  ) {
    window.localStorage.removeItem("evergrove_invite_token")
    return <Navigate to="/" replace />
  }

  if (
    !hasCompletedOnboarding &&
    location.pathname !== "/onboarding" &&
    location.pathname !== "/join-household" &&
    !location.pathname.startsWith("/invite/")
  ) {
    return <Navigate to="/onboarding" replace />
  }

  if (
    hasCompletedOnboarding &&
    location.pathname === "/onboarding"
  ) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      {children}

      {hasCompletedOnboarding &&
        !hasCompletedGuidedWalkthrough &&
        location.pathname !== "/join-household" &&
        !location.pathname.startsWith("/invite/") && (
          <GuidedWalkthrough
            onComplete={refreshPreferences}
          />
        )}
    </>
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

      <aside className="sidebar">
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
        <AppRoutes />
      </main>

      <MobileMoreSheet
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <MobileBottomNav
        unreadInboxCount={unreadInboxCount}
        onMoreClick={() => setMobileNavOpen(true)}
      />
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const automationRanForUserRef = useRef(null)

  useEffect(() => {
    if (!session) return

    if (window.location.pathname === "/login") {
      window.location.replace("/")
    }
  }, [session])

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession()

      setSession(data.session)
      setCheckingSession(false)
    }

    loadSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)

      if (event === "SIGNED_IN") {
        window.history.replaceState({}, "", "/")
      }
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
    return <LoadingScreen />
  }

  if (!session) {
    return <PublicRoutes />
  }

  return (
    <>
      <PersonalInboxEngine />

      <OnboardingGuard>
        <AppLayout />
      </OnboardingGuard>
    </>
  )
}