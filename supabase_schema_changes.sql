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