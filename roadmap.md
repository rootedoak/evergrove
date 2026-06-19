# Release Notes

## v0.9.0 - Evergrove UI Modernization
Released: 2026-06-01

### Added
- Light gray and navy visual theme
- Simplified sidebar navigation
- Household-branded sidebar
- Household-centered Home dashboard header
- Calendar destination cards for Activities, Trips, and School
- Tasks destination cards for Routines and Reminders
- Mobile-first Home dashboard redesign
- Dashboard quick action buttons for adding Tasks and Activities

### Improved
- Calendar page layout
- Tasks page grouped by urgency
- Family page grouped by role
- Activities page grouped by timing
- Trips page grouped by timing
- Routines page grouped by due status
- School page grouped by urgency
- Settings page layout
- Reminders placeholder page
- Reduced card clutter across major pages
- More consistent page headers, summary counts, grouped lists, and mobile behavior

### Backlog Added
- HOME-001 Quick Add Modals

---

## v0.8.0 - Routines & Household Sharing
Released: 2026-05-31

### Added
- Routines management
- Routine task automation
- Routine completion workflow
- Routine-to-task lifecycle
- Household architecture
- Household membership system
- Shared household data model
- Household-based security model
- Shared family members
- Shared activities
- Shared tasks
- Shared school items
- Shared documents
- Shared routines
- Shared trips
- Household storage permissions
- Multi-user family support

---

## v0.7.5 - Travel Planner
Released: 2026-05-31

### Added
- Trip management
- Trip attendee tracking
- Family member trip assignments
- Trip timeline integration
- Household trip sharing

---

## v0.7.0 - Family Briefing & Document Vault
Released: 2026-05-30

### Added
- Document Vault
- Secure document storage with Supabase Storage
- Document upload
- Document viewing
- Document deletion
- Family member document linking
- School item document linking
- Activity document linking
- Family Briefing dashboard
- Family intelligence engine
- Briefing summaries for:
  - Open tasks
  - School deadlines
  - Registration deadlines
  - Documents
  - Upcoming events

---

## v0.6.0 - School Hub
Released: 2026-05-30

### Added
- School Hub
- School item management
- School forms
- Field trip tracking
- Parent conference tracking
- Spirit day tracking
- School deadlines
- School action dashboard card
- School timeline integration

---

## v0.5.0 - Intelligence Layer
Released: 2026-05-30

### Added
- Registration status engine
- Registration status badges
- Registration opportunities dashboard card
- Action Needed dashboard card
- Suggested Tasks engine
- One-click task creation from registrations
- Open Tasks dashboard card
- Family Timeline
- Activity intelligence utilities
- Task suggestion utilities

---

## v0.4.0 - Tasks
Released: 2026-05-30

### Added
- Task management
- Create task
- Edit task
- Delete task
- Complete task workflow
- Family member assignment
- Activity assignment
- Task status tracking

---

## v0.3.0 - Activities
Released: 2026-05-30

### Added
- Activity management
- Create activity
- Edit activity
- Delete activity
- Family member assignment
- Registration tracking dates
- Cost tracking
- Season tracking
- Organization tracking

---

## v0.2.0 - Family Members
Released: 2026-05-30

### Added
- Family member management
- Create family member
- Edit family member
- Delete family member
- Avatar emoji support
- School tracking
- Grade tracking
- Notes support

---

## v0.1.0 - Foundation
Released: 2026-05-30

### Added
- React application
- Routing
- Supabase integration
- Authentication
- Login screen
- Family members table
- User security with RLS
- Family member display page
- Service layer structure
- Roadmap tracking
- Schema change tracking

---

# Schema Changes

## 2026-05-31

### households
- Household sharing enabled
- Household ownership support
- Duplicate household cleanup identified for backlog

### household_members
- Created table
- Added household membership support
- Added household roles
- Added household security model
- Fixed recursive RLS issue
- Added direct user membership lookup policy

### family_members
- Added household_id
- Migrated to household ownership
- Updated service layer to household scope
- Updated RLS to household access

### activities
- Added household_id
- Migrated to household ownership
- Updated service layer to household scope
- Updated RLS to household access

### tasks
- Added household_id
- Added routine_id
- Migrated to household ownership
- Updated RLS to household access
- Added routine-generated task support

### school_items
- Added household_id
- Migrated to household ownership
- Updated service layer to household scope
- Updated RLS to household access

### documents
- Added household_id
- Migrated to household ownership
- Updated service layer to household scope
- Updated RLS to household access
- Updated document storage path strategy to household folder

### routines
- Created table
- Added household_id
- Added task_created
- Migrated to household ownership
- Updated service layer to household scope
- Updated RLS to household access
- Added routine task automation

### trips
- Added household_id
- Migrated to household ownership
- Updated service layer to household scope
- Updated RLS to household access

### trip_family_members
- Updated household-based access policies through trips relationship

### storage
- Created family-documents bucket
- Migrated document access from user ownership to household ownership
- Updated storage policies for household folder access

---

## 2026-05-30

### family_members
- Created table
- Added user_id
- Enabled RLS
- Added role column
- Added avatar_emoji column
- Added notes column

### activities
- Created table
- Enabled RLS
- Added registration_task_created column

### tasks
- Created table
- Enabled RLS
- Added family_member_id relationship
- Added activity_id relationship

### school_items
- Created table
- Enabled RLS
- Added family member relationship

### documents
- Created table
- Enabled RLS
- Added family member relationship
- Added school item relationship
- Added activity relationship

---

# Evergrove Roadmap

## FAM-001
Authentication & Foundation  
Status: Complete

### Completed
- React application created
- Routing configured
- Supabase connected
- Authentication added
- RLS enabled
- Family members table created

---

## FAM-002
Family Members  
Status: Complete

### Completed
- Display family members
- Add family members
- Edit family members
- Delete family members
- Avatar support
- School information
- Grade information
- Notes
- Parent, child, and pet support

---

## FAM-003
Activities  
Status: Complete

### Completed
- Create activity
- Edit activity
- Delete activity
- Assign family member
- Registration dates
- Cost tracking
- Season tracking
- Organization tracking

---

## FAM-004
Registration Intelligence  
Status: Complete

### Completed
- Registration status engine
- Registration status badges
- Registration opportunities dashboard card
- Action Needed dashboard card
- Registration task suggestions
- Registration workflow tracking

---

## FAM-005
Tasks  
Status: Complete

### Completed
- Create task
- Edit task
- Delete task
- Complete task workflow
- Assign family member
- Assign activity
- Suggested task creation
- Routine-generated task support

---

## FAM-006
Family Timeline  
Status: Complete

### Completed
- Timeline engine
- Activity timeline events
- Registration timeline events
- Task due date events
- School due date events
- Trip timeline events
- Unified family timeline

---

## FAM-007
School Hub  
Status: Complete

### Completed
- School item management
- School forms
- Field trips
- Parent conferences
- Spirit days
- School deadlines
- School action intelligence
- Timeline integration

---

## FAM-008
Document Vault  
Status: Complete

### Completed
- Secure document storage
- File uploads
- File viewing
- File deletion
- Family member document linking
- School item document linking
- Activity document linking
- Supabase Storage integration
- Household document access

---

## FAM-009
Family Briefing  
Status: Complete

### Completed
- Family intelligence engine
- Dashboard briefing card
- Open task summaries
- School deadline summaries
- Registration summaries
- Document summaries
- Upcoming event summaries

---

## FAM-010
Routines  
Status: Complete

### Completed
- Routine management
- Create routine
- Edit routine
- Delete routine
- Due date tracking
- Frequency tracking
- Family member assignment
- Automatic task creation
- Routine completion workflow
- Routine-to-task lifecycle
- Central family automation engine

---

## FAM-011
Travel Planner  
Status: Complete

### Completed
- Trip management
- Create trip
- Edit trip
- Delete trip
- Family member attendees
- Trip timeline integration
- Shared household visibility

---

## FAM-012
Household Sharing Architecture  
Status: Complete

### Completed
- Household membership system
- Shared household ownership model
- Household-based RLS
- Shared family members
- Shared activities
- Shared tasks
- Shared school items
- Shared documents
- Shared routines
- Shared trips
- Household document permissions
- Multi-user family support

---

## FAM-020
UI Modernization  
Status: Complete

### Completed
- Light gray and navy theme
- Simplified sidebar navigation
- Household-branded sidebar
- Home dashboard redesign
- Mobile-first dashboard flow
- Quick action buttons on Home
- Calendar destination cards
- Tasks destination cards
- Grouped list layouts across core pages
- Calendar page cleanup
- Tasks page cleanup
- Family page cleanup
- Activities page cleanup
- Trips page cleanup
- Routines page cleanup
- School page cleanup
- Settings page cleanup
- Reminders placeholder cleanup

---

# Backlog

## FAM-013
Household Onboarding & Invitations  
Status: Planned

### Goals
- Automatic household creation for first-time users
- Automatic owner assignment
- Household invitations
- Invite acceptance
- Spouse or partner onboarding
- Household management page
- Household member roles
- Duplicate household prevention
- Household switching support

---

## FAM-014
Document Intelligence  
Status: Backlog

### Goals
- Required documents by activity
- Required documents by school item
- Missing document detection
- Document completeness scoring
- Dashboard alerts
- Family briefing integration

### Notes
- Backlogged intentionally.
- Parents may not upload sensitive documents until trust is established.
- Document Vault should remain useful without requiring sensitive document storage.

---

## FAM-015
Notifications & Reminders  
Status: Complete

### Completed
- Upcoming deadline alerts
- Registration reminders
- School reminders
- Task reminders
- Routine reminders
- Push notification support

---

## FAM-016
Calendar Integration  
Status: Planned

### Goals
- Family calendar view
- Timeline calendar sync
- Google Calendar integration
- Activity scheduling
- School calendar integration
- Trip calendar integration

---

## FAM-017
Family Command Center  
Status: Planned

### Goals
- Personalized daily briefing
- Family health score
- Family workload tracking
- Smart recommendations
- AI-powered family assistant

---

## FAM-018
Household Cleanup & Administration  
Status: Backlog

### Goals
- Household management page
- Merge duplicate households
- Remove orphaned households
- Transfer household ownership
- Household audit tools
- Admin diagnostics

---

## FAM-019
Testing & Stabilization  
Status: Active Backlog

### Goals
- Test shared household behavior with multiple users
- Validate all modules from both parent accounts
- Confirm RLS behavior across all shared tables
- Validate document access for both users
- Validate routine automation across household users
- Identify UI friction from real family usage
- Clean up any leftover user-scoped service logic

## Meal Planner (MLP)

### ✅ Completed

#### MLP-001 — Meal Library
**Status:** Complete

Create and manage reusable meals with:
- Name
- Category
- Description
- Ingredients
- Quantities
- Grocery categories

---

#### MLP-002 — Weekly Meal Planner
**Status:** Complete

Plan meals by day with:
- Weekly calendar view
- Previous/Next week navigation
- Dinner Tonight support
- Meal plan deletion

---

#### MLP-003 — Grocery List Generation
**Status:** Complete

Automatically create grocery items when meals are added to the weekly plan.

---

#### MLP-004 — Household Sharing
**Status:** Complete

Meal planning is shared across the household:
- Meals
- Meal Plans
- Grocery Lists

Uses household_id architecture.

---

#### MLP-005 — Grocery Consolidation
**Status:** Complete

Consolidate duplicate ingredients into a single grocery entry.

Example:

Ground Beef

Used In:
- Taco Night
- Burger Night
- Spaghetti Night

---

#### MLP-006 — Dashboard Dinner Widget
**Status:** Complete

Display tonight's planned dinner on the Family Command Center dashboard.

---

#### MLP-007 — Quick Add To Week
**Status:** Complete

Add meals directly from the Saved Meals section.

Features:
- One-click Add To Week button
- Select date
- Optional notes
- Automatically generates grocery items
- Eliminates need to use planner form

---

#### MLP-014 — Restaurant Nights
**Status:** Complete

Support planning nights out as part of the weekly meal schedule.

Features:
- Home meals
- Restaurant nights
- Dashboard support
- Weekly planner support
- Notes support
- No grocery generation

Examples:
- Chick-fil-A
- Pizza Pickup
- Date Night
- Leftovers / Fend For Yourself

---

### 🚧 Planned

#### MLP-008 — Meal Templates
**Status:** Planned

Create reusable weekly meal schedules.

Examples:
- Taco Tuesday
- Pizza Friday
- Breakfast For Dinner
- Slow Cooker Sunday

One-click meal planning.

---

#### MLP-009 — Smart Grocery Categories
**Status:** Planned

Automatically categorize ingredients.

Examples:
- Ground Beef → Meat
- Chicken Breast → Meat
- Milk → Dairy
- Cheese → Dairy
- Lettuce → Produce
- Tomatoes → Produce
- Taco Shells → Pantry

Reduces manual categorization effort.

---

#### MLP-015 — Grocery Cleanup
**Status:** Complete

Automatically remove generated grocery items when a meal plan is deleted.

Completed:
- Meal plan deletion removes generated grocery items
- Manual grocery items remain untouched
- Grocery list stays synchronized with meal plans

---

#### MLP-016 — Dashboard Meal Summary
**Status:** Planned

Enhance Dashboard meal widget.

Display:
- Tonight's dinner
- Grocery items remaining
- Planned meals this week

Compact dashboard-friendly format.

---

### 📋 Backlog

#### MLP-010 — Drag & Drop Weekly Planner
**Status:** Backlog

Allow meals to be moved between days via drag-and-drop.

Examples:
- Move Taco Night from Tuesday to Thursday
- Reorder meals across the week
- Mobile-friendly touch support

Priority: High
Complexity: Medium

---

#### MLP-011 — Grocery Shopping Mode
**Status:** Backlog

Dedicated shopping experience.

Features:
- Category sections
- Collapse completed items
- Large touch-friendly checkboxes
- Mobile optimized shopping view

---

#### MLP-012 — Pantry Awareness
**Status:** Backlog

Exclude ingredients already on hand.

Examples:
- Inventory integration
- Shopping recommendations
- Reorder suggestions
- Low inventory alerts

---

#### MLP-013 — Meal History & Favorites
**Status:** Backlog

Track:
- Most cooked meals
- Favorite meals
- Recently used meals
- Last cooked date

Provide recommendations based on usage.

---

#### MLP-017 — Restaurant Favorites
**Status:** Backlog

Maintain a household restaurant list.

Features:
- Favorite restaurants
- Cuisine type
- Notes
- Kids eat free nights
- Date night options

Integrates with Restaurant Nights.

---

#### MLP-018 — Meal Budget Tracking
**Status:** Backlog

Track estimated meal costs.

Features:
- Cost per meal
- Weekly meal budget
- Restaurant spending
- Grocery spending trends

---

#### MLP-019 — Leftovers Management
**Status:** Backlog

Support leftover planning.

Examples:
- Cook once, eat twice
- Planned leftover nights
- Reduced grocery generation
- Waste reduction

---

#### MLP-020 — AI Meal Suggestions
**Status:** Backlog

Recommend meals based on:
- Family favorites
- Existing pantry inventory
- Upcoming weather
- Grocery list contents
- Seasonal preferences

---

#### MLP-021 — Random Weekly Meal Generator
**Status:** Complete

Generate a week of meals using the saved meal library.

Completed:
- Fills empty days only
- Uses saved meals
- Preserves existing plans
- Preserves restaurant nights
- Automatically generates grocery items
- Confirmation prompt before generation

---

#### MLP-022 — Week-Based Grocery Lists
**Status:** Complete

Limit grocery lists to the selected planning week.

Completed:
- Grocery list follows selected week
- Future weeks do not pollute current shopping
- Grocery planning remains synchronized with weekly meal plans

---

## HOME-001
Quick Add Modals  
Status: Backlog

### Goals
- Add quick task creation modal from Home dashboard
- Add quick activity creation modal from Home dashboard
- Reuse existing task creation logic
- Reuse existing activity creation logic
- Refresh dashboard after save
- Keep full Tasks and Activities pages for advanced editing
- Support fast parent-friendly entry without leaving the dashboard

# Shopping Lists (SHOP)

### ✅ Completed

#### SHOP-001 — Shopping Lists Foundation
**Status:** Complete

Create and manage shared household shopping lists.

Completed:
- Shopping list creation
- Shopping list deletion
- Shopping list archiving
- Household sharing
- Household security model

---

#### SHOP-002 — Shopping List Items
**Status:** Complete

Manage shopping list contents.

Completed:
- Add items
- Delete items
- Check off items
- Categorize items
- Track completion status

---

#### SHOP-003 — Meal Planner Integration
**Status:** Complete

Generate shopping lists directly from meal planning.

Completed:
- Generate shopping list from weekly grocery list
- Preserve categories
- Preserve quantities
- Automatically navigate to Shopping page
- Shared household visibility

---

#### SHOP-004 — Duplicate Prevention
**Status:** Complete

Prevent duplicate shopping lists from being generated.

Completed:
- Detect existing shopping list for week
- Prevent duplicate creation
- Reuse existing shopping workflow

---

#### SHOP-005 — Shopping Progress Dashboard
**Status:** Complete

Enhance shopping list summary.

Completed:
- Remaining items
- Completed items
- Percent complete
- Progress indicator

---

#### SHOP-006 — Mobile Shopping Mode
**Status:** Complete

Create a grocery-store-friendly experience.

Completed:
- Large tap targets
- Simplified layout
- Focused shopping view
- Mobile-first design

---

#### SHOP-007 — Shopping Completion Workflow
**Status:** Complete

Support finishing shopping trips.

Completed:
- Mark shopping complete
- Auto archive option
- Shopping history

---

### 📋 Backlog

#### SHOP-008 — Reopen Archived Lists
**Status:** Backlog

Goals:
- Restore archived shopping lists
- Recover accidentally archived lists

---

#### SHOP-009 — Shopping Dashboard Widget
**Status:** Backlog

Goals:
- Home dashboard shopping card
- Remaining item count
- Quick link to active list

---

#### SHOP-010 — Smart Shopping Categories
**Status:** Backlog

Goals:
- Auto-categorize grocery items
- Reuse meal planner category intelligence
- Improve shopping organization

---

#### SHOP-011 — Shopping History & Trends
**Status:** Backlog

Goals:
- Most purchased items
- Shopping frequency
- Household shopping insights

---

#### SHOP-012 — Shared Shopping Notifications
**Status:** Backlog

Goals:
- Notify household when shopping completed
- Notify when list generated
- Shared shopping coordination

---

## UI-001
Shared Page Header Component  
Status: Backlog

### Goals
- Create reusable PageHeader component
- Standardize label, title, description, and action button layout
- Replace duplicated headers across core pages
- Apply to Tasks, Meals, Shopping, Calendar, Family, Activities, Trips, School, Documents, and Settings
- Improve visual consistency and reduce repeated JSX

---

### Notes
- Current Home buttons navigate to Tasks and Activities.
- Future version should open lightweight modal forms instead.
- This should wait until the UI modernization pass is stable.

---

## Backlog

- Shared page header for Meals & Shopping
- About page redesign
- Household invitation workflow
- Activity templates
- Document vault
- Mobile calendar improvements
- Release notes system
- Dynamic version/build tracking

## UI-002
Dashboard Modernization
Status: Backlog

### Goals
- Reduce dashboard clutter
- Improve mobile usability
- Modular dashboard cards
- Customizable dashboard layout

---

## UI-003
Mobile Calendar Experience
Status: Backlog

### Goals
- Calendar event popovers
- Faster event editing
- Improved month navigation
- Mobile-first interactions

---

## FAM-025
Recurring Important Dates
Status: Planned

### Goals
- Annual birthdays
- Annual anniversaries
- Annual holidays
- Recurring family events

## Platform & Infrastructure

- Shared page header for Meals & Shopping
- Household invitation workflow
- Dynamic version/build tracking
- Centralized release management (config/releases.js)
- Release notes system
- About page redesign