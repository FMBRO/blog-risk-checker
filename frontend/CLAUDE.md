# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React frontend for a Blog Risk Checker that analyzes markdown content for security, privacy, legal, and compliance risks. Communicates with a FastAPI backend that uses Google Gemini 2.5 Flash for AI-powered analysis.

## Commands

```bash
cd blog-risk-checker

# Development
npm run dev          # Start Vite dev server with HMR

# Build
npm run build        # TypeScript check + production build

# Lint
npm run lint         # ESLint check

# Preview production build
npm run preview
```

## Architecture

### Technology Stack
- React 19 + TypeScript + Vite 7
- Zustand for state management
- Tailwind CSS for styling
- CodeMirror 6 for markdown editing

### Project Structure
```
blog-risk-checker/src/
├── api/client.ts       # API layer - all backend communication
├── store/appStore.ts   # Zustand store - centralized state management
├── types/index.ts      # TypeScript type definitions
└── components/         # React components
```

### State Management (Zustand)
Single store (`appStore.ts`) manages all application state:
- **Document**: projectName, docTitle, editorText
- **Settings**: publishScope, tone, audience, redactMode
- **Check results**: checkId, report, checkStatus
- **UI state**: activeTab, severityFilter, selectedFindingId

Async actions in store: `runCheck()`, `runRecheck()`, `applyPatch()`, `runPersonaReview()`, `runRelease()`

### Component Hierarchy
```
App → AppShell (2-column layout)
├── TopBar (Check/Export buttons)
├── EditorPane (left)
│   ├── SettingsBar (expandable settings)
│   └── MarkdownEditor (CodeMirror)
└── ResultsPane (right)
    ├── Tabs (Findings | Persona)
    ├── FindingsView → VerdictBanner, SeverityFilterChips, FindingCardList
    └── PersonaView
```

### API Integration
All API calls go through `api/client.ts` which wraps fetch with error handling. Backend base URL configured via `VITE_API_BASE_URL` environment variable (defaults to `http://localhost:8000`).

Endpoints used:
- `POST /v1/checks` - Initial risk assessment
- `POST /v1/checks/{checkId}/recheck` - Re-analyze after edits
- `POST /v1/patches` - Generate fix for a finding
- `POST /v1/release` - Finalize for publication
- `POST /v1/persona-review` - Audience-specific analysis

### Data Flow
1. User edits markdown in CodeMirror editor
2. "Check" button calls `runCheck()` → `POST /v1/checks`
3. Backend returns report with findings and highlights
4. Findings displayed in ResultsPane; highlights shown in editor
5. User can apply patches or run persona review
6. Export triggers `runRelease()` (only if verdict='ok')

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |

## Key Type Definitions

See `types/index.ts` for complete definitions. Core types:
- `CheckSettings`: publishScope, tone, audience, redactMode
- `Finding`: Individual issue with id, category, severity, title, reason, suggestion, highlights
- `Report`: verdict, score, summary, findings[], highlights
- `PersonaReview`: Audience-specific analysis results
