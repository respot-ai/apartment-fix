---
name: ui-design-system
description: UI design system toolkit for generating design tokens (colors, typography, spacing, shadows, animations) from brand colors. Use when creating or maintaining a design system, generating CSS variables, or ensuring visual consistency across products.
---

# UI Design System

Professional toolkit for creating and maintaining scalable design systems.

## Core Capabilities
- Design token generation (colors, typography, spacing)
- Component system architecture
- Responsive design calculations
- Accessibility compliance
- Developer handoff documentation

## Key Scripts

### design_token_generator.py
Generates complete design system tokens from brand colors.

**Usage**: `python scripts/design_token_generator.py [brand_color] [style] [format]`
- Styles: modern, classic, playful
- Formats: json, css, scss, summary

**Features**:
- Complete color palette generation (primary, secondary, neutral, semantic)
- Modular typography scale (major third ratio)
- 8pt spacing grid system
- Shadow and animation tokens
- Responsive breakpoints
- Multiple export formats (JSON, CSS variables, SCSS)

**Example**:
```bash
# Generate CSS variables from SETT brand color
python scripts/design_token_generator.py "#0066CC" modern css

# Get a summary of what's generated
python scripts/design_token_generator.py "#0066CC" modern summary
```

## Design System Creation Workflow

1. **Start with brand colors** — Run the token generator with primary brand color
2. **Review & customize** — Adjust generated tokens to match brand guidelines
3. **Export** — Output as CSS variables or JSON for consumption
4. **Apply** — Use tokens consistently across all product UIs
5. **Iterate** — Update tokens centrally, changes propagate everywhere

## Important Notes

- The generator's default font families are generic starting points. Always replace with brand-appropriate fonts.
- Pair with the `frontend-design` skill for aesthetic direction when building components.
- Pair with the `brand` skill for SETT-specific brand guidelines.
