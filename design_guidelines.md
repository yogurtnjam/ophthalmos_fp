# Design Guidelines: Fullstack JavaScript Starter

## Design Approach
**System-Based Approach**: Modern minimal design inspired by Linear and Vercel's aesthetic - clean, typography-focused with subtle depth through shadows and spacing. This blank starter should feel polished and inspire developers to build upon it.

## Core Design Elements

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Secondary Font**: JetBrains Mono for code snippets
- **Hierarchy**:
  - Hero headline: text-5xl to text-7xl, font-bold, tracking-tight
  - Section titles: text-3xl to text-4xl, font-semibold
  - Body text: text-base to text-lg, font-normal
  - Code/technical: text-sm, font-mono

### Layout System
**Spacing**: Use Tailwind units of 4, 6, 8, 12, 16, 24 for consistent rhythm
- Section padding: py-16 md:py-24
- Container: max-w-6xl mx-auto px-6
- Component gaps: gap-6 to gap-12

### Component Library

**Hero Section** (80vh):
- Centered layout with gradient background (subtle, non-distracting)
- Large headline: "Your Fullstack JavaScript App Starts Here"
- Subheading explaining React + Express setup
- Two CTAs: "View Frontend" and "View API Docs" with blur backgrounds
- Tech stack badges (React, Express, Node.js) displayed as pills below

**Quick Start Section**:
- 2-column grid (md:grid-cols-2)
- Left: Installation code block with copy button
- Right: Feature list with checkmarks highlighting setup benefits

**Architecture Diagram**:
- Visual representation of frontend ↔ backend communication
- Simple card-based layout showing React → API → Express flow
- Use icons from Heroicons (arrow-path, server, globe)

**API Endpoints Preview**:
- Card grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Each card shows sample endpoint with method badge (GET/POST)
- Clean monospace display of routes

**Footer**:
- Centered, minimal
- Links to documentation, GitHub repo
- "Built with React + Express" tagline

### Images
**Hero Background**: Abstract gradient mesh or geometric pattern (not a photo) - serves as backdrop for centered content. Should be subtle and not compete with text.

**No additional images required** - this is a developer-focused starter where code and clarity matter most.

### Visual Treatment
- Shadows: shadow-sm for cards, shadow-lg for elevated elements
- Borders: border with subtle gray, rounded-lg to rounded-xl
- Cards: Soft background, p-6 to p-8 padding
- Code blocks: Dark background with syntax highlighting colors

### Interactions
**Minimal animations only**:
- Smooth scroll behavior
- Button hover: slight scale and shadow increase
- Card hover: subtle shadow elevation
- NO elaborate scroll effects or parallax

### Navigation
Simple header:
- Logo/title on left
- Navigation links: Frontend, Backend, Docs (right-aligned)
- Transparent background with backdrop blur when scrolling

This starter prioritizes clarity and developer experience - clean, modern, and ready to build upon.