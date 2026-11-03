<p align="center">
  <img src="public/logo.png" alt="DevFlow logo" width="96" height="96" />
</p>

<h1 align="center">DevFlow</h1>

<p align="center">
  A sprint-based issue tracker for engineering teams — backlogs, sprints, custom board workflows and sprint reports.<br />
  Built as a frontend portfolio project with Next.js, React and Tailwind CSS.
</p>

---

## Highlights

- **Per-project Scrum workflow** — every project owns its backlog, sprints and board columns.
- **Sprint board** — drag-and-drop cards across workflow columns, filter by assignee/priority/"My issues", group by status or priority, quick-add, collapse and sort columns.
- **Custom workflows** — add, rename, reorder and delete columns. Each status belongs to a category (*To do*, *In progress*, *Done*) so custom columns still drive completion and reporting.
- **Backlog & sprint planning** — rank issues by drag-and-drop, move them between sprints, start a sprint with a goal and duration, complete it and carry unfinished work forward.
- **Reports** — live burndown for the active sprint, velocity (committed vs. completed) and a sprint history table, drawn as accessible SVG charts with hover tooltips.
- **Issue detail sheet** — edit status, sprint, assignee, priority, type and story points in place.
- **Workspaces** — a switcher between workspaces, projects overview, profile settings, personal access tokens, team roles and invites.
- **Public site** — landing page with a live board preview, legal pages, status page, custom 404 and a working contact form.

## The process it models

```
Project ── owns a Workflow (ordered statuses, each in a category)
  │
  ├─ Backlog ……… issues not in any sprint, ranked by priority order
  ├─ Sprints ……… planned → active (one per project) → completed
  │                the board shows only the active sprint
  └─ Complete ……… snapshots a report, carries unfinished issues
                   to the backlog, a planned sprint or a new sprint
```

1. **Capture** every ticket in the project backlog, estimate it in story points.
2. **Plan** a sprint by dragging issues into it, then start it with a goal and length.
3. **Work** the board — columns are the project's own workflow.
4. **Complete** the sprint and review burndown and velocity in Reports.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, route groups) |
| UI | React 19, Tailwind CSS v4, Lucide icons |
| State | External store via `useSyncExternalStore`, persisted to `localStorage` |
| Charts | Hand-rolled SVG with a CVD-validated palette |
| Contact form | [FormSubmit](https://formsubmit.co) (no backend required) |

Out of the box there is no backend: demo data lives in the browser and can be reset from **Workspace settings → Reset demo data**. Point it at the [DevFlow API](#connecting-to-the-api) to keep everything on a server instead. Sample dates are generated relative to today, so the demo sprint is always mid-flight.

## Project structure

```
app/
  (marketing)/      landing, privacy, terms, security, status
  (auth)/           login, signup, invite, reset-password
  (app)/            signed-in shell (sidebar)
    w/[slug]/       one workspace (demo mode: acme-inc)
      projects/     overview + [key]/{board,backlog,reports,settings}
      settings/     workspace name, members, demo data, leave/delete
    profile/        personal settings & access tokens (global)
    welcome/        no workspace yet: create the first one
    projects/ settings/   old URLs, redirected into your workspace
components/
  ui/               design-system primitives (button, field, dialog, dropdown…)
  board/ backlog/ reports/ project/ projects/   feature modules
  layout/ marketing/ auth/ profile/ settings/ workspace/
lib/
  tracker/          domain types, seed data, selectors, store (local or API), team
  utils.ts          class merging, date helpers
  site.ts           contact + social link configuration
```

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build (type-checks and prerenders)
npm run lint
```

### Configuration

Edit [`lib/site.ts`](lib/site.ts) to set your social profile URLs and the inbox that receives contact-form messages. FormSubmit sends a one-time activation email on the first submission; confirm it to start receiving messages.

## Connecting to the API

DevFlow runs in one of two modes, chosen by a single variable:

| `NEXT_PUBLIC_API_URL` | Mode | Behaviour |
| --- | --- | --- |
| empty (default) | **Demo** | Everything runs in the browser on sample data in `localStorage`; no request reaches a server. |
| `http://localhost:4000/api/v2` | **API** | The app talks to the [DevFlow API](https://github.com/JohnReySeguma/dev-flow-be). |

1. Start the API (from the API repo, with Docker Desktop running):

   ```bash
   cd ../DevFlow-be
   docker compose up -d
   curl http://localhost:4000/api/v2/health/ready   # 200 when ready
   ```

2. Point the frontend at it and start it **on port 3000**. The API only accepts browser requests from `http://localhost:3000`.

   ```bash
   cp .env.example .env.local   # then set NEXT_PUBLIC_API_URL=http://localhost:4000/api/v2
   npm run dev
   ```

Next.js bakes `NEXT_PUBLIC_*` values into the bundle when `next dev` or `next build` starts, so **restart the dev server after changing the variable**. Never put secrets in a `NEXT_PUBLIC_*` variable: they are visible in the browser.

**What API mode connects today:**

- **Accounts:** real sign-in, sign-up and logout; the app checks the session on load and sends signed-out visitors to `/login` (returning them afterwards). Expired access tokens are renewed transparently, one refresh at a time.
- **Sign-in options:** only the OAuth providers `GET /config` enables (none if the API is unreachable; email sign-in always stays available). GitHub and Google redirect through the API and back.
- **Password reset:** "Forgot password?" emails a link to the new `/reset-password` page.
- **Workspaces:** every page of a workspace lives under `/w/<slug>/…`. The sidebar switcher lists your workspaces with your role in each and creates new ones (optionally with sample projects); `/welcome` greets accounts without any. The app reopens the workspace you used last if it is still yours. Old links like `/projects` redirect into it.
- **Workspace settings:** admins rename (the URL stays) and delete a workspace; anyone can leave it. Losing access, here or from another tab, moves you to another workspace.
- **Profile:** your profile and personal access tokens; each token works in one workspace, picked when you generate it.
- **Team:** Workspace settings lists the real members and pending invites; admins invite (emailed links open the new `/invite` page), resend, change roles and remove members after a confirmation. Sign-up opens your new workspace; accepting an invite opens the inviting one.
- **Projects, boards and backlogs:** each workspace's projects, workflow columns, sprints and issues load from the API when you open it (switching workspaces loads the other one). Creating, editing, dragging, ranking and deleting issues, editing columns and projects, and planning, starting and completing sprints all save to the server. Changes show at once; if the server refuses one, the project reloads and a notice says why.
- **Comments:** the issue panel lists an issue's comments; members and admins add new ones.
- **People:** assignees, avatars and "My issues" use the workspace's real members.
- **Sample data:** Reset demo data restores the workspace's sample projects on the server, for everyone; projects people created stay.
- **Demo data:** the shared `acme-inc` workspace can't be renamed, deleted or left and its team is fixed, but its sample data can still be reset. The five demo accounts are read-only for profile and tokens: sign up to try those.
- **Permissions:** controls follow your role in the current workspace. Viewers get a read-only app; members can do everything except editing workflows, deleting projects and managing the team, which stay with admins.

Reports still compute from the loaded sprints and issues; the API's own burndown, velocity and history (and Live Sync) come in later steps ([`docs/API_BRIEF.md`](docs/API_BRIEF.md) §5). The server caches `/config` for 5 minutes, so after changing the API's providers do a hard reload or use a private window.

With the API's demo data, sign in as `demo@devflow.local` (admin), `member@devflow.local` or `viewer@devflow.local`, password `devflow-demo`. Ten wrong passwords lock an email for 15 minutes.

### API code

All API access lives in [`lib/api/`](lib/api/):

| File | Purpose |
| --- | --- |
| `config.ts` | The only reader of `NEXT_PUBLIC_API_URL`; `isApiMode()` |
| `client.ts` | `apiFetch()` / `apiRequest()`: JSON, `credentials: "include"`, typed errors, single-flight token refresh |
| `errors.ts` | `ApiError`, `NetworkError`, and a message for every API error code |
| `auth.ts` | Typed calls for sign-in, sign-up, logout, password reset, OAuth URLs, profile and access tokens |
| `session.ts` | `useSession()`: who is signed in, shared by the session gate, sidebar and profile |
| `workspace.ts` | Typed calls for workspaces, members, roles and invites |
| `tracker.ts` | Typed calls for projects, workflow, issues, sprints, comments and the sample-data reset |
| `permissions.ts` | `usePermissions()`: what your role in the current workspace allows |
| `schema.d.ts` | Types generated from the API's OpenAPI spec; never edit by hand |
| `types.ts` | Readable names for the generated types |

The types are generated from the API's spec at tag **`v2.0.0-beta.5`**, the same file as the [`docs/openapi.json`](docs/openapi.json) snapshot. Regenerate when a later API release changes its spec: update the tag in the `api:types` script, then run

```bash
npm run api:types
```

## Versioning & workflow

This repository follows a lightweight, release-oriented Git workflow:

- **Semantic Versioning** — releases are tagged `vMAJOR.MINOR.PATCH`; see [CHANGELOG.md](CHANGELOG.md).
- **Conventional Commits** — `feat(scope):`, `fix(scope):`, `style:`, `build(deps):`, `docs:`, `chore(release):`.
- **Feature branches** — each milestone is built on `feat/*` and merged into `main` with `--no-ff`, so the history keeps the shape of every feature.
- **Release commits** — after each merge, a `chore(release)` commit bumps `package.json`, updates the changelog and is tagged with an annotated tag.

| Release | Milestone |
| --- | --- |
| `v0.1.0` | Design system foundations |
| `v0.2.0` | Issue tracking core — projects, sprints, board, backlog, reports |
| `v0.3.0` | Workspace shell, accounts and authentication |
| `v1.0.0` | Public site, legal pages, branding and contact |

## License

Portfolio project © 2026 John Rey Seguma. All sample data is fictional.
