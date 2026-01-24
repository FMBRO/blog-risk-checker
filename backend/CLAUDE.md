# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastAPI backend for a blog risk checker that uses Google Gemini 2.5 Flash (via Vertex AI) to analyze markdown content for security, privacy, and compliance risks.

## Commands

```bash
# Run development server
uvicorn main:app --reload --port 8000

# Run test flow (mock mode - no API calls)
python test.py --base-url http://localhost:8000 --md sample_blog.md --mock on

# Run test flow (real Gemini API)
python test.py --base-url http://localhost:8000 --md sample_blog.md --mock off

# Test with custom settings
python test.py --base-url http://localhost:8000 --md sample_blog.md --mock auto --publish-scope public --tone technical --audience engineers --redact-mode light --persona security
```

## Architecture

**Single-file application** (`main.py`) with ~580 lines organized as:

1. **Type Definitions** (Lines 39-47): Literals for PublishScope, Tone, Audience, RedactMode, MockMode, Verdict, Severity, Persona
2. **Request Models** (Lines 53-95): Pydantic BaseModel classes for API validation
3. **In-Memory Store** (Line 101): `CHECK_STORE` dictionary (MVP - no database)
4. **Gemini Integration** (Lines 131-163): Async wrapper `gemini_json()` with structured output via JSON schemas
5. **JSON Schemas** (Lines 175-318): REPORT_SCHEMA, PATCH_GEN_SCHEMA, RELEASE_SCHEMA, PERSONA_SCHEMA for Gemini structured output
6. **Mock Payloads** (Lines 321-384): MOCK_REPORT, MOCK_PERSONA, MOCK_RELEASE for testing
7. **System Prompts** (Lines 389-426): Instructions for Gemini across different analysis tasks (CHECK_SYSTEM, PATCH_SYSTEM, RELEASE_SYSTEM, PERSONA_SYSTEM)

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/checks` | Initial content risk assessment → returns checkId + report with findings |
| `POST /v1/checks/{checkId}/recheck` | Re-evaluate after patches applied |
| `POST /v1/patches` | Generate fix for a specific finding → returns replacement text with ranges |
| `POST /v1/release` | Finalize for publication (only succeeds if verdict is 'ok') |
| `POST /v1/persona-review` | Role-based analysis (frontend/security/legal/general personas) |

## Data Flow

```
Markdown Input → /v1/checks (creates checkId)
                     ↓
              CHECK_STORE[checkId] = {text, settings, report}
                     ↓
              Loop: /v1/patches → apply → adjust ranges
                     ↓
              /v1/checks/{checkId}/recheck
                     ↓
              If verdict=='ok': /v1/release → Safe Markdown
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_CLOUD_PROJECT` | Vertex AI project ID | (required) |
| `GOOGLE_CLOUD_LOCATION` | Region | us-central1 |
| `GEMINI_MODEL` | Model ID | gemini-2.5-flash |
| `MOCK` | Override mock mode globally | (unset) |

## Key Implementation Details

- **Mock Mode**: Set `MOCK=1` env var or pass `config.mock="on"` in requests to skip Gemini API calls
- **Range Adjustment**: Patches return character offsets (start/end); subsequent patches must adjust ranges based on text length changes
- **Structured Output**: All Gemini calls use JSON schemas to enforce response format
- **CORS**: Enabled for all origins (development configuration)
- **Error Codes**: 404 (not found), 409 (verdict not ok for release), 429 (rate limit), 500 (internal), 502 (Gemini error)