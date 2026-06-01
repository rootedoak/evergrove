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
Status: Planned

### Goals
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

### Notes
- Current Home buttons navigate to Tasks and Activities.
- Future version should open lightweight modal forms instead.
- This should wait until the UI modernization pass is stable.