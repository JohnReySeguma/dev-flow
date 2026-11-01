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
- **Workspace** — projects overview, profile settings, personal access tokens, team roles and invites.
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

There is no backend: demo data lives in the browser and can be reset from **Workspace settings → Reset demo data**. Sample dates are generated relative to today, so the demo sprint is always mid-flight.

## Project structure

```
app/
  (marketing)/      landing, privacy, terms, security, status
  (auth)/           login, signup
  (app)/            signed-in shell (sidebar)
    projects/       overview + [key]/{board,backlog,reports,settings}
    profile/        personal settings & access tokens
    settings/       workspace members & demo data
components/
  ui/               design-system primitives (button, field, dialog, dropdown…)
  board/ backlog/ reports/ project/ projects/   feature modules
  layout/ marketing/ auth/ profile/ settings/
lib/
  tracker/          domain types, seed data, selectors, store
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
