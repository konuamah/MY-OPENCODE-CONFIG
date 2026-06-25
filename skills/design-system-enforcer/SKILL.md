---
name: design-system-enforcer
description: >
  Scans a codebase for design system inconsistencies, consolidates scattered
  duplicate components into a single canonical version, enforces a unified
  visual and structural language, and writes or updates the project's AGENTS.md
  (or CLAUDE.md fallback) with design system rules so future AI sessions stay
  on-system automatically. Framework agnostic: React, Vue, Svelte, React Native,
  Angular, plain HTML/CSS. Use this skill whenever the user mentions scattered
  components, inconsistent styling, duplicate UI code, ad-hoc colors or spacing,
  "clean up our UI", "we have no design system", "components look different
  everywhere", or asks to audit/enforce visual consistency. Trigger even on narrow
  requests like "fix this button style" if there's any sign of broader
  inconsistency — this skill handles the full picture, not just the one file.
  Always use this skill before generating new UI components in a codebase you
  haven't seen before.
---

# Design System Enforcer

A framework-agnostic skill for scanning a codebase, identifying design system
drift, consolidating scattered duplicate components into canonical ones, and
writing enforcement rules into AGENTS.md so future AI sessions stay on-system
automatically. Works across React, Vue, Svelte, React Native, Angular, and
plain HTML/CSS.

---

## Phase 0 — Orient Before Acting

Establish context before scanning. Check the conversation first — if the
framework and goal are already clear, skip straight to Phase 1.

```
ASK only what the codebase won't answer:
1. What framework/stack is this? (React, Vue, RN, Svelte, plain HTML…)
2. What's the output goal?
   (a) Audit report only — surface what's wrong, no code changes
   (b) Token file + AGENTS.md update — standardize rules without touching components
   (c) Full remediation — consolidate duplicates, rewrite to match unified style,
       update AGENTS.md
```

If the user says "just do it", default to option (c) with report before rewrite.

---

## Phase 1 — Codebase Scan

### 1.1 Check for existing rules files first

Before anything else, check what instruction files already exist:

```bash
# Check for existing AGENTS.md / CLAUDE.md in project root
ls -la AGENTS.md CLAUDE.md 2>/dev/null

# Check for opencode.json (may reference external instruction files)
cat opencode.json 2>/dev/null || cat .opencode/opencode.json 2>/dev/null

# Check for other AI rule files
ls .cursorrules .cursor/rules/ .github/copilot-instructions.md 2>/dev/null
```

This determines whether Phase 6 creates or updates the rules file.

### 1.2 Find component files

```bash
# React / Next.js
find . -type f \( -name "*.tsx" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" \
  ! -path "*/build/*"

# Vue
find . -type f -name "*.vue" \
  ! -path "*/node_modules/*" ! -path "*/dist/*"

# Svelte
find . -type f -name "*.svelte" \
  ! -path "*/node_modules/*" ! -path "*/build/*"

# React Native (StyleSheet users)
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  ! -path "*/node_modules/*" \
  | xargs grep -l "StyleSheet.create\|style={{" 2>/dev/null

# Plain HTML + CSS
find . -type f \( -name "*.html" -o -name "*.css" -o -name "*.scss" \) \
  ! -path "*/node_modules/*"
```

### 1.3 Find existing design tokens

```bash
find . \( \
  -name "tokens.ts" -o -name "tokens.js" -o -name "theme.ts" \
  -o -name "theme.js" -o -name "_variables.scss" -o -name "variables.css" \
  -o -name "tailwind.config.*" -o -name "design-tokens.json" \
\) ! -path "*/node_modules/*"

# CSS custom properties
grep -rn "^--" src/ --include="*.css" --include="*.scss" \
  | grep -v "node_modules" | sort -u
```

### 1.4 Hunt for raw style values (drift signals)

```bash
# Hardcoded hex colors
grep -rn "#[0-9a-fA-F]\{3,6\}" src/ \
  --include="*.tsx" --include="*.jsx" --include="*.vue" \
  --include="*.css" --include="*.scss" --include="*.ts" \
  | grep -v "node_modules" | grep -v "//.*#"

# Hardcoded pixel values
grep -rn "\b[0-9]\+px\b" src/ \
  --include="*.tsx" --include="*.jsx" --include="*.css" --include="*.scss" \
  | grep -v "node_modules"

# Inline styles (React)
grep -rn "style={{" src/ --include="*.tsx" --include="*.jsx" \
  | grep -v "node_modules" | head -80

# RN StyleSheet blocks
grep -rn "StyleSheet.create" src/ --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules"

# font-size / font-weight hardcoded
grep -rn "fontSize:\|fontWeight:\|font-size:\|font-weight:" src/ \
  --include="*.tsx" --include="*.css" --include="*.scss" \
  | grep -v "node_modules" | grep -v "var(--\|tokens\."
```

### 1.5 Find duplicate / scattered components

This is the critical scan. Look for the same UI pattern implemented in multiple places:

```bash
# Find all files that define something that looks like a Button
grep -rn "export.*Button\|export.*Btn\|export default.*[Bb]utton" \
  src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.ts" \
  | grep -v "node_modules"

# Find all files that render a button (raw or component)
grep -rn "<[Bb]utton\|<[Bb]tn\|TouchableOpacity\|Pressable" \
  src/ --include="*.tsx" --include="*.jsx" --include="*.vue" \
  | grep -v "node_modules" | grep -v "import"

# Repeat for other common primitives
for COMPONENT in Input Card Badge Modal Spinner Avatar Tag Chip Toast; do
  echo "=== $COMPONENT ==="
  grep -rn "export.*$COMPONENT\|<$COMPONENT" \
    src/ --include="*.tsx" --include="*.jsx" --include="*.vue" \
    | grep -v "node_modules" | grep -v "import" | head -15
done

# Find files in component directories (any nesting)
find src/ -type d \( -name "components" -o -name "ui" -o -name "shared" \
  -o -name "common" -o -name "primitives" \) | while read dir; do
  echo "=== $dir ==="
  ls "$dir"
done
```

**Scatter pattern signals to look for:**
- Same component name defined in multiple files (`Button.tsx` in `src/components/` AND `src/features/auth/Button.tsx`)
- Same visual pattern with different names (`PrimaryButton`, `SubmitButton`, `ActionButton` all doing the same thing)
- Component file in a feature folder that duplicates a shared component
- Same prop logic duplicated across multiple similar components

---

## Phase 2 — Drift Report

Output this report before writing any code. Wait for user acknowledgment.

```
## Design System Audit — [Project Name]
Framework: [detected framework]
Rules file: [AGENTS.md found / CLAUDE.md found / none — will create]

### Scattered components (CONSOLIDATION TARGETS)
These patterns appear in multiple places and should be collapsed into one:

| Component pattern | Found in | Action |
|-------------------|----------|--------|
| Button            | src/components/Button.tsx, src/features/auth/AuthButton.tsx, src/ui/PrimaryBtn.tsx | Consolidate → src/components/ui/Button.tsx |
| Card              | src/components/Card.tsx, src/pages/dashboard/DashCard.tsx | Consolidate → src/components/ui/Card.tsx |
| [etc]             | …        | …      |

### Token drift
- Colors: X unique hardcoded hex values across Y files
  Examples: #3b82f6 (×12), #3B82F6 (×3), blue (×2) — all the same color
- Spacing: X unique raw px values
  Examples: 8px, 10px, 12px, 16px, 18px, 24px — need scale
- Typography: X unique font-size/weight combos
- Border radius: X unique values (4px, 6px, 8px, 12px)
- Existing tokens: [none / partial — details]

### Inconsistency signatures
- "#3b82f6" used in 4 files, "blue" in 2, "var(--blue)" in 1 — all primary
- Spacing alternates between 16px, 1rem, spacing[4] with no rule
- AuthButton and PrimaryButton are identical except for background color

### Risk level
🔴 High  — Scattered components + no token file
🟡 Medium — Token file exists but components bypass it
🟢 Low   — Token file exists, mostly followed, minor drift

### Remediation plan
1. Consolidate [N] duplicate component groups → [N] canonical components
2. Extract token file from [X] unique values found
3. Rewrite consolidated components against tokens
4. Update AGENTS.md with design system rules
```

---

## Phase 3 — Component Consolidation

This is the new phase added over standard harmonization. Before rewriting styles,
collapse duplicates into a single canonical file.

### 3.1 Pick the canonical version

For each group of duplicate components:

```
Decision rule:
1. Which file is in the most "shared" location? (src/components/ui/ > src/features/x/)
2. Which is the most complete? (handles most variants, has types, has accessibility)
3. Which do the most other files import?
4. When ambiguous, ask the user: "AuthButton.tsx and PrimaryButton.tsx seem
   identical — which location should be the canonical one?"
```

### 3.2 Read all duplicates before writing

Read every duplicate file in the group. Extract the union of:
- All variants/states handled across all copies
- All prop types across all copies
- Any logic that exists in one but not others (e.g. one has loading state, another doesn't)
- Any accessibility attributes present in any copy

The canonical component gets the *superset* — it should be strictly more capable
than any of the scattered versions, not a lowest-common-denominator merge.

### 3.3 Write the canonical component

Write to the agreed canonical path. Example consolidation:

```tsx
// BEFORE: Three scattered files doing the same thing
//
// src/components/Button.tsx — basic, no types, no variants
// src/features/auth/AuthButton.tsx — has loading state, hardcoded blue
// src/ui/PrimaryBtn.tsx — has size prop, uses inline style, no accessibility
//
// AFTER: src/components/ui/Button.tsx — superset of all three
// Documented merge: combines loading (from AuthButton) + size (from PrimaryBtn)
// + typed props, accessibility, token-backed styles

import { colors, spacing, typography, radii } from '@/tokens'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

// Superset of all scattered prop interfaces found:
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant  // from PrimaryBtn + AuthButton
  size?:    ButtonSize     // from PrimaryBtn (missing in others — added)
  loading?: boolean        // from AuthButton (missing in others — added)
  // removed: label prop (was in basic Button) — use children instead
  //   BREAKING CHANGE — flag to user before applying
}
```

### 3.4 Update all import sites

After writing the canonical file, find and update every file that imported a
deprecated duplicate:

```bash
# Find all files importing the old locations
grep -rn "from.*AuthButton\|from.*PrimaryBtn\|from.*components/Button" \
  src/ --include="*.tsx" --include="*.jsx" --include="*.vue" \
  | grep -v "node_modules"
```

Rewrite each import to point to the canonical path:
```ts
// BEFORE
import { AuthButton } from '../auth/AuthButton'
import PrimaryBtn from '../../ui/PrimaryBtn'

// AFTER
import { Button } from '@/components/ui/Button'
```

### 3.5 Delete the deprecated duplicates

Only after all import sites are updated:

```bash
# Confirm before deleting — show the list first
echo "Files to be deleted after consolidation:"
echo "  src/features/auth/AuthButton.tsx"
echo "  src/ui/PrimaryBtn.tsx"
echo "  src/components/Button.tsx (replaced by src/components/ui/Button.tsx)"
```

**Never delete without listing first.** If the user is on a team, note that
deleting files is a git-visible action — recommend a single "consolidate UI"
commit that includes the canonical file, the import updates, and the deletions.

### 3.6 Target component directory structure

After consolidation, the UI components should live in one place:

```
src/
  components/
    ui/              ← all canonical primitives live here
      Button.tsx
      Input.tsx
      Card.tsx
      Badge.tsx
      Modal.tsx
      Spinner.tsx
      Avatar.tsx
    [feature]/       ← feature components that COMPOSE from ui/, not reimplement
      auth/
        LoginForm.tsx   ← uses <Button>, <Input> — does not reimplement them
      dashboard/
        StatsCard.tsx   ← uses <Card> — does not reimplement it
  tokens.ts          ← single source of truth for all visual values
```

---

## Phase 4 — Extract the Token Foundation

### 4.1 No token file — derive from codebase

Collect all unique values from the scan. Name them semantically, not by value:

```ts
// tokens.ts — generated from codebase scan, review before committing
// Collapsed values are commented with their pre-collapse list

export const colors = {
  primary:   '#3b82f6',   // collapsed: #3b82f6, #3B82F6, blue (×19 total)
  secondary: '#6b7280',
  danger:    '#ef4444',
  success:   '#22c55e',
  warning:   '#f59e0b',
  gray50:    '#f9fafb',
  gray100:   '#f3f4f6',
  gray200:   '#e5e7eb',
  gray700:   '#374151',
  gray900:   '#111827',
  surface:   '#ffffff',
  border:    '#e5e7eb',
} as const

export const spacing = {
  // Scale derived from px values found: 4, 8, 10, 12, 16, 18, 24, 32, 48
  // Collapsed 10→8 and 18→16 (were used inconsistently, not semantically distinct)
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const

export const typography = {
  size: {
    xs:    12,
    sm:    14,
    base:  16,
    lg:    18,
    xl:    20,
    '2xl': 24,
    '3xl': 30,
  },
  weight: {
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },
  lineHeight: {
    tight:   1.25,
    normal:  1.5,
    relaxed: 1.75,
  },
} as const

export const radii = {
  sm:   4,
  md:   8,
  lg:   12,
  full: 9999,
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
} as const
```

### 4.2 Token file exists — audit bypass rate

```bash
# If tokens define colors, find direct hex usage that bypasses them
grep -rn "#[0-9a-fA-F]\{3,6\}" src/ --include="*.tsx" --include="*.css" \
  | grep -v "node_modules" | grep -v "tokens\."
# Report: "Token file exists. X of Y color references bypass it."
```

### 4.3 CSS custom properties (non-JS projects)

```css
/* tokens.css */
:root {
  --color-primary:   #3b82f6;
  --color-secondary: #6b7280;
  --color-danger:    #ef4444;
  --color-success:   #22c55e;
  --color-warning:   #f59e0b;
  --color-surface:   #ffffff;
  --color-border:    #e5e7eb;

  --spacing-xs:  4px;   --spacing-sm: 8px;
  --spacing-md:  16px;  --spacing-lg: 24px;
  --spacing-xl:  32px;  --spacing-xxl: 48px;

  --radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 12px;

  --font-size-sm:   14px; --font-size-base: 16px; --font-size-lg: 18px;
  --font-weight-medium: 500; --font-weight-semibold: 600;
}
```

---

## Phase 5 — Harmonize Component Style

After consolidation (Phase 3) and tokens (Phase 4), rewrite each canonical
component to use tokens throughout. One component at a time — show the rewrite,
wait for feedback, then proceed.

### React / Next.js

```tsx
// Canonical Button — token-backed, variant system, forwardRef, accessible
import { colors, spacing, typography, radii } from '@/tokens'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?:    ButtonSize
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: colors.primary,   color: colors.surface, border: 'none' },
  secondary: { background: 'transparent',    color: colors.primary, border: `1px solid ${colors.primary}` },
  ghost:     { background: 'transparent',    color: colors.gray700, border: 'none' },
  danger:    { background: colors.danger,    color: colors.surface, border: 'none' },
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: `${spacing.xs}px ${spacing.sm}px`,  fontSize: typography.size.sm },
  md: { padding: `${spacing.sm}px ${spacing.md}px`,  fontSize: typography.size.base },
  lg: { padding: `${spacing.md}px ${spacing.lg}px`,  fontSize: typography.size.lg },
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, style, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: radii.md,
        fontWeight:   typography.weight.medium,
        cursor:       disabled || loading ? 'not-allowed' : 'pointer',
        opacity:      disabled ? 0.5 : 1,
        display:      'inline-flex',
        alignItems:   'center',
        gap:          spacing.xs,
        transition:   'opacity 150ms ease',
        ...style,
      }}
      {...props}
    >
      {loading ? <Spinner size={size} /> : children}
    </button>
  )
)
Button.displayName = 'Button'
```

### React Native

```ts
// StyleSheet.create — no inline styles, all values from tokens
import { colors, spacing, typography, radii } from '@/tokens'

const styles = StyleSheet.create({
  base:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: radii.md },
  primary:   { backgroundColor: colors.primary },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: colors.danger },
  sm:        { paddingVertical: spacing.xs,  paddingHorizontal: spacing.sm  },
  md:        { paddingVertical: spacing.sm,  paddingHorizontal: spacing.md  },
  lg:        { paddingVertical: spacing.md,  paddingHorizontal: spacing.lg  },
  label:     { fontWeight: typography.weight.semibold, color: colors.surface },
  label_ghost:     { color: colors.gray700 },
  label_secondary: { color: colors.primary },
})
```

### Vue 3 SFC

```vue
<template>
  <button :class="['btn', `btn--${variant}`, `btn--${size}`]"
          :disabled="disabled || loading" :aria-busy="loading" v-bind="$attrs">
    <Spinner v-if="loading" :size="size" /><slot v-else />
  </button>
</template>
<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?:    'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?:  boolean
}>(), { variant: 'primary', size: 'md' })
</script>
<style scoped>
.btn          { display: inline-flex; align-items: center; border-radius: var(--radius-md); transition: opacity 150ms ease; }
.btn--primary   { background: var(--color-primary); color: #fff; border: none; }
.btn--secondary { background: transparent; color: var(--color-primary); border: 1px solid var(--color-primary); }
.btn--ghost     { background: transparent; color: var(--color-gray700); border: none; }
.btn--danger    { background: var(--color-danger); color: #fff; border: none; }
.btn--sm  { padding: var(--spacing-xs) var(--spacing-sm);  font-size: var(--font-size-sm); }
.btn--md  { padding: var(--spacing-sm) var(--spacing-md);  font-size: var(--font-size-base); }
.btn--lg  { padding: var(--spacing-md) var(--spacing-lg);  font-size: var(--font-size-lg); }
</style>
```

### Tailwind — token enforcement

```js
// tailwind.config.js — restrict to design tokens
import { colors, spacing, radii } from './src/tokens.js'
export default {
  theme: {
    extend: {
      colors:       { primary: colors.primary, danger: colors.danger, success: colors.success },
      spacing:      { xs: `${spacing.xs}px`, sm: `${spacing.sm}px`, md: `${spacing.md}px`, lg: `${spacing.lg}px` },
      borderRadius: { sm: `${radii.sm}px`, md: `${radii.md}px`, lg: `${radii.lg}px` },
    },
  },
}
// Then: className="bg-primary px-md py-sm rounded-md"  ✅
//  Not: className="bg-[#3b82f6] px-[18px] py-[10px]"  ❌
```

---

## Phase 6 — Write / Update AGENTS.md

This is the persistence step. After the codebase is harmonized, the rules must
be written into the project's AI context file so every future session —
regardless of who runs it — respects the design system automatically.

### 6.1 Determine the target file

```bash
# Check priority order (OpenCode: AGENTS.md wins over CLAUDE.md)
if [ -f "AGENTS.md" ]; then
  echo "UPDATE: AGENTS.md exists — append design system section"
elif [ -f "CLAUDE.md" ]; then
  echo "UPDATE: CLAUDE.md exists (AGENTS.md fallback) — append design system section"
else
  echo "CREATE: No rules file found — create AGENTS.md"
fi
```

**Always prefer AGENTS.md.** If only CLAUDE.md exists, still write to AGENTS.md
(OpenCode prefers it). Note this to the user: "Creating AGENTS.md — OpenCode
will use this over CLAUDE.md going forward."

### 6.2 If updating an existing file

Read the entire file first. Find any existing design system section:

```bash
grep -n "design.system\|ui.rules\|component.*rules\|styling\|tokens" \
  AGENTS.md 2>/dev/null | head -20
```

If a section exists: replace it entirely with the new content.
If no section exists: append to the end of the file, after a `---` separator.

Never silently overwrite other sections. Only touch the design system block.

### 6.3 The design system block to write

Insert this block verbatim (populated with actual values from the project):

```markdown
---

## Design system rules

Generated by design-system-enforcer after codebase audit.
Update this section when the token file or component inventory changes.

### Tokens
All visual values come from `@/tokens` (or `src/tokens.ts`).
Never hardcode colors, spacing, font sizes, border radii, or shadows.

```ts
// ✅ correct
import { colors, spacing, radii } from '@/tokens'
style={{ background: colors.primary, padding: spacing.md, borderRadius: radii.md }}

// ❌ wrong — never do this
style={{ background: '#3b82f6', padding: 16, borderRadius: 8 }}
```

### Component inventory
Before creating a new UI component, check this table.
If the component exists, use it. Do not re-implement it inline or in a feature folder.

| Component | Canonical file                    | Variants / props                         |
|-----------|-----------------------------------|------------------------------------------|
| Button    | src/components/ui/Button.tsx      | variant: primary|secondary|ghost|danger, size: sm|md|lg, loading |
| Input     | src/components/ui/Input.tsx       | variant: default|error, size: sm|md|lg   |
| Card      | src/components/ui/Card.tsx        | variant: default|elevated                |
| Badge     | src/components/ui/Badge.tsx       | variant: success|warning|danger|info     |
| Modal     | src/components/ui/Modal.tsx       | size: sm|md|lg, onClose required         |
| Spinner   | src/components/ui/Spinner.tsx     | size: sm|md|lg                           |

### Import paths
```ts
// UI primitives always from:
import { Button, Input, Card } from '@/components/ui'
// or individually:
import { Button } from '@/components/ui/Button'

// Never from feature folders:
import { AuthButton } from '@/features/auth/AuthButton'  // ❌ deleted — use Button
```

### Rules for generating new components
1. Check the inventory table above first — the component may exist.
2. Feature components (in `src/[feature]/`) must COMPOSE from `src/components/ui/`,
   never re-implement primitives inline.
3. All values from `@/tokens` — no hardcoded hex, px, or font-size.
4. Follow the variant prop pattern (`variant="primary"`) not a style prop.
5. Match the TypeScript interface style of existing ui/ components (forwardRef,
   extends HTMLAttributes, `...props` spread).
6. React: use `React.forwardRef`. React Native: use `StyleSheet.create` only.
7. Run `eslint src/` before committing any new component.

### What not to do
- `style={{ color: '#3b82f6' }}` — use `colors.primary`
- `padding: 16` — use `spacing.md`
- New `Button`-like component in a feature folder — use `src/components/ui/Button`
- Raw `<button>` or `<input>` in JSX — use the design system components
```

### 6.4 ESLint rules (add to block if project has ESLint)

```markdown
### ESLint enforcement
The following rules are active in `.eslintrc.js`:
- Raw `<button>` → use `<Button>` from `@/components/ui`
- Raw `<input>` → use `<Input>` from `@/components/ui`
- `style` prop on components → blocked (use variant prop instead)
```

---

## Phase 7 — Commit Strategy

After all phases are done, suggest a clean commit structure:

```bash
# Recommended: one atomic commit per logical step
git add src/tokens.ts
git commit -m "feat(ui): add design tokens extracted from codebase audit"

git add src/components/ui/
git commit -m "feat(ui): consolidate scattered components into canonical ui/ library"

git add src/ --update  # import site updates + deleted duplicates
git commit -m "refactor(ui): update all import sites to canonical components"

git add AGENTS.md
git commit -m "chore: add design system rules to AGENTS.md"
```

---

## Behavioral Rules for This Skill

**Scan before writing.** Never generate a new UI component without first checking
whether one already exists. A scan finding Button in 6 places means consolidate,
not create a 7th.

**Consolidate before harmonizing.** Phase 3 (consolidation) always runs before
Phase 5 (style harmonization). Rewriting styles on a duplicate is wasted work.

**Report before rewriting.** Always output the Phase 2 audit and wait for
acknowledgment before touching any files.

**Match the dominant pattern.** If the codebase uses `StyleSheet.create`, don't
introduce styled-components. Adapt to the project's paradigm.

**Preserve external APIs.** Maintain the existing prop interface of any component
unless the user explicitly asks for a breaking change. Flag breaking changes
prominently — don't silently apply them.

**Superset the duplicates.** When consolidating, the canonical component must be
at least as capable as all the scattered versions combined. No capability is
silently dropped.

**AGENTS.md is mandatory output.** Every run of this skill ends with an updated
or created AGENTS.md. This is not optional — it's what makes the enforcement
persistent across future sessions. If the user asks to skip it, explain why it's
the most durable part of the whole exercise.

**Never delete without listing first.** Always show the list of files to be
deleted before removing anything. Recommend committing deletions together with
the canonical replacement and import updates.

**One component group at a time.** When consolidating multiple groups, complete
one fully (canonical write + import updates) before moving to the next. This
makes partial progress reviewable and recoverable.

---

## Quick Reference — Full Scan in One Pass

```bash
#!/bin/bash
# Run from project root — surfaces all drift signals at once
echo "=== Rules files ===" && ls AGENTS.md CLAUDE.md .cursorrules 2>/dev/null
echo "=== Token files ===" && find . -name "tokens.*" -o -name "theme.*" | grep -v node_modules
echo "=== Hardcoded colors ===" && grep -rn "#[0-9a-fA-F]\{3,6\}" src/ --include="*.tsx" --include="*.css" | grep -v node_modules | wc -l
echo "=== Inline styles ===" && grep -rn "style={{" src/ --include="*.tsx" | grep -v node_modules | wc -l
echo "=== Button definitions ===" && grep -rn "export.*Button\|export.*Btn" src/ --include="*.tsx" | grep -v node_modules
echo "=== Component dirs ===" && find src/ -type d \( -name "ui" -o -name "components" -o -name "shared" \)
```
