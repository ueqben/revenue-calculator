# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

No build tools, bundlers, or dependencies. Open `index.html` directly in a browser.

## Architecture

Single-page vanilla HTML/CSS/JS app — a freelancer revenue calculator.

- **app.js** — All application logic. State is a `clients` array (`{ id, name, weeklyHours, rate }`). Every mutation triggers a full re-render via `render()` → `renderSidebar()` + `renderTable()`. Monthly hours = weekly hours × `WEEKS_PER_MONTH` (4).
- **style.css** — CSS custom properties defined in `:root`. Responsive breakpoints at 900px and 640px.
- **index.html** — Layout: sticky top nav, left sidebar (summary stat cards), main area (add-client form + inline-editable client table).

Table cells use `onchange` handlers for inline editing. User-supplied strings are escaped via `escapeHtml()` before `innerHTML` injection.

## End of Session

Remember to push your changes to GitHub before ending your coding session.
