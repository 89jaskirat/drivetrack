# Design System Inspired by PlayStation

## 1. Visual Theme & Atmosphere

PlayStation.com carries itself like the marketing wing of a premium consumer-electronics brand that happens to sell entertainment. The page is organized as a vertical channel of alternating surfaces: a near-black masthead and hero, a sequence of paper-white editorial panels in the middle, and a deep cobalt-blue footer that anchors the entire experience. Between those surface modes the site leans hard on photography and 3D product renders, letting the hardware do the emotional work while the chrome stays restrained.

The signature typographic move is SST Light (weight 300) at large sizes. Sony's custom SST family is used from 22px up to 54px in weight 300, giving display headlines a whispered, elegant quality that feels closer to a luxury watch ad than a game store. That quiet authority is the exact opposite of loud editorial systems. PlayStation wants the type to recede and the product to lead. Body and UI lean on weights 500-700, but the display voice is consistently thin and calm.

The one place restraint breaks is interaction. Every primary button has the same hover move: fill swaps to an electric cyan `#1eaedb`, a 2px white border appears, a 2px PlayStation-blue outer ring blooms behind it, and the entire button scales up `1.2x`. That combination of color pop, border, ring, and lift-scale is a signature move unique to Sony among major brands.

### Key Characteristics

- Three-surface channel layout: near-black hero, paper-white content, cobalt-blue footer.
- SST weight 300 at 22-54px for display.
- PlayStation Blue `#0070cc` as the anchor color.
- Cyan `#1eaedb` reserved exclusively for hover and focus states.
- Interactive elements scale `1.2x` on hover.
- Pill buttons at full `999px` radius.
- Commerce-orange `#d53b00` used only for buy-state CTAs.
- Wide breakpoint coverage up to 2120px.

## 2. Color Palette & Roles

### Primary

- PlayStation Blue `#0070cc`: primary brand anchor.
- Console Black `#000000`: masthead, hero, and product presentation zones.

### Secondary & Accent

- PlayStation Cyan `#1eaedb`: hover, focus, active only.
- Link Hover Blue `#1883fd`: inline text-link hover color.
- Dark Link Blue `#0068bd`: text-link color on light surfaces.

### Surface & Background

- Paper White `#ffffff`
- Ice Mist `#f5f7fa`
- Divider Tint `#f3f3f3`
- Masthead Black `#000000`
- Shadow Black `#121314`
- Filter Mist `rgba(245, 247, 250, 0.3)`

### Neutrals & Text

- Display Ink `#000000`
- Deep Charcoal `#1f1f1f`
- Body Gray `#6b6b6b`
- Mute Gray `#cccccc`
- Placeholder Ink `rgba(0, 0, 0, 0.6)`
- Inverse White `#ffffff`
- Dark-Link Blue `#53b1ff`

### Semantic & Commerce

- Commerce Orange `#d53b00`
- Commerce Orange Active `#aa2f00`
- Warning Red `#c81b3a`
- Shadow Wash 80 `rgba(0, 0, 0, 0.8)`
- Shadow Wash 16 `rgba(0, 0, 0, 0.16)`
- Shadow Wash 08 `rgba(0, 0, 0, 0.08)`
- Shadow Wash 06 `rgba(0, 0, 0, 0.06)`

### Gradient System

- Light Section Gradient: `#ffffff -> #f5f7fa`
- Dark Section Gradient: `#121314 -> #000000`

Use gradients only as section backgrounds, never inside components.

## 3. Typography Rules

### Font Family

- SST / Playstation SST
- Fallbacks: `Arial`, `Helvetica`

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing |
| --- | --- | --- | --- | --- |
| Hero Display XL | 54px | 300 | 1.25 | -0.1px |
| Hero Display L | 44px | 300 | 1.25 | 0.1px |
| Large Display | 35px | 300 | 1.25 | normal |
| Mid Display | 28px | 300 | 1.25 | 0.1px |
| Compact Display | 22px | 300 | 1.25 | 0.1px |
| UI Heading Small | 18px | 600 | 1.0 | normal |
| Button / CTA | 18px | 500 | 1.25 | 0.4px |
| Button / Emphasized | 18px | 700 | 1.25 | 0.45px |
| Body Relaxed | 18px | 400 | 1.5 | 0.1px |
| Compact Button | 14px | 700 | 1.25 | 0.324px |
| Utility Caption | 14px | 500 | 1.5 | normal |
| Micro Caption | 12px | 500 | 1.5 | normal |

### Principles

- Weight 300 at large sizes is the voice.
- Weight jumps at the UI layer.
- Letter-spacing stays subtle.
- No all-caps.
- No serif anywhere.

## 4. Component Stylings

### Buttons

#### Primary

- Background: `#0070cc`
- Text: `#ffffff`
- Border radius: `999px`
- Padding: about `12px 24px`
- Hover:
  - background `#1eaedb`
  - 2px `#ffffff` border
  - 2px `#0070cc` outer ring
  - `transform: scale(1.2)`
- Active: `opacity: 0.6`
- Transition: about `180ms ease`

#### Secondary

- Background: `#ffffff`
- Text: `#0172ce`
- Border: `2px outset #000000`
- Radius: often `999px` or `36px`
- Hover uses the same cyan and scale signature.

#### Commerce Orange

- Background: `#d53b00`
- Text: `#ffffff`
- Radius: `999px`
- Active: `#aa2f00`
- Hover still follows the cyan signature.

#### Transparent Ghost

- Transparent background
- Text: `#1f1f1f`
- Border: `1px solid #dedede`
- Hover uses cyan fill, white text, 2px white border, and `scale(1.2)`.

### Cards & Containers

- Hero Card: dark media-backed, radius `24px`, strong `rgba(0, 0, 0, 0.8)` shadow.
- Game Cover Tile: radius `12px` or `13px`, feather shadow `rgba(0, 0, 0, 0.08)`.
- Content Panel: white or light-gradient surface, radius `12px-24px`, very light shadow.
- Dark Card on Dark: translucent black, radius `6px` or `24px`.

### Inputs & Forms

- Background: `#ffffff`
- Border: `1px solid #cccccc`
- Radius: `3px`
- Focus ring: `0 0 0 2px #0070cc`
- Error: `#c81b3a`

### Navigation

- Top nav: black full-bleed strip.
- Link hover: `#1883fd`
- Active section: subtle 2px underline in `#0070cc`
- Mobile: hamburger drawer with stacked links.
- Sticky nav stays black on scroll.

### Image Treatment

- Aspect ratios: 16:9 hero, 1:1 product, 3:4 covers, 4:3 lifestyle.
- Corners: `12px`, `13px`, or `24px` depending on context.
- Full-bleed only in hero and footer banners.

## 5. Layout Principles

### Spacing System

- Base unit: `8px`
- Section padding: `48px-96px`
- Card padding: `20px-32px`
- Inline spacing: `8px-16px`

### Grid & Container

- Max width roughly `1920px`
- 12-column responsive grid
- Outer padding: `16px` mobile, `48px` tablet, `64px-96px` desktop
- Gutters: `16px-24px`

### Whitespace Philosophy

Whitespace should feel luxurious and gallery-paced. Each module should get its own room.

### Border Radius Scale

- `2px`, `3px`, `6px`, `12px`, `13px`, `19px`, `20px`, `24px`, `36px`, `48px`, `999px`

## 6. Depth & Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| 0 | No shadow | Default content |
| 1 | `rgba(0, 0, 0, 0.06) 0 5px 9px 0` | Light editorial lift |
| 2 | `rgba(0, 0, 0, 0.08) 0 5px 9px 0` | Standard card elevation |
| 3 | `rgba(0, 0, 0, 0.16) 0 5px 9px 0` | Emphasized card |
| 4 | `rgba(0, 0, 0, 0.8) 0 5px 9px 0` | Hero overlay shadow |
| 5 | `0 0 0 2px #0070cc` | Focus ring |
| 6 | `0 0 0 2px #000000` | Secondary hover ring |
| 7 | `#121314 -> #000000` | Dark atmospheric section |

Depth should be layered but restrained.

## 7. Do's and Don'ts

### Do

- Use `#0070cc` as the primary CTA fill and footer anchor.
- Use SST weight 300 for display headlines at 22px and above.
- Apply the full hover signature to primary buttons.
- Use `999px` radius on primary and commerce buttons.
- Reserve cyan `#1eaedb` for hover, focus, and active.
- Use commerce orange only for purchase CTAs.
- Alternate dark hero panels with white content panels and end with a blue footer.

### Don't

- Don't bold display headlines.
- Don't use all-caps labels or kickers.
- Don't use gradient buttons or gradient text.
- Don't introduce extra warm colors.
- Don't use square corners.
- Don't skip the `scale(1.2)` hover move.
- Don't use serif type.
- Don't let cyan appear at rest.

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
| --- | --- | --- |
| Small Mobile | <400px | Single column, hamburger nav, hero about 28px |
| Mobile | 400-599px | Single column, 16px padding |
| Large Mobile | 600-767px | Optional 2-column modules |
| Tablet Portrait | 768-1023px | 2-column grid |
| Tablet Landscape | 1024-1279px | 3-4 column grid |
| Desktop | 1280-1599px | Full editorial grid |
| Large Desktop | 1600-1919px | Wider margins |
| 4K / Big-Screen | >=1920px | Container expands to 1920px |
| Ultra-Wide | >=2120px | Outer margins absorb extra width |

### Touch Targets

- Primary pill buttons: about `48px-56px` tall
- Mobile nav items: `48px+`
- Icon buttons: `40px-48px`

### Collapsing Strategy

- Nav: full -> condensed -> hamburger
- Grid: `6 -> 4 -> 3 -> 2 -> 1`
- Spacing tightens as screens narrow
- Hero type scales `54 -> 44 -> 35 -> 28 -> 22`

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: `#0070cc`
- Hover / Focus Accent: `#1eaedb`
- White Surface: `#ffffff`
- Dark Surface: `#000000`
- Heading on White: `#000000`
- Body on White: `#1f1f1f`
- Body on Black: `#ffffff`
- Commerce Accent: `#d53b00`
- Footer Anchor: `#0070cc`

### Iteration Guide

1. Audit display weight. Headlines 22px and above should read as weight 300.
2. Audit hover treatment. Primary buttons need cyan fill, white border, blue ring, and `scale(1.2)`.
3. Audit corners. Use only the declared radius values.
4. Audit color sprawl. Keep chrome limited to the declared palette.
5. Audit surface alternation. Prefer dark hero -> white content -> dark hero -> white content -> blue footer.
6. Audit casing. Use sentence case and title case only.
7. Audit shadow weight. Use only the declared shadow tiers.
8. Audit whitespace. If modules compete, add more breathing room.
