# Linear Clone Backend API Documentation

Base URL: `http://localhost:3000/api` (for local development)

## Authentication (`/api/auth`)

All protected routes require `Authorization: Bearer <accessToken>`.

### `POST /api/auth/register`
- **Body**: `{ "email": "user@example.com", "name": "John Doe", "password": "password123" }`
- **Returns**: `{ "data": { "user": User, "accessToken": string } }`
- **Cookies**: Sets `refreshToken` as an HTTP-Only cookie.

### `POST /api/auth/login`
- **Body**: `{ "email": "user@example.com", "password": "password123" }`
- **Returns**: `{ "data": { "user": User, "accessToken": string } }`
- **Cookies**: Sets `refreshToken` as an HTTP-Only cookie.

### `POST /api/auth/refresh`
- **Requirements**: `refreshToken` cookie.
- **Returns**: `{ "data": { "user": User, "accessToken": string } }`
- **Description**: Rotates the refresh token (invalidates old, issues new).

### `POST /api/auth/logout`
- **Auth**: Bearer Token
- **Returns**: `{ "data": null }`
- **Description**: Clears refresh token cookie and deletes it from database.

### `GET /api/auth/me`
- **Auth**: Bearer Token
- **Returns**: `{ "data": { "user": User } }`

---

## Workspaces (`/api/workspaces`)

### `GET /api/workspaces`
- **Auth**: Bearer Token
- **Returns**: List of workspaces the current user belongs to.

### `POST /api/workspaces`
- **Auth**: Bearer Token
- **Body**: `{ "name": "My Workspace", "slug": "my-workspace", "logoUrl": "..." }`
- **Returns**: `{ "data": Workspace }`
- **Description**: Creates a new workspace and sets the creator as `ADMIN`.

### `GET /api/workspaces/:slug`
- **Auth**: Bearer Token, User must be `ADMIN` or `MEMBER`
- **Returns**: Workspace details including member list.

### `PATCH /api/workspaces/:slug`
- **Auth**: Bearer Token, User must be `ADMIN`
- **Body**: `{ "name": "New Name", "logoUrl": "..." }`
- **Returns**: Updated Workspace.

### `DELETE /api/workspaces/:slug`
- **Auth**: Bearer Token, User must be `ADMIN`
- **Returns**: `{ "data": null }`

---

## Members (`/api/workspaces/:slug/members`)

### `GET /api/workspaces/:slug/members`
- **Auth**: Bearer Token, User must be `MEMBER`
- **Returns**: List of workspace members.

### `POST /api/workspaces/:slug/members`
- **Auth**: Bearer Token, User must be `ADMIN`
- **Body**: `{ "email": "invitee@example.com" }`
- **Returns**: `{ "data": WorkspaceMember }`

### `PATCH /api/workspaces/:slug/members/:userId/role`
- **Auth**: Bearer Token, User must be `ADMIN`
- **Body**: `{ "role": "ADMIN" | "MEMBER" }`
- **Returns**: `{ "data": WorkspaceMember }`

### `DELETE /api/workspaces/:slug/members/:userId`
- **Auth**: Bearer Token, User must be `ADMIN`
- **Returns**: `{ "data": null }`

---

## Issues (`/api/workspaces/:slug/issues`)

### `GET /api/workspaces/:slug/issues`
- **Auth**: Bearer Token, User must be `MEMBER`
- **Query Params**: `status`, `priority`, `assigneeId`, `overdue` (boolean)
- **Returns**: List of issues.

### `POST /api/workspaces/:slug/issues`
- **Auth**: Bearer Token, User must be `ADMIN`
- **Body**: 
  ```json
  {
    "title": "Bug fix",
    "description": "Details...",
    "priority": "HIGH",
    "assigneeId": "user_id",
    "dueDate": "2026-06-01T00:00:00.000Z"
  }
  ```
- **Returns**: `{ "data": Issue }`

### `GET /api/workspaces/:slug/issues/:id`
- **Auth**: Bearer Token, User must be `MEMBER`
- **Returns**: `{ "data": Issue }`

### `PATCH /api/workspaces/:slug/issues/:id`
- **Auth**: Bearer Token, User must be `ADMIN`
- **Body**: `{ "title": "New", "description": "New", "priority": "LOW", "dueDate": null }`
- **Returns**: `{ "data": Issue }`

### `PATCH /api/workspaces/:slug/issues/:id/status`
- **Auth**: Bearer Token, User must be `MEMBER`
- **Body**: `{ "status": "IN_PROGRESS" }`
- **Description**: Only the assignee or an `ADMIN` can change the status of an issue.

### `PATCH /api/workspaces/:slug/issues/:id/assign`
- **Auth**: Bearer Token, User must be `ADMIN`
- **Body**: `{ "assigneeId": "user_id" | null }`

### `DELETE /api/workspaces/:slug/issues/:id`
- **Auth**: Bearer Token, User must be `ADMIN`
- **Returns**: `{ "data": null }`

---

## Dashboard (`/api/dashboard`)

### `GET /api/dashboard/summary`
- **Auth**: Bearer Token
- **Returns**: Total count, byStatus, byPriority, overdueCount across all user workspaces.

### `GET /api/dashboard/my-issues`
- **Auth**: Bearer Token
- **Returns**: All issues assigned to the current user (excluding `DONE`).

### `GET /api/dashboard/overdue`
- **Auth**: Bearer Token
- **Returns**: Issues past their `dueDate` that are not `DONE` or `CANCELLED`.
