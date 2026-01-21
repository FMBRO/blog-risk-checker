# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blog Risk Checker - A React web application for analyzing Markdown blog posts for security, privacy, and compliance risks before publishing. Two-pane layout: Markdown editor (left) + risk analysis dashboard (right).

## Development Commands

```bash
cd blog-risk-checker

# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Type check + production build
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite** for build/dev
- **TailwindCSS** for styling
- **CodeMirror 6** for Markdown editing with highlight decorations
- **Zustand** for state management
- **lucide-react** for icons

## Architecture

### State Management

Single Zustand store (`src/store/appStore.ts`) manages all application state:
- Document metadata (projectName, docTitle)
- Check settings (publishScope, tone, audience, redactMode)
- Editor text
- Check results (checkId, report, status)
- UI state (activeTab, severityFilter, selectedFindingId, collapsedFindingIds)
- Persona review results

### API Layer

`src/api/client.ts` provides typed API functions with `ApiError` class for error handling:
- `createCheck()` - POST `/v1/checks`
- `recheck()` - POST `/v1/checks/{checkId}/recheck`
- `createPatch()` - POST `/v1/patches`
- `release()` - POST `/v1/release`
- `personaReview()` - POST `/v1/persona-review`

API base URL configured via `VITE_API_BASE_URL` env var (default: `http://localhost:8000`).

### Component Structure

```
AppShell                    # Main 2-column layout (65%/35%)
├── TopBar                  # Header with Check/Export buttons
├── EditorPane              # Left pane
│   ├── SettingsBar         # Collapsible settings (scope/tone/audience/redact)
│   └── MarkdownEditor      # CodeMirror 6 with highlight decorations
└── ResultsPane             # Right pane (tabs)
    ├── FindingsView        # Findings tab
    │   ├── VerdictBanner   # Overall verdict display
    │   ├── SeverityFilterChips  # All/High/Low filter
    │   └── FindingCardList # List of FindingCard components
    └── PersonaView         # Persona review tab
```

### Key Data Types

Located in `src/types/index.ts`:
- `Verdict`: `'ok' | 'warn' | 'bad'`
- `Severity`: `'low' | 'medium' | 'high' | 'critical'`
- `Finding`: Contains id, category, severity, title, reason, suggestion, ranges
- `Report`: Contains verdict, score, summary, findings[], highlights
- UI maps server severities to 3 filters: High (high/critical), Low (low/medium), All

### Editor Highlights

MarkdownEditor uses CodeMirror 6 `ViewPlugin` with `Decoration.mark()`:
- Highlights come from `report.highlights.items` (character offsets, not line:col)
- Default: yellow background (`#fef08a`)
- Selected: darker yellow (`#fde047`) + outline
- Clicking highlights triggers `selectFinding()`

### Category Colors

Finding cards use left border colors by category:
- security: red-500
- privacy: blue-500
- legal: purple-500
- compliance: orange-500
- tone: yellow-500
- quality: green-500

## Core Flows

### Check Flow
1. User clicks Check button
2. If no `checkId`: call `createCheck()`, else call `recheck()`
3. Store receives `checkId` and `report`
4. Highlights rendered in editor, findings displayed in right pane

### Patch Flow
1. User clicks "Apply Fix" on FindingCard
2. `createPatch()` called with findingId
3. API returns `apply.replaceRange` with start/end/text
4. Text replaced in editor state
5. Auto-trigger `runRecheck()`

### Selection Sync
- Click FindingCard or editor highlight
- `selectFinding(id)` updates store
- Editor re-renders with selected highlight emphasized
- Card shows selected state (blue background)

## Backend Requirements

Backend runs separately (FastAPI on port 8000). See `spec.md` for full API contract. Key endpoints return:
- `/v1/checks`: `{ checkId, report }`
- `/v1/patches`: `{ apply: { replaceRange: { start, end, text } } }`
- `/v1/release`: `{ safeMarkdown, fixSummary, checklist }` (only when verdict='ok')

## Environment Setup

Create `.env.local` in `blog-risk-checker/`:
```
VITE_API_BASE_URL=http://localhost:8000
```