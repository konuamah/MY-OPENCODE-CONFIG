# MY OPENCODE CONFIG

My personal OpenCode configuration with **The Cleaner's Toolbox** + **Funnel Architect** enforced.

## Contents

- `opencode.jsonc` — Main config with clean-code + funnel-architect plugins
- `skills/` — Clean Code skills + 30 funnel architect skills (opt-in, webinar, SaaS, VSL, etc.)
- `plugins/clean-code/` — Built clean-code plugin (review-code, explain-rule tools)
- `plugins/funnel-architect-plugin-opencode/` — Built funnel-architect plugin (funnel-status tool, auto mobile check, Lighthouse audit, funnel validation)
- `agents/` — Agent overrides (ask, ssh-recon, build, plan, general) covering local recon, remote recon, building, planning, and general tasks

## Plugins

### Clean Code Plugin
53 rules across 8 categories:
- Environment (E1-E8) | Comments (C1-C5) | Functions (F1-F4)
- General (G1-G36) | Names (N1-N7) | Tests (T1-T10) | Debugging (D1-D4) | Planning (P1-P4)

### Funnel Architect Plugin
30 funnel building skills across 13 funnel types + deployment + analytics:
- Automatically checks mobile responsiveness on every file write
- Runs async Lighthouse audits for page speed
- Validates funnel structure on session end
- Deploy targets: Netlify, Vercel, Cloudflare Pages

### Design Toolbox Plugin
17 design skills across 3 domains:
- Product Design (Layers): 9 skills (intro → surface)
- Design Taste: 7 skills (core, variants, soft, minimalist, brutalist, redesign, output)
- Quality Detection: 1 skill (impeccable — 23 commands, 41 detector rules)
- Auto taste injection before UI file writes
- Auto anti-pattern detection after UI file writes

### Agentic SEO Plugin
17 SEO skills (1 main + 16 sub-skills) + 91 Python evidence-collection scripts:
- Full audits, technical SEO, content/E-E-A-T, schema markup, sitemaps, images, links
- GEO (Generative Engine Optimization), AEO (Answer Engine Optimization)
- Core Web Vitals, performance, hreflang, programmatic SEO, competitor analysis
- GitHub SEO: repo audit, README lint, community health, search benchmarking
- Auto SEO checks after every HTML file write (viewport, meta desc, title, h1, alt, canonical, OG, schema)
