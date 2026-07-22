import { useEffect, useRef, useState } from "react"
import { NavLink, Route, Routes, Navigate, useLocation, useParams } from "react-router-dom"
import {
  CalendarDays,
  ClipboardList,
  FolderOpen,
  Home,
  Info,
  Leaf,
  Mail,
  MoreHorizontal,
  Repeat,
  Settings,
  ShieldCheck,
  ShoppingCart,
  User,
  Users,
  UtensilsCrossed,
  X
} from "lucide-react"

import "./App.css"

import {
  APP_NAME,
  APP_VERSION,
  APP_STATUS
} from "./config/appConfig"

import {
  trackDailyActive,
  trackUsageEvent
} from "./services/analytics/usageEventService"

import { supabase } from "./lib/supabase"
import { runFamilyAutomation } from "./utils/runFamilyAutomation"

import GuidedWalkthrough from "./components/GuidedWalkthrough"

import usePreferences from "./hooks/usePreferences"
import usePersonalInbox from "./hooks/usePersonalInbox"

import PWAInstallBanner from "./components/PWAInstallBanner"
import PersonalInboxEngine from "./components/PersonalInboxEngine"

import LoadingScreen from "./components/LoadingScreen"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Family from "./pages/Family"
import Tasks from "./pages/Tasks"
import Reminders from "./pages/Reminders"
import SchoolHub from "./pages/School"
import Documents from "./pages/Documents"
import Routines from "./pages/Routines"
import Habits from "./pages/Habits"
import CalendarPage from "./pages/Calendar"
import Trips from "./pages/Trips"
import Profile from "./pages/Profile"
import Meals from "./pages/Meals"
import ShoppingLists from "./pages/ShoppingLists"
import About from "./pages/About"
import PersonalInbox from "./pages/PersonalInbox"
import Onboarding from "./pages/Onboarding"
import InvitePage from "./pages/InvitePage"
import JoinHousehold from "./pages/JoinHousehold"

import AdminRoute from "./components/admin/AdminRoute"
import AdminLayout from "./components/admin/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminAnalytics from "./pages/admin/analytics/AdminAnalytics"
import Households from "./pages/admin/households/Households"
import Household360 from "./pages/admin/households/Household360"
import SupportInbox from "./pages/admin/support/SupportInbox"
import SupportTicket from "./pages/admin/support/SupportTicket"
import NewSupportTicket from "./pages/admin/support/NewSupportTicket"
import UsersPage from "./pages/admin/users/Users"
import UserProfile from "./pages/admin/users/UserProfile"
import BetaHealth from "./pages/admin/beta/BetaHealth"
import AdminErrors from "./pages/admin/errors/AdminErrors"

import Releases from "./pages/admin/releases/Releases"
import ReleaseDetail from "./pages/admin/releases/ReleaseDetail"
import FeatureFlags from "./pages/admin/featureFlags/FeatureFlags"

import SalesMarketing from "./pages/admin/sales/SalesMarketing"

import FirstWeekSetup from "./pages/FirstWeekSetup"

import Foundations from "./pages/admin/company/Foundations"
import Brand from "./pages/admin/company/Brand"
import GoToMarket from "./pages/admin/company/GoToMarket"
import Growth from "./pages/admin/company/Growth"

import PublicHome from "./pages/public/PublicHome"
import PublicLayout from "./components/public/PublicLayout"
import PublicMetadata from "./components/public/PublicMetadata"
import ReferralLanding from "./pages/public/ReferralLanding"
import AboutEvergrove from "./pages/public/AboutEvergrove"

import TrustCenter from "./pages/trust/TrustCenter"
import TrustDocumentPage from "./pages/trust/TrustDocumentPage"
import LegalAcceptanceGate from "./components/trust/LegalAcceptanceGate"
import AdminTrustCenter from "./pages/admin/trust/AdminTrustCenter"
import Roadmap from "./pages/admin/Roadmap"

import DiscoverMessageModal from "./components/discover/DiscoverMessageModal"
import useDiscoverMessage from "./hooks/useDiscoverMessage"
import DiscoverMessages from "./pages/admin/discover/DiscoverMessages"
import DiscoverMessageEditor from "./pages/admin/discover/DiscoverMessageEditor"

import AdminCommunications from "./pages/admin/communications/AdminCommunications"

import useHouseholdRole from "./hooks/useHouseholdRole"
import RoleRoute from "./components/RoleRoute"

import ErrorBoundary from "./components/ErrorBoundary"
import NotFound from "./pages/public/NotFound"
import UIKit from "./pages/UIKit"

const mobileNavItems = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/tasks", icon: ClipboardList, label: "To-Do" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/meals", icon: UtensilsCrossed, label: "Meals" },
  { to: "/personal-inbox", icon: Mail, label: "Inbox" }
]

const defaultMoreNavItems = [
  { to: "/profile", icon: User, label: "Account" },
  { to: "/settings/family", icon: Users, label: "Household" },
  { to: "/shopping", icon: ShoppingCart, label: "Shopping" },
  { to: "/documents", icon: FolderOpen, label: "Documents" },
  { to: "/trips", icon: CalendarDays, label: "Trips" },
  { to: "/school", icon: ClipboardList, label: "School" },
  { to: "/habits", icon: Leaf, label: "Habits" },
  { to: "/routines", icon: Repeat, label: "Automations" },
  { to: "/about", icon: Info, label: "About" }
]

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

function MobileMoreSheet({
  open,
  onClose,
  isTeen
}) {
  if (!open) return null

  const moreNavItems = defaultMoreNavItems.filter(item => {
    if (!isTeen) return true

    return ![
      "/settings/family",
      "/routines",
      "/documents"
    ].includes(item.to)
  })

  return (
    <div className="eg-bottom-sheet-backdrop" onClick={onClose}>
      <div className="eg-bottom-sheet" onClick={event => event.stopPropagation()}>
        <div className="eg-sheet-handle" />

        <div className="eg-sheet-header">
          <div>
            <h3>More</h3>
            <p>Everything your household needs.</p>
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
      window.localStorage.setItem(
        "evergrove_invite_token",
        token
      )
    }
  }, [token])

  return <Navigate to="/join-household" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route
        path="/settings/family"
        element={
          <RoleRoute allow={["owner", "adult"]}>
            <Family />
          </RoleRoute>
        }
      />
      <Route path="/school" element={<SchoolHub />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/habits" element={<Habits />} />
      <Route path="/meals" element={<Meals />} />
      <Route path="/shopping" element={<ShoppingLists />} />
      <Route
        path="/routines"
        element={
          <RoleRoute allow={["owner", "adult"]}>
            <Routines />
          </RoleRoute>
        }
      />
      <Route path="/reminders" element={<Reminders />} />
      <Route
        path="/documents"
        element={
          <RoleRoute allow={["owner", "adult"]}>
            <Documents />
          </RoleRoute>
        }
      />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/trips" element={<Trips />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/about" element={<About />} />
      <Route path="/trust" element={<TrustCenter />} />
      <Route path="/trust/:slug" element={<TrustDocumentPage />} />
      <Route path="/personal-inbox" element={<PersonalInbox />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/join-household" element={<JoinHousehold />} />
      <Route path="/invite/:token" element={<AuthenticatedInviteRedirect />} />
      <Route path="/uikit" element={<UIKit />} />
      <Route path="/first-week" element={<FirstWeekSetup />} />
      <Route path="/r/:code" element={<ReferralLanding />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route
          path="foundations"
          element={<Foundations />}
        />
        <Route path="brand" element={<Brand />} />
        <Route path="go-to-market" element={<GoToMarket />} />
        <Route
          path="trust"
          element={<AdminTrustCenter />}
        />
        <Route path="growth" element={<Growth />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="households" element={<Households />} />
        <Route path="households/:householdId" element={<Household360 />} />
        <Route path="support" element={<SupportInbox />} />
        <Route
          path="support/new"
          element={<NewSupportTicket />}
        />
        <Route path="support/:feedbackId" element={<SupportTicket />} />
        <Route path="releases" element={<Releases />} />
        <Route
          path="errors"
          element={<AdminErrors />}
        />
        <Route path="releases/:releaseId" element={<ReleaseDetail />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:userId" element={<UserProfile />} />
        <Route path="beta" element={<BetaHealth />} />
        <Route path="/admin/feature-flags" element={<FeatureFlags />} />
        <Route path="sales" element={<SalesMarketing />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route
          path="communications"
          element={<AdminCommunications />}
        />
        <Route
          path="discover"
          element={<DiscoverMessages />}
        />
        <Route
          path="discover/new"
          element={<DiscoverMessageEditor />}
        />

        <Route
          path="discover/:discoverMessageId"
          element={<DiscoverMessageEditor />}
        />
      </Route>
    </Routes>
  )
}

function PublicRoutes() {
  return (
    <>
      <PublicMetadata />

      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<PublicHome />} />

          <Route
            path="/about"
            element={<AboutEvergrove />}
          />

          <Route
            path="/trust"
            element={<TrustCenter />}
          />

          <Route
            path="/trust/:slug"
            element={<TrustDocumentPage />}
          />
        </Route>

        <Route
          path="/r/:code"
          element={<ReferralLanding />}
        />

        <Route
          path="/invite/:token"
          element={<InvitePage />}
        />

        <Route
          path="/login"
          element={<Login onLogin={() => { }} />}
        />

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </>
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

  const pendingInviteToken =
    window.localStorage.getItem("evergrove_invite_token")

  if (
    pendingInviteToken &&
    location.pathname !== "/join-household" &&
    !location.pathname.startsWith("/invite/")
  ) {
    return <Navigate to="/join-household" replace />
  }

  if (
    !hasCompletedOnboarding &&
    location.pathname !== "/onboarding" &&
    location.pathname !== "/join-household" &&
    !location.pathname.startsWith("/invite/") &&
    !location.pathname.startsWith("/trust")
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
        location.pathname !== "/first-week" &&
        location.pathname !== "/join-household" &&
        !location.pathname.startsWith("/invite/") &&
        !location.pathname.startsWith("/trust") && (
          <GuidedWalkthrough
            onComplete={refreshPreferences}
          />
        )}
    </>
  )
}

function AppLayout() {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { preferences } = usePreferences()

  const {
    isTeen
  } = useHouseholdRole()

  const { items: inboxItems } = usePersonalInbox()

  const canShowDiscoverMessage =
    preferences?.has_completed_onboarding === true &&
    preferences?.has_completed_guided_walkthrough === true &&
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/trust") &&
    !location.pathname.startsWith("/invite/") &&
    location.pathname !== "/onboarding" &&
    location.pathname !== "/join-household" &&
    location.pathname !== "/first-week"

  const {
    message: discoverMessage,
    dismissing: discoverMessageDismissing,
    dismiss: dismissDiscoverMessage,
    trackAction: trackDiscoverMessageAction
  } = useDiscoverMessage({
    enabled: canShowDiscoverMessage
  })

  function getLaunchMode() {
    if (typeof window === "undefined") {
      return "browser"
    }

    const isStandaloneDisplay =
      window.matchMedia?.("(display-mode: standalone)")?.matches === true

    const isIosStandalone =
      window.navigator.standalone === true

    return isStandaloneDisplay || isIosStandalone
      ? "installed_pwa"
      : "browser"
  }

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return

    const launchMode = getLaunchMode()

    trackUsageEvent({
      eventType: "session_started",
      entityType: "session",
      metadata: {
        source: "app_layout",
        path: location.pathname,
        launch_mode: launchMode
      }
    })

    trackDailyActive()
  }, [])

  if (location.pathname.startsWith("/admin")) {
    return <AppRoutes />
  }

  const unreadInboxCount = inboxItems.filter(
    item => item.status === "unread"
  ).length

  const householdName = preferences?.household_name || "My Household"

  return (
    <div className="app-shell">
      <PWAInstallBanner />

      <main className="main-content">
        <AppRoutes />
      </main>

      <MobileMoreSheet
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        isTeen={isTeen}
      />

      <MobileBottomNav
        unreadInboxCount={unreadInboxCount}
        onMoreClick={() => setMobileNavOpen(true)}
      />

      <DiscoverMessageModal
        message={discoverMessage}
        onDismiss={dismissDiscoverMessage}
        onAction={trackDiscoverMessageAction}
        dismissing={discoverMessageDismissing}
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
        const pendingInviteToken =
          window.localStorage.getItem("evergrove_invite_token")

        window.history.replaceState(
          {},
          "",
          pendingInviteToken
            ? "/join-household"
            : "/"
        )
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
    <ErrorBoundary>
      <LegalAcceptanceGate>
        <PersonalInboxEngine />

        <OnboardingGuard>
          <AppLayout />
        </OnboardingGuard>
      </LegalAcceptanceGate>
    </ErrorBoundary>
  )
}