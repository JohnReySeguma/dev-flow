# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-11-03

Step 6 of the API integration: reports from the API (`v2.0.0-beta.5`).

### Changed

- In API mode the reports page shows the server's burndown, velocity and sprint history. The burndown now follows the issue history, so issues added, removed, re-estimated or reopened mid-sprint are counted correctly.
- Reports refresh once the server has caught up with a change made in the app, keeping the previous numbers on screen meanwhile; a placeholder shows while they first load and a retry if they fail.
- Demo mode still computes the reports in the browser.

## [1.5.0] - 2026-11-03

Step 5 of the API integration: projects, boards, backlogs and sprints on the server (API `v2.0.0-beta.5`).

### Added

- Opening a workspace loads its projects, workflow columns, sprints, issues and members from the API, with a placeholder meanwhile and a retry if it fails. Switching workspaces loads the other one; nothing carries over.
- Every change is saved to the server: creating, editing, dragging, re-ranking and deleting issues; adding, renaming, reordering and deleting columns; creating, renaming and deleting projects; and creating, editing, deleting, starting and completing sprints. Changes appear at once and are sent one at a time, in order.
- A refused change shows a notice with the reason and reloads the project, so the screen matches the server again.
- Comments in the issue panel: read every comment with its author and time; members and admins add one (Ctrl/Cmd+Enter posts).

### Changed

- Assignees, avatars, the team row, "My issues" and quick add use the workspace's real members in API mode.
- In API mode, Workspace settings → Reset demo data restores the workspace's sample projects on the server, for everyone, and keeps projects people created.
- Sprint actions were planned for Step 6 but are included here, because issues on the server can only move into sprints the server knows. Step 6 switches the reports to the API's own numbers.

## [1.4.0] - 2026-11-03

Step 4 of the API integration: multiple workspaces on API v2 (`v2.0.0-beta.5`).

### Added

- A workspace switcher in the sidebar lists your workspaces with your role in each (the shared demo one is marked) and creates new ones, optionally with sample projects. Accounts without a workspace see a new `/welcome` page.
- Workspace settings show the name and URL: admins rename (the URL stays the same) and delete after typing the name; anyone can leave. `LAST_ADMIN` explains what to do instead.
- Generate token asks which workspace the token works in (default: the one used last), and the list shows each token's workspace.
- Sign-up opens the new account's own workspace; accepting an invite opens the inviting workspace.

### Changed

- **Breaking:** API mode needs API v2: set `NEXT_PUBLIC_API_URL` to `http://localhost:4000/api/v2`. Types are generated from the `v2.0.0-beta.5` spec.
- Workspace pages moved under `/w/<slug>/…` (demo mode: `/w/acme-inc/…`). Old links such as `/projects/DEV/board` and `/settings` redirect into the workspace you used last, if it is still yours. Profile and the sign-in, invite and reset pages stay global.
- Roles and permissions follow your role in the current workspace.
- Losing access to a workspace (leaving, deleting, being removed, or a `404`) refreshes your workspaces and opens another one, or `/welcome`.
- In the shared demo workspace, renaming, deleting, leaving, invites and member changes are hidden; resetting the sample data stays available to admins. The shared demo accounts see their profile and tokens read-only, and sign-in explains `oauth_account_locked`.
- Accepting an invite whose email signed up in the meantime (`EMAIL_TAKEN`) asks you to sign in instead.

## [1.3.0] - 2026-11-02

Step 3 of the API integration: the workspace (API `v0.3.0`).

### Added

- Workspace settings load the real members and pending invites; admins invite, resend, change roles and remove members through the API, with clear messages for refusals such as `LAST_ADMIN` and for invites whose email failed (`EMAIL_DELIVERY_FAILED`, offering Resend).
- A new `/invite` page for emailed invites: preview the workspace, inviter, role and expiry, then accept with a name and password and continue signed in.
- Role-based controls: viewers get a read-only app, and workflow editing, project deletion, team management and demo reset are limited to admins.

### Changed

- Removing a member or revoking an invite asks for confirmation instead of offering an undo, because removal deletes the account on the server immediately.

## [1.2.0] - 2026-11-02

Step 2 of the API integration: authentication (API `v0.2.0`).

### Added

- Real sign-in, sign-up and logout in API mode, with server validation messages on their fields and `?next=` to return to the page that required sign-in.
- Session check on load: signed-in routes wait for `GET /auth/me`, send signed-out visitors to `/login`, and offer a retry when the API can't answer.
- Transparent token renewal: an expired access token triggers one shared `POST /auth/refresh` (single-flight across requests and tabs) and a retry.
- GitHub and Google sign-in through the API's OAuth redirect, with a message for each `/login?error=oauth_*` failure.
- Forgot password through the API, and a new `/reset-password` page for the emailed link.
- Profile loaded and saved through `GET`/`PATCH /me`, sending only changed fields with `If-Match`; a conflicting change offers "Load latest". The sidebar shows the signed-in account.
- Personal access tokens listed, created (secret shown once) and revoked through the API.

### Changed

- The sign-up subtitle no longer says any details work when connected to the API.

## [1.1.0] - 2026-11-02

Step 1 of the API integration (API `v0.1.0` features, types from the API's `v1.0.1` spec).

### Added

- API mode: set `NEXT_PUBLIC_API_URL` to connect to the DevFlow API; leave it empty for the unchanged demo mode.
- Committed `.env.example` documenting the variable (every other env file stays ignored).
- TypeScript types generated from the API's OpenAPI 3.1 spec with `openapi-typescript` (`npm run api:types`, pinned to the `v1.0.1` tag).
- `apiFetch()` API client: JSON, `credentials: "include"`, `ApiError` for problem+json responses (code, request id, field errors, `Retry-After`) and `NetworkError` when the server can't be reached.
- A user-facing message for every code in the API's error catalogue, plus per-field validation messages.
- Sign-in and sign-up show only the OAuth providers `GET /config` enables, with an accessible same-size placeholder while it loads; both are hidden when the API is unreachable, and email sign-in always stays available.
- README section "Connecting to the API".

## [1.0.0] - 2026-11-01

### Added

- Public landing page with a live board preview, feature highlights and a "How it works" walkthrough of the sprint process.
- Footer with social links and a "Get in touch" contact form delivered by email via FormSubmit.
- Privacy, Terms and Security pages, an illustrative system status page and a custom 404 page.
- DevFlow logo and app icons.
- Project README.

### Removed

- `create-next-app` placeholder page, favicon and assets.

## [0.3.0] - 2026-11-01

### Added

- Responsive app shell with sidebar navigation (desktop rail, mobile drawer) listing every project.
- Projects overview with active-sprint progress and a "New project" dialog.
- Profile page: personal settings form and personal access tokens (generate, copy once, revoke).
- Workspace settings: team members, role changes, invites with undo, and demo data reset.
- Sign-in and sign-up flows with validation, password strength meter and simulated OAuth, landing on the projects overview.

## [0.2.0] - 2026-11-01

### Added

- Domain model for projects, categorised workflow statuses, sprints and issues, with seed data generated relative to the current date.
- Client store persisted to `localStorage`, with actions for issues, sprint lifecycle (create, start, complete with carry-over) and workflow editing.
- Project routes under `/projects/[key]` with a shared shell, ⌘K jump-to-issue, issue detail sheet and create-issue dialog.
- Sprint board showing the active sprint in the project's workflow columns: drag-and-drop, filters, grouping, display options, quick add, column rename/reorder/delete and "Add column".
- Backlog and sprint planning with drag-and-drop ranking, start/edit/delete sprint.
- Reports: burndown, velocity and sprint history.
- Project settings: general details, workflow editor and project deletion.

## [0.1.0] - 2026-11-01

### Added

- Dark design tokens (zinc canvas, layered surfaces, hairline borders, violet accent) and global styles with reduced-motion support.
- UI primitives: button variants, form fields with accessible hints/errors, settings sections, dropdown menu, native `<dialog>` modal and sheet, avatar with presence ring, copy button, logo and brand icons.
- `cn()` class merging and hydration-safe date helpers.
- Team member model.

[1.6.0]: https://github.com/JohnReySeguma/dev-flow/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/JohnReySeguma/dev-flow/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/JohnReySeguma/dev-flow/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/JohnReySeguma/dev-flow/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/JohnReySeguma/dev-flow/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/JohnReySeguma/dev-flow/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/JohnReySeguma/dev-flow/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/JohnReySeguma/dev-flow/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/JohnReySeguma/dev-flow/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/JohnReySeguma/dev-flow/releases/tag/v0.1.0
