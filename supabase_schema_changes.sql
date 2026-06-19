-- Evergrove schema changes
-- Keep this file updated whenever database changes are made.

-- CREATE FAMILY MEMBER TABLE

create table family_members (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    name text not null,
    role text default 'child',
    birthdate date,
    school text,
    grade text,
    notes text
);

-- ADD USER ID TO FAMILY MEMBER TABLE

alter table family_members
add column user_id uuid references auth.users(id) on delete cascade;

-- ADD RLS

alter table family_members enable row level security;

-- CREATE RLS POLICIES

create policy "Users can view their own family members"
on family_members
for select
using (auth.uid() = user_id);

create policy "Users can create their own family members"
on family_members
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own family members"
on family_members
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own family members"
on family_members
for delete
using (auth.uid() = user_id);

-- ADD ROLE TO FAMILY MEMBERS

alter table family_members
add column role text default 'child';

-- ADD AVATAR TO FAMILY MEMBERS

alter table family_members
add column avatar_emoji text;

-- ADD NOTES TO FAMILY MEMBERS

alter table family_members
add column notes text;

notify pgrst, 'reload schema';

-- CREATE ACTIVITIES TABLE

create table activities (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),

    user_id uuid references auth.users(id) on delete cascade,

    family_member_id uuid references family_members(id) on delete cascade,

    name text not null,
    organization text,
    season text,

    start_date date,
    end_date date,

    registration_open_date date,
    registration_close_date date,

    cost numeric,

    notes text
);

-- ALTER ACTIVITIES SECURITY

alter table activities enable row level security;

-- CREATE ACTIVITIES POLICY

create policy "Users can view their own activities"
on activities
for select
using (auth.uid() = user_id);

create policy "Users can create their own activities"
on activities
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own activities"
on activities
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own activities"
on activities
for delete
using (auth.uid() = user_id);

-- CREATE TASKS TABLE

create table tasks (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),

    user_id uuid references auth.users(id) on delete cascade,

    title text not null,
    description text,

    due_date date,

    status text default 'open',

    family_member_id uuid references family_members(id) on delete set null,

    activity_id uuid references activities(id) on delete set null
);

-- TASK RLS POLICY

alter table tasks enable row level security;

create policy "Users can view their own tasks"
on tasks
for select
using (auth.uid() = user_id);

create policy "Users can create their own tasks"
on tasks
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
on tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own tasks"
on tasks
for delete
using (auth.uid() = user_id);

-- ADD SCHOOL ITEMS TABLE

create table school_items (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),

    user_id uuid references auth.users(id) on delete cascade,
    family_member_id uuid references family_members(id) on delete cascade,

    title text not null,
    category text,

    due_date date,

    notes text,

    completed boolean default false
);

-- ADD POLICIES TO SCHOOL HUB

alter table school_items enable row level security;

create policy "Users can view their own school items"
on school_items
for select
using (auth.uid() = user_id);

create policy "Users can create their own school items"
on school_items
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own school items"
on school_items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own school items"
on school_items
for delete
using (auth.uid() = user_id);

-- CREATED DOCUMENT TABLE

create table documents (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),

    user_id uuid references auth.users(id) on delete cascade,
    family_member_id uuid references family_members(id) on delete set null,
    school_item_id uuid references school_items(id) on delete set null,
    activity_id uuid references activities(id) on delete set null,

    title text not null,
    category text default 'general',

    file_path text not null,
    file_name text,
    file_type text,
    file_size bigint,

    notes text
);

-- DOCUMENT TABLE RLS

alter table documents enable row level security;

create policy "Users can view their own documents"
on documents
for select
using (auth.uid() = user_id);

create policy "Users can create their own documents"
on documents
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own documents"
on documents
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own documents"
on documents
for delete
using (auth.uid() = user_id);

-- DOCUMENT STORAGE POLICY

create policy "Users can upload their own documents"
on storage.objects
for insert
with check (
    bucket_id = 'family-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own documents"
on storage.objects
for select
using (
    bucket_id = 'family-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own documents"
on storage.objects
for update
using (
    bucket_id = 'family-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own documents"
on storage.objects
for delete
using (
    bucket_id = 'family-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
);

-- ADD PET FIELDS TO FAMILY MEMBERS

alter table family_members
add column if not exists species text,
add column if not exists breed text,
add column if not exists birthday date;

-- ADD COLUMN TO FAMILY MEMBER FOR EXISTING USER

alter table family_members
add column if not exists is_account_owner boolean default false;

-- PREVENT DUPLICATE FAMILY MEMBERS

create unique index if not exists one_account_owner_per_user
on family_members (user_id)
where is_account_owner = true;

-- CREATE LINKED ACCOUNTS

alter table family_members
add column if not exists linked_user_id uuid references auth.users(id),
add column if not exists invite_email text,
add column if not exists invite_status text default 'not_invited';

-- CREATE HOUSEHOLDS TABLE

create table if not exists households (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default now()
);

create table if not exists household_users (
    id uuid primary key default gen_random_uuid(),
    household_id uuid references households(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text not null default 'admin',
    status text not null default 'active',
    created_at timestamp with time zone default now(),
    unique(household_id, user_id)
);

alter table family_members
add column if not exists household_id uuid references households(id) on delete cascade;

alter table family_members
add column if not exists linked_user_id uuid references auth.users(id);

alter table family_members
add column if not exists invite_email text;

alter table family_members
add column if not exists invite_status text default 'not_invited';

create index if not exists family_members_household_id_idx
on family_members(household_id);

create index if not exists household_users_user_id_idx
on household_users(user_id);

create index if not exists family_members_invite_email_idx
on family_members(lower(invite_email));

-- HOUSEHOLD RLS POLICY

alter table households enable row level security;
alter table household_users enable row level security;

create policy "Users can view their households"
on households
for select
using (
    id in (
        select household_id
        from household_users
        where user_id = auth.uid()
    )
);

create policy "Users can create households"
on households
for insert
with check (created_by = auth.uid());

create policy "Users can view household users"
on household_users
for select
using (
    household_id in (
        select household_id
        from household_users
        where user_id = auth.uid()
    )
);

create policy "Users can join household records for themselves"
on household_users
for insert
with check (user_id = auth.uid());

create policy "Household admins can manage household users"
on household_users
for all
using (
    household_id in (
        select household_id
        from household_users
        where user_id = auth.uid()
        and role = 'admin'
        and status = 'active'
    )
);

-- ADD ROUTINES TABLE

create table routines (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),

    user_id uuid references auth.users(id) on delete cascade,
    family_member_id uuid references family_members(id) on delete set null,

    title text not null,
    description text,

    category text default 'general',
    frequency text default 'weekly',

    next_due date,
    last_completed date,

    create_task boolean default true,
    active boolean default true
);

-- ADD RLS TO ROUTINES

alter table routines enable row level security;

create policy "Users can view their own routines"
on routines
for select
using (auth.uid() = user_id);

create policy "Users can create their own routines"
on routines
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own routines"
on routines
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own routines"
on routines
for delete
using (auth.uid() = user_id);

-- ADD TRIPS TABLE

create table if not exists trips (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    destination text,
    start_date date not null,
    end_date date,
    notes text,
    created_at timestamptz not null default now()
);

create table if not exists trip_family_members (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid not null references trips(id) on delete cascade,
    family_member_id uuid not null references family_members(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (trip_id, family_member_id)
);

alter table trips enable row level security;
alter table trip_family_members enable row level security;

create policy "Users can manage their own trips"
on trips
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage trip family members for their trips"
on trip_family_members
for all
using (
    exists (
        select 1
        from trips
        where trips.id = trip_family_members.trip_id
        and trips.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from trips
        where trips.id = trip_family_members.trip_id
        and trips.user_id = auth.uid()
    )
);

-- ADD TRIP ID TO TASKS

alter table tasks
add column if not exists trip_id uuid references trips(id) on delete set null;

-- ADD START/END TIMES TO ACTIVITIES

alter table activities
add column if not exists start_time time,
add column if not exists end_time time;

-- ADD ACTIVITY SESSIONS

create table activity_sessions (
    id uuid primary key default gen_random_uuid(),
    activity_id uuid not null references activities(id) on delete cascade,
    session_date date not null,
    start_time time,
    end_time time,
    location text,
    notes text,
    created_at timestamptz default now()
);

-- RLS FOR ACTIVITY SESSIONS

alter table activity_sessions enable row level security;

drop policy if exists "Users can view their own activity sessions"
on activity_sessions;

drop policy if exists "Users can create activity sessions for their own activities"
on activity_sessions;

drop policy if exists "Users can update their own activity sessions"
on activity_sessions;

drop policy if exists "Users can delete their own activity sessions"
on activity_sessions;

create policy "Users can view their own activity sessions"
on activity_sessions
for select
using (
    exists (
        select 1
        from activities
        where activities.id = activity_sessions.activity_id
        and activities.user_id = auth.uid()
    )
);

create policy "Users can create activity sessions for their own activities"
on activity_sessions
for insert
with check (
    exists (
        select 1
        from activities
        where activities.id = activity_sessions.activity_id
        and activities.user_id = auth.uid()
    )
);

create policy "Users can update their own activity sessions"
on activity_sessions
for update
using (
    exists (
        select 1
        from activities
        where activities.id = activity_sessions.activity_id
        and activities.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from activities
        where activities.id = activity_sessions.activity_id
        and activities.user_id = auth.uid()
    )
);

create policy "Users can delete their own activity sessions"
on activity_sessions
for delete
using (
    exists (
        select 1
        from activities
        where activities.id = activity_sessions.activity_id
        and activities.user_id = auth.uid()
    )
);

-- ADD PARENT ACTIVITY TO ACTIVITY

alter table activities
add column parent_activity_id uuid references activities(id);

-- ADD VISIBILITY TO TASKS

alter table tasks
add column if not exists visibility text not null default 'household';

alter table tasks
add constraint tasks_visibility_check
check (visibility in ('household', 'private'));

-- ADD HOUSEHOLD ID TO TASKS

alter table tasks
add column if not exists household_id uuid;

-- CREATE USER PREFERENCES TABLE

create table if not exists user_preferences (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade unique,

    household_name text default 'My Family',
    timezone text default 'America/Chicago',

    dashboard_window_days integer default 7,
    timeline_window_days integer default 90,
    week_starts_on text default 'Sunday',

    birthday_reminders boolean default true,
    trip_reminders boolean default true,
    activity_reminders boolean default true,
    school_reminders boolean default true,
    task_reminders boolean default true,

    show_birthdays boolean default true,
    show_trips boolean default true,
    show_school_items boolean default true,
    show_activity_sessions boolean default true,
    show_suggested_tasks boolean default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table user_preferences enable row level security;

drop policy if exists "Users can view their own preferences"
on user_preferences;

drop policy if exists "Users can create their own preferences"
on user_preferences;

drop policy if exists "Users can update their own preferences"
on user_preferences;

create policy "Users can view their own preferences"
on user_preferences
for select
using (auth.uid() = user_id);

create policy "Users can create their own preferences"
on user_preferences
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
on user_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ADD MEALS TABLE

create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  household_id uuid,
  name text not null,
  description text,
  category text,
  created_at timestamp with time zone default now()
);

-- ADDS MEAL INGREDIENTS TABLE

create table meal_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  household_id uuid,
  meal_id uuid references meals(id) on delete cascade,
  name text not null,
  quantity text,
  category text,
  created_at timestamp with time zone default now()
);

-- ADDS MEAL PLANS

create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  household_id uuid,
  meal_id uuid references meals(id) on delete set null,
  planned_date date not null,
  meal_name text not null,
  notes text,
  created_at timestamp with time zone default now()
);

-- ADDS GROCERY ITEMS

create table grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  household_id uuid,
  name text not null,
  quantity text,
  category text,
  source_meal_plan_id uuid references meal_plans(id) on delete cascade,
  checked boolean default false,
  created_at timestamp with time zone default now()
);

-- ADD HOUSEHOLD ID TO MEALS

alter table meals
add column if not exists household_id uuid;

alter table meal_ingredients
add column if not exists household_id uuid;

alter table meal_plans
add column if not exists household_id uuid;

alter table grocery_items
add column if not exists household_id uuid;

-- ADD PLAN TYPE TO MEALS

alter table meal_plans
add column if not exists plan_type text default 'home';

alter table meal_plans
add column if not exists restaurant_name text;

-- ADD SHOPPING LIST TABLES

create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null,
  title text not null,
  status text default 'active',
  source_week_start date,
  source_week_end date,
  created_at timestamp with time zone default now(),
  archived_at timestamp with time zone
);

create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null,
  shopping_list_id uuid not null references shopping_lists(id) on delete cascade,
  name text not null,
  quantity text,
  category text,
  checked boolean default false,
  source_grocery_item_ids uuid[],
  created_at timestamp with time zone default now()
);

alter table shopping_lists enable row level security;
alter table shopping_list_items enable row level security;

create policy "Users can view household shopping lists"
on shopping_lists for select
using (
  household_id in (
    select household_id
    from family_members
    where user_id = auth.uid()
  )
);

create policy "Users can insert household shopping lists"
on shopping_lists for insert
with check (
  user_id = auth.uid()
  and household_id in (
    select household_id
    from family_members
    where user_id = auth.uid()
  )
);

create policy "Users can update household shopping lists"
on shopping_lists for update
using (
  household_id in (
    select household_id
    from family_members
    where user_id = auth.uid()
  )
)
with check (
  household_id in (
    select household_id
    from family_members
    where user_id = auth.uid()
  )
);

create policy "Users can delete household shopping lists"
on shopping_lists for delete
using (
  household_id in (
    select household_id
    from family_members
    where user_id = auth.uid()
  )
);

create policy "Users can view household shopping list items"
on shopping_list_items for select
using (
  household_id in (
    select household_id
    from family_members
    where user_id = auth.uid()
  )
);

create policy "Users can insert household shopping list items"
on shopping_list_items for insert
with check (
  user_id = auth.uid()
  and household_id in (
    select household_id
    from family_members
    where user_id = auth.uid()
  )
);

create policy "Users can update household shopping list items"
on shopping_list_items for update
using (
  household_id in (
    select household_id
    from family_members
    where user_id = auth.uid()
  )
)
with check (
  household_id in (
    select household_id
    from family_members
    where user_id = auth.uid()
  )
);

create policy "Users can delete household shopping list items"
on shopping_list_items for delete
using (
  household_id in (
    select household_id
    from family_members
    where user_id = auth.uid()
  )
);

-- ADD CATEGORY ORDER TO USER PREFERENCES

alter table user_preferences
add column if not exists shopping_category_order text[] default array[
  'Produce',
  'Meat',
  'Dairy',
  'Frozen',
  'Pantry',
  'Household',
  'Uncategorized'
];

-- ADD TIMESTAMP TO SHOPPING LISTS

alter table shopping_lists
add column if not exists updated_at timestamp with time zone default now();

-- ADD TRIP PLANS TABLE

create table if not exists trip_plans (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid not null references trips(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    category text default 'Other',
    notes text,
    status text default 'idea',
    sort_order integer default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table trip_plans enable row level security;

create policy "Users can view their own trip plans"
on trip_plans
for select
using (auth.uid() = user_id);

create policy "Users can create their own trip plans"
on trip_plans
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own trip plans"
on trip_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own trip plans"
on trip_plans
for delete
using (auth.uid() = user_id);

-- USE HOUSEHOLD IDS AND NOT USER ID

drop policy if exists "Users can view own preferences" on user_preferences;
drop policy if exists "Users can insert own preferences" on user_preferences;
drop policy if exists "Users can update own preferences" on user_preferences;
drop policy if exists "Users can delete own preferences" on user_preferences;

create policy "Household members can view preferences"
on user_preferences
for select
using (
  household_id in (
    select household_id
    from household_members
    where user_id = auth.uid()
  )
);

create policy "Household members can insert preferences"
on user_preferences
for insert
with check (
  household_id in (
    select household_id
    from household_members
    where user_id = auth.uid()
  )
);

create policy "Household members can update preferences"
on user_preferences
for update
using (
  household_id in (
    select household_id
    from household_members
    where user_id = auth.uid()
  )
)
with check (
  household_id in (
    select household_id
    from household_members
    where user_id = auth.uid()
  )
);

-- CREATE USER DISPLAY PREFERENCES (user_preferences is now household preferences)

create table if not exists user_display_preferences (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    dashboard_window_days integer default 7,
    timeline_window_days integer default 90,
    birthday_reminders boolean default true,
    trip_reminders boolean default true,
    activity_reminders boolean default true,
    school_reminders boolean default true,
    task_reminders boolean default true,
    show_birthdays boolean default true,
    show_trips boolean default true,
    show_school_items boolean default true,
    show_activity_sessions boolean default true,
    show_suggested_tasks boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create unique index if not exists user_display_preferences_user_id_key
on user_display_preferences(user_id);

alter table user_display_preferences enable row level security;

create policy "Users can view own display preferences"
on user_display_preferences
for select
using (user_id = auth.uid());

create policy "Users can insert own display preferences"
on user_display_preferences
for insert
with check (user_id = auth.uid());

create policy "Users can update own display preferences"
on user_display_preferences
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- RENAME USER PREFERENCE TO HOUSEHOLD

alter table user_preferences
rename to household_preferences;

-- RLS FOR HOUSEHOLD PREFERENCES

alter policy "Household members can view preferences"
on household_preferences
rename to "Household members can view household preferences";

alter policy "Household members can insert preferences"
on household_preferences
rename to "Household members can insert household preferences";

alter policy "Household members can update preferences"
on household_preferences
rename to "Household members can update household preferences";

-- ADD CALENDAR EVENTS TABLE

create table if not exists calendar_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    household_id uuid not null references households(id) on delete cascade,

    title text not null,
    event_type text default 'Important Date',
    start_date date not null,
    end_date date,
    start_time time,
    end_time time,
    location text,
    notes text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table calendar_events enable row level security;

create policy "Users can view household calendar events"
on calendar_events
for select
using (
    household_id in (
        select household_id
        from household_members
        where user_id = auth.uid()
    )
);

create policy "Users can create household calendar events"
on calendar_events
for insert
with check (
    household_id in (
        select household_id
        from household_members
        where user_id = auth.uid()
    )
    and user_id = auth.uid()
);

create policy "Users can update household calendar events"
on calendar_events
for update
using (
    household_id in (
        select household_id
        from household_members
        where user_id = auth.uid()
    )
)
with check (
    household_id in (
        select household_id
        from household_members
        where user_id = auth.uid()
    )
);

create policy "Users can delete household calendar events"
on calendar_events
for delete
using (
    household_id in (
        select household_id
        from household_members
        where user_id = auth.uid()
    )
);

-- ADD FEEDBACK TABLE

create table feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    household_id uuid references households(id) on delete cascade,
    type text not null default 'general',
    message text not null,
    status text not null default 'new',
    created_at timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "Users can create household feedback"
on feedback
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their feedback"
on feedback
for select
to authenticated
using (auth.uid() = user_id);

-- DUPLICATE RLS CLEANUP

drop policy if exists "Users can view their meal plans" on meal_plans;
drop policy if exists "Users can insert their meal plans" on meal_plans;
drop policy if exists "Users can update their meal plans" on meal_plans;
drop policy if exists "Users can delete their meal plans" on meal_plans;

create policy "Household members can view meal plans"
on meal_plans for select
using (
  household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
);

create policy "Household members can insert meal plans"
on meal_plans for insert
with check (
  household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
);

create policy "Household members can update meal plans"
on meal_plans for update
using (
  household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
)
with check (
  household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
);

create policy "Household members can delete meal plans"
on meal_plans for delete
using (
  household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
);

drop policy if exists "Users can view their grocery items" on grocery_items;
drop policy if exists "Users can insert their grocery items" on grocery_items;
drop policy if exists "Users can update their grocery items" on grocery_items;
drop policy if exists "Users can delete their grocery items" on grocery_items;

create policy "Household members can view grocery items"
on grocery_items for select
using (
  household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
);

create policy "Household members can insert grocery items"
on grocery_items for insert
with check (
  household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
);

create policy "Household members can update grocery items"
on grocery_items for update
using (
  household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
)
with check (
  household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
);

create policy "Household members can delete grocery items"
on grocery_items for delete
using (
  household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
);

-- ADDITIONAL RLS CLEANUP

drop policy if exists "Users can view their meals" on meals;
drop policy if exists "Users can insert their meals" on meals;
drop policy if exists "Users can update their meals" on meals;
drop policy if exists "Users can delete their meals" on meals;

drop policy if exists "Users can view their meal ingredients" on meal_ingredients;
drop policy if exists "Users can insert their meal ingredients" on meal_ingredients;
drop policy if exists "Users can update their meal ingredients" on meal_ingredients;
drop policy if exists "Users can delete their meal ingredients" on meal_ingredients;

-- ADD RECIPIE URLS

alter table meals
add column if not exists recipe_url text,
add column if not exists is_favorite boolean not null default false;

alter table meal_plans
add column if not exists meal_category text,
add column if not exists is_leftovers boolean not null default false;

-- ADD REPEAT OPTION TO CALENDAR EVENTS

alter table calendar_events
add column if not exists repeats_yearly boolean not null default false;

-- PERSONAL INBOX FOUNDATION

create table if not exists personal_inbox_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  message text,
  item_type text not null default 'notification',

  related_type text,
  related_id uuid,

  status text not null default 'unread',
  due_date date,
  remind_at timestamptz,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists personal_reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  notes text,
  frequency text not null default 'once',
  next_due date,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table personal_inbox_items enable row level security;
alter table personal_reminders enable row level security;

create policy "Users can manage their own inbox items"
on personal_inbox_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their own reminders"
on personal_reminders
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ADD DISPLAY FIELDS TO USER PREFERENCES

alter table user_display_preferences
add column if not exists todo_default_scope text default 'mine_family',
add column if not exists dashboard_task_window text default 'this_week';

alter table user_display_preferences
add constraint todo_default_scope_check
check (todo_default_scope in ('mine', 'mine_family', 'family', 'kids', 'all'));

alter table user_display_preferences
add constraint dashboard_task_window_check
check (dashboard_task_window in ('today', 'this_week', 'next_7_days'));

-- ADD TASK FILTER TO USER PREFERENCES

alter table user_display_preferences
add column if not exists task_default_view text default 'mine_family';

alter table user_display_preferences
drop constraint if exists task_default_view_check;

alter table user_display_preferences
add constraint task_default_view_check
check (task_default_view in ('mine', 'mine_family', 'family', 'kids', 'all'));

-- ADD PUSH NOTIFICATION TABLE

create table if not exists push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    endpoint text not null unique,
    p256dh text not null,
    auth text not null,
    user_agent text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Users can view their own push subscriptions"
on push_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own push subscriptions"
on push_subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own push subscriptions"
on push_subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own push subscriptions"
on push_subscriptions
for delete
to authenticated
using (auth.uid() = user_id);