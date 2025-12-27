# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cognit** is an agentic AI parenting assistant built as a React landing page. The app helps parents decode child behavior with AI-powered guidance from "The Village Council" of developmental and emotional experts. This is exported from Google AI Studio and uses the Gemini API.

AI Studio App URL: https://ai.studio/apps/drive/1D5MEE7y3RonmkDtPVTqm4JQzDvF160rb

## Development Commands

### Setup
```bash
npm install
```

Before running, set `GEMINI_API_KEY` in `.env.local` with your Gemini API key.

### Development
```bash
npm run dev           # Start dev server on port 3000
npm run build         # Build for production
npm run preview       # Preview production build
```

## Architecture

### Tech Stack
- **Framework**: React 19.2.3 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Styling**: TailwindCSS (loaded via CDN in index.html:7)
- **Icons**: lucide-react
- **Hosting**: Configured for 0.0.0.0:3000 in vite.config.ts:10

### Module System
Uses ES modules with import maps defined in index.html:141-150. React and dependencies are loaded from esm.sh CDN.

### Environment Variables
- `GEMINI_API_KEY` in `.env.local` is exposed as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` (vite.config.ts:14-15)

### File Structure
```
/
├── App.tsx              # Root component with entrance animation and page layout
├── index.tsx            # React entry point
├── index.html           # Main HTML with Tailwind config and custom styles
├── components/          # All UI components
│   ├── Navbar.tsx       # Navigation with theme toggle
│   ├── Hero.tsx         # Landing hero section
│   ├── Features.tsx     # Features showcase
│   ├── Agents.tsx       # "Village Council" agent showcase
│   ├── Research.tsx     # Research/credibility section
│   ├── Pricing.tsx      # Pricing tiers
│   ├── Footer.tsx       # Footer
│   ├── Entrance.tsx     # Entry animation component
│   └── ChatInterface.tsx # Demo chat UI (3-column agentic interface)
└── contexts/
    └── LanguageContext.tsx  # i18n context (en/tr support)
```

### Design System

**Color Palette** (defined in index.html:14-26):
- Custom "warm" color scale from `warm-50` (#fafaf9) to `warm-950` (#0c0a09)
- Accent color: `#d97757` (warm orange) for CTAs and highlights
- Dark mode uses `class` strategy (index.html:10)

**Typography**:
- Font: "Outfit" from Google Fonts (index.html:64)
- Weights: 300, 400, 500, 600, 700

**Animations** (index.html:31-58):
- `animate-blob`: 10s morphing background blobs
- `animate-float`: 6s vertical floating effect

### State Management

**Theme**: Local state in App.tsx:13-33 with system preference detection
**Language**: React Context in contexts/LanguageContext.tsx with 'en' | 'tr' support
**Entrance**: Local state in App.tsx:14 to control entrance animation visibility

### Path Aliases

`@/*` resolves to project root (tsconfig.json:21-24, vite.config.ts:18-20)

### Key Implementation Details

**Entrance Flow** (App.tsx:37-41):
- `Entrance` component displays first
- On completion, triggers `setEntranceVisible(false)`
- Main content fades in with opacity transition (hidden with `h-0 overflow-hidden` while entrance visible)

**ChatInterface Structure** (components/ChatInterface.tsx):
- 3-column layout: left sidebar (user profile), center (chat), right sidebar (agentic action plan)
- Responsive: sidebars hidden on small screens (md/lg breakpoints)
- Bilingual content via `useLanguage()` hook
- Chat uses warm beige/orange theme matching design system

**Dark Mode**:
- Toggled via Navbar component (App.tsx:42)
- Applied to `document.documentElement` classList (App.tsx:24-28)
- All components use Tailwind `dark:` variants for theming

### Styling Approach

All styling is inline with Tailwind classes. Custom CSS in index.html:67-140 defines:
- Chat scrollbar styling (.chat-scroll)
- Range slider custom appearance
- Toggle switch states
- Animation delay utilities

No separate CSS files except `/index.css` (referenced in index.html:151 but not present in repo).
