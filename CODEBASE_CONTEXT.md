# Codebase Context

## What This App Is

Code Manager is a full-stack Nuxt app for Microsoft Business Central AL developers.
It helps teams manage object ID ranges, assign IDs to AL objects, detect conflicts, and track usage over time.

The core idea is simple:
- A range defines a contiguous block of IDs.
- Assignments consume individual IDs inside a range.
- The app enforces bounds, prevents duplicate active assignments, and marks ranges as full or deprecated when needed.

## High-Level Architecture

- Frontend: Nuxt 4 + Vue 3 + Nuxt UI
- Backend: Nitro server routes under `server/api`
- Database: Drizzle ORM over SQLite
- Auth: `nuxt-auth-utils` with GitHub and Google OAuth
- Validation: Zod schemas in `shared/utils/schema.ts`
- Styling: Tailwind CSS v4 with Nuxt UI components

The app uses server-side route handlers for all persistence and authorization checks. UI pages mostly fetch data from the API and render forms, tables, and summary cards.

## Main User Flows

### 1. Login and session setup

Users sign in from `/` using GitHub or Google OAuth.
On success, the OAuth callback creates or updates the user record, stores the session, and redirects to `/dashboard`.

### 2. Browsing ranges

The dashboard shows range summary cards, search, status filters, and the list of ranges.
Each range card can expand to show assignments for that range.

### 3. Managing assignments

The assignments page shows all assignments in a searchable, filterable table.
Assignments can be created, edited, or released, depending on permissions and assignment state.

### 4. Admin actions

Admin users can create, update, and deprecate ranges and can also manage user roles.

## Routes

### Page routes

| Route | Purpose |
| --- | --- |
| `/` | Login page using OAuth providers. |
| `/dashboard` | Main range overview and range management screen. |
| `/assignments` | Assignment table, search, filtering, and row actions. |
| `/auth/logout` | Clears the session and returns to the login page. |

### Route protection

`app/middleware/auth.global.ts` protects every route except `/` and `/auth/logout`.
Anonymous users are redirected to `/`, and authenticated users landing on `/` are redirected to `/dashboard`.

### Server routes

#### Auth

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/auth/github` | GET | Starts GitHub OAuth login. |
| `/api/auth/google` | GET | Starts Google OAuth login. |
| `/api/auth/logout` | GET | Clears the current session. |

#### Users

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/users/me` | GET | Returns the current session user. |
| `/api/users` | GET | Admin-only list of users with sanitized OAuth account data. |
| `/api/users/:id/role` | PATCH | Admin-only role update, with self-edit protection. |

#### Ranges

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/ranges` | GET | Returns all ranges with usage stats. |
| `/api/ranges` | POST | Admin-only range creation. |
| `/api/ranges/:id` | GET | Returns one range and its stats. |
| `/api/ranges/:id` | PATCH | Admin-only range update. |
| `/api/ranges/:id` | DELETE | Admin-only deprecate action. |
| `/api/ranges/:id/nextId` | GET | Returns the next available ID in the range. |

#### Assignments

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/assignments` | GET | Lists assignments with optional `rangeId`, `assignedTo`, `objectType`, `status`, and `objectId` filters. |
| `/api/assignments` | POST | Creates a new assignment. |
| `/api/assignments/:id` | GET | Returns assignments for a given range ID. |
| `/api/assignments/:id` | PATCH | Updates an assignment. |
| `/api/assignments/:id` | DELETE | Releases an assignment instead of hard deleting it. |
| `/api/assignments/:id` | POST | Placeholder handler at the moment. |

#### Utility and placeholder endpoints

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/dashboard` | GET | Placeholder handler returning "Hello Nitro". |
| `/api/audit` | GET | Placeholder handler returning "Hello Nitro". |
| `/api/sync` | POST | Placeholder handler returning "Hello Nitro". |

## Database Schema

### `users`

Stores application users.

Fields:
- `id`: primary key
- `name`
- `email`: unique and indexed
- `avatarUrl`
- `role`: `admin` or `developer`
- `createdAt`
- `updatedAt`

Used by:
- OAuth login and session creation
- Audit log attribution
- Range creation ownership
- Assignment creation and edits
- Role management

### `accounts`

Stores linked OAuth accounts.

Fields:
- `id`: primary key
- `userId`: foreign key to `users.id`
- `username`
- `accessToken`
- `provider`: `github` or `google`
- `providerUserId`
- `createdAt`
- `updatedAt`

Used to map a provider identity back to an internal user.

### `id_ranges`

Stores ID blocks that the app manages.

Fields:
- `id`: primary key
- `name`
- `description`
- `startId`
- `endId`
- `owner`
- `publisher`
- `environment`: `dev`, `test`, or `prod`
- `status`: `active`, `deprecated`, or `full`
- `createdBy`: foreign key to `users.id`
- `createdAt`
- `updatedAt`

Indexes:
- `status`
- `owner`
- `publisher`
- `environment`

### `id_assignments`

Stores individual ID assignments inside a range.

Fields:
- `id`: primary key
- `rangeId`: foreign key to `id_ranges.id`
- `objectId`
- `objectName`
- `objectType`
- `assignedTo`
- `assignedBy`: foreign key to `users.id`
- `notes`
- `status`: `in_use`, `released`, or `reserved`
- `createdAt`
- `updatedAt`

Indexes:
- `rangeId`
- `objectId`
- `status`
- `assignedTo`
- compound index on `rangeId`, `objectId`, `status`

### `audit_log`

Stores an audit trail for changes to users, ranges, and assignments.

Fields:
- `id`: primary key
- `entityType`: `range`, `assignment`, or `user`
- `entityId`
- `action`: `create`, `update`, `delete`, `assign`, `release`, or `deprecate`
- `actor`: `system`, `admin`, or `user`
- `actorUserId`
- `beforeState`
- `afterState`
- `description`
- `createdAt`

Indexes:
- `entityId`
- `createdAt`
- `actor`

### `sync_meta`

Tracks sync state for a device or client.

Fields:
- `id`
- `deviceId`
- `lastSyncedAt`
- `pendingOps`
- `lastError`
- `updatedAt`

### `sync_queue`

Stores queued sync operations.

Fields:
- `id`
- `deviceId`
- `entityType`: `range` or `assignment`
- `entityId`
- `operation`: `create`, `update`, `delete`, `assign`, `release`, or `deprecate`
- `payload`
- `syncStatus`: `pending`, `synced`, `conflict`, or `failed`
- `retryCount`
- `createdAt`
- `updatedAt`
- `syncedAt`

## Relationships

Defined in `server/db/schema/relations.ts`.

- `users` has many `accounts`
- `users` has many created `id_ranges`
- `users` has many `id_assignments` through `assignedBy`
- `accounts` belongs to one `user`
- `id_ranges` has many `id_assignments`
- `id_ranges` belongs to one creator user through `createdBy`
- `id_assignments` belongs to one `id_range`
- `id_assignments` belongs to one assigning user through `assignedBy`
- `audit_log` can be linked to a user through `actorUserId`

## Business Rules

### Range creation and updates

The range workflow is controlled by `server/utils/idLogic.ts` and `server/db/queries/ranges.ts`.

Important rules:
- Ranges cannot overlap.
- `startId` must be less than `endId`.
- Deprecated ranges cannot be edited or assigned against.
- Shrinking a range is blocked if active assignments exist beyond the new end value.
- Admins only can create, update, or deprecate ranges.

### Range status

Ranges move between these statuses:
- `active`: normal working state
- `full`: all numeric IDs in the range have at least one active assignment
- `deprecated`: manually deprecated, no longer editable or assignable

The helper `updateRangeStatusIfNeeded` recalculates whether a range should become `full` or return to `active` after assignment changes.

### Assignment creation and updates

Important rules:
- Assignments must fall inside the range bounds.
- Duplicate active IDs in the same range are blocked.
- A range marked `full` cannot receive new assignments.
- A deprecated range cannot receive assignments.
- Updating a released assignment is blocked.
- Non-admin users can only edit or release assignments they own.
- Releasing an assignment sets its status to `released` instead of deleting it.

### Usage stats

Range stats are computed from active assignments:
- `used`: distinct IDs with at least one `in_use` or `reserved` assignment
- `released`: distinct IDs where all rows are released
- `reserved`: currently returned as `0` in the current implementation
- `percentUsed`: `used / total * 100`
- `nextAvailableId`: first numeric ID in the range with no active assignment
- `isFull`: true when no numeric ID has zero active assignments

## How the UI Uses The API

### Dashboard

The dashboard page fetches ranges and renders summary cards, a filter bar, and a list of range cards.
Each range card can expand to load assignments for that range from `/api/assignments/:id`.

### Assignments page

The assignments page fetches:
- all ranges for display context
- all assignments for the table

It then applies local search and filters before rendering the assignment table.
The table supports grouped rows and opens assignment editing UI from the table state.

### Login and logout

- Login page: OAuth buttons redirect to the provider handlers.
- Logout page: clears the local session, clears Nuxt data, and returns to `/`.

## Environment Variables

The app validates required env vars in `app/lib/env.ts`.

Required values:
- `NUXT_DB_URL`
- `NUXT_DB_AUTH_TOKEN`
- `NUXT_SESSION_PASSWORD`
- `NUXT_SESSION_NAME`
- `NUXT_OAUTH_GITHUB_CLIENT_ID`
- `NUXT_OAUTH_GITHUB_CLIENT_SECRET`
- `NUXT_OAUTH_GITHUB_CALLBACK_URL`
- `NUXT_OAUTH_GOOGLE_CLIENT_ID`
- `NUXT_OAUTH_GOOGLE_CLIENT_SECRET`
- `NUXT_OAUTH_GOOGLE_CALLBACK_URL`

These are wired into `nuxt.config.ts` under `runtimeConfig`.

## Notes

- `server/api/dashboard.get.ts`, `server/api/audit.get.ts`, and `server/api/sync.post.ts` currently return placeholder text and are not part of the main UI flow yet.
- The main canonical assignment-by-range endpoint used by the UI is `/api/assignments/:id`.
- The app currently centers the user experience around range management, assignment tracking, and auditability rather than a general-purpose admin console.
