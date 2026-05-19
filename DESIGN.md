---
name: AMC Care

colors:
  # Core brand
  primary: "#1565c0"
  primary-hover: "#0d47a1"
  primary-light: "#90caf9"

  # Medical red — blood pressure, alerts, required fields
  danger: "#E53935"
  danger-hover: "#c62828"
  danger-deep: "#B71C1C"
  danger-surface: "#ffebee"
  danger-border: "#ffcdd2"

  # Warning / orange
  warning: "#E65100"
  warning-hover: "#BF360C"
  warning-surface: "#fffbf5"
  warning-border: "#ffe0b2"

  # Success / green — used readings, positive states
  success: "#4CAF50"
  success-dark: "#2E7D32"
  success-surface: "#E8F5E9"
  success-border: "#c8e6c9"

  # AI / purple accent
  ai: "#9c27b0"
  ai-surface: "#f3e5f5"
  ai-gradient-start: "#f8f6ff"
  ai-gradient-end: "#e8e0ff"

  # CTA banner gradient (blue wash)
  cta-gradient-start: "#5b8dee"
  cta-gradient-mid: "#3a6fd8"
  cta-gradient-end: "#6ab0f5"

  # Text
  text-body: "rgba(47, 49, 54, 0.8)"
  text-heading: "#111111"
  text-heading-alt: "#1a1a1a"
  text-secondary: "#555555"
  text-muted: "#888888"
  text-subtle: "#999999"
  text-placeholder: "#aaaaaa"
  text-disabled: "#cccccc"
  text-on-dark: "#ffffff"
  text-on-dark-muted: "rgba(255, 255, 255, 0.75)"

  # Surfaces
  surface: "#ffffff"
  surface-warm: "#faf8f5"
  surface-warm-mid: "#f5f0eb"
  surface-warm-deep: "#f5ede0"
  surface-warm-darker: "#ede8df"
  surface-cool: "#f5f4f1"
  surface-chat-ai: "#f0f4f8"
  surface-note: "#f0f4ff"
  surface-dark: "#111111"
  surface-dark-alt: "#1a1a1a"
  surface-bp-machine: "#0d1f36"

  # Borders
  border-default: "#e4e4e4"
  border-warm: "#eeebe6"
  border-warm-light: "#e8e2db"
  border-subtle: "#e5e5e5"
  border-muted: "#f0f0f0"
  border-note: "#c5d5f5"
  border-warning-light: "#ffe0b2"

  # Overscroll / scroll-anchored header
  header-scrolled-bg: "rgba(18, 18, 18, 0.95)"

typography:
  base-family: '"ABC Arizona Sans", Arial, sans-serif'

  display:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "clamp(2.6rem, 5.5vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.18
    letterSpacing: "-0.03em"

  section-heading-lg:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "clamp(1.8rem, 4vw, 2.8rem)"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.03em"

  section-heading-md:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.02em"

  section-heading-sm:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "clamp(1.4rem, 3vw, 1.9rem)"
    fontWeight: 800
    lineHeight: 1.35
    letterSpacing: "-0.02em"

  card-title:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "clamp(1.1rem, 1.8vw, 1.45rem)"
    fontWeight: 700
    lineHeight: 1.35

  body-lg:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7

  body-md:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.75

  body-sm:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "0.88rem"
    fontWeight: 400
    lineHeight: 1.7

  label:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: "0.1em"
    textTransform: uppercase

  label-sm:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "0.62rem"
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: "0.12em"
    textTransform: uppercase

  nav-link:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "0.9rem"
    fontWeight: 500

  nav-primary:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "1.75rem"
    fontWeight: 500

  number-display:
    fontFamily: '"ABC Arizona Sans", Arial, sans-serif'
    fontSize: "clamp(3.5rem, 8vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontVariantNumeric: tabular-nums

spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
  "20": "80px"
  "24": "96px"

  header-height: "68px"
  header-scrolled-height: "52px"
  section-padding-y: "5rem"
  section-padding-x: "2.5rem"
  card-padding: "2rem"
  card-padding-lg: "2.5rem 3rem"

radii:
  none: "0"
  xs: "4px"
  sm: "6px"
  md: "8px"
  input: "10px"
  card-sm: "12px"
  card: "16px"
  card-lg: "20px"
  card-xl: "22px"
  card-2xl: "24px"
  banner: "28px"
  pill: "999px"

shadows:
  none: "none"
  subtle: "0 1px 3px rgba(0, 0, 0, 0.06)"
  card-sm: "0 1px 4px rgba(0, 0, 0, 0.07)"
  card: "0 4px 16px rgba(0, 0, 0, 0.10)"
  header: "0 6px 28px rgba(0, 0, 0, 0.22)"
  feature-hover: "0 2px 12px rgba(21, 101, 192, 0.08)"
  avatar: "0 4px 16px rgba(0, 0, 0, 0.15)"
  popup: "0 32px 80px rgba(0, 0, 0, 0.30), 0 0 0 1px rgba(0, 0, 0, 0.06)"

elevation:
  header-blur: "blur(12px)"
  overlay-blur: "blur(6px)"
  badge-blur: "blur(8px)"

motion:
  fast: "0.2s ease"
  standard: "0.3s ease"
  header: "0.4s cubic-bezier(0.4, 0, 0.2, 1)"
  drawer: "0.38s cubic-bezier(0.4, 0, 0.2, 1)"
  popup-spring: "0.28s cubic-bezier(0.34, 1.56, 0.64, 1)"
  progress-fill: "0.8s cubic-bezier(0.4, 0, 0.2, 1)"
  typing-bounce: "1.3s infinite ease-in-out"
  emergency-pulse: "1.5s ease-in-out infinite"
  ai-shimmer: "1.8s infinite"

layout:
  max-width-text: "760px"
  max-width-faq: "860px"
  max-width-results: "960px"
  max-width-features: "1100px"
  max-width-content: "1200px"
  breakpoint-mobile: "640px"
  breakpoint-tablet: "768px"
  breakpoint-desktop: "900px"

components:
  button-primary-dark:
    backgroundColor: "#111111"
    color: "#ffffff"
    borderRadius: "999px"
    padding: "0.85rem 2rem"
    fontWeight: 700
    fontSize: "0.92rem"
    transition: "background 0.2s"
    hover:
      backgroundColor: "#333333"

  button-primary-blue:
    backgroundColor: "#1565c0"
    color: "#ffffff"
    borderRadius: "999px"
    fontWeight: 700
    transition: "background 0.2s"
    hover:
      backgroundColor: "#0d47a1"

  button-primary-red:
    backgroundColor: "#E53935"
    color: "#ffffff"
    borderRadius: "999px"
    fontWeight: 700
    transition: "background 0.2s"
    hover:
      backgroundColor: "#c62828"

  card:
    backgroundColor: "#faf8f5"
    borderRadius: "20px"
    padding: "2.2rem 2rem"
    overflow: hidden

  card-result:
    borderRadius: "24px"
    padding: "2.5rem 3rem"
    color: "#ffffff"

  section-card:
    backgroundColor: "#ffffff"
    borderRadius: "16px"
    padding: "1.6rem"
    border: "1px solid #eeebe6"

  input:
    border: "1.5px solid #ebebeb"
    borderRadius: "10px"
    padding: "0.72rem 0.85rem"
    fontSize: "1.05rem"
    fontWeight: 600
    backgroundColor: "#fafafa"
    transition: "border-color 0.2s, background 0.2s"
    focus:
      borderColor: "#E53935"
      backgroundColor: "#ffffff"

  badge-pill:
    borderRadius: "999px"
    padding: "0.35rem 1rem"
    fontSize: "0.75rem"
    fontWeight: 800
    letterSpacing: "0.08em"
    textTransform: uppercase

  nav-drawer:
    width: "min(480px, 100vw)"
    backgroundColor: "#ffffff"
    borderRadius: "20px 0 0 20px"
    transition: "transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)"

  popup:
    backgroundColor: "#ffffff"
    borderRadius: "22px"
    padding: "2rem 2rem 1.8rem"
    maxWidth: "400px"
    boxShadow: "0 32px 80px rgba(0, 0, 0, 0.30), 0 0 0 1px rgba(0, 0, 0, 0.06)"
    animation: "0.28s cubic-bezier(0.34, 1.56, 0.64, 1)"
---

# AMC Care Design System

AMC Care is a digital health companion that helps people monitor vitals, interpret lab results, connect with doctors, and track wellbeing over time. The visual identity balances clinical trust with human warmth — clean enough for precision, warm enough to feel personal.

## Brand Identity

The logo splits into two voices: **AMC** in bold near-black (weight 800) and **care** in the brand blue (`#1565c0`) at normal weight (400), visually separating institutional authority from empathetic care. On dark backgrounds, "AMC" becomes white and "care" shifts to a softer `#90caf9` light blue.

## Color Philosophy

The palette is anchored around three poles:

**Blue (#1565c0)** is the primary action color. It appears on CTAs, interactive links, accent text, data bars, and in-chat user bubbles. It signals trust, reliability, and digital fluency — the language of healthcare technology. Dark blue (#0d47a1) serves as its hover state.

**Near-black (#111)** and its companion **dark (#1a1a1a)** provide the typographic backbone. Headlines, primary buttons, and the scrolled navigation pill all use this color. It reads as authoritative without feeling cold.

**Warm neutrals (#f5f0eb, #faf8f5, #f5ede0)** soften every surface that could otherwise feel sterile. These warm off-whites appear on hero cards, testimonial cards, the logging section background, and the footer. They add an analog, human quality to a digital product.

**Medical red (#E53935)** is reserved for the blood pressure tool, required field indicators, step badges, and alert states. It never bleeds into the main product chrome, so it retains its clinical weight when it appears.

The AI feature uses a distinct **purple wash** (`#f8f6ff` → `#e8e0ff`) to frame speculative/generative content as different from grounded health data.

## Typography

The brand typeface is **ABC Arizona Sans** (fallback: Arial, sans-serif). It is set with `-webkit-font-smoothing: antialiased` throughout.

- **Headings** are always weight 800, with tight negative letter-spacing (−0.02em to −0.03em) that gives them compactness and energy at display sizes.
- **Body copy** runs at weight 400 with generous line heights (1.7–1.75), prioritizing reading comfort over density.
- **Labels and overlines** use uppercase with tracked-out letter-spacing (0.08em–0.12em) at small sizes (0.62rem–0.72rem), weight 700. These appear on step badges, category labels, and section titles.
- **Navigation primary links** are large (1.75rem) at weight 500 — medium-heavy, not bold, creating a calm editorial feel inside the drawer.
- **Numeric readouts** (blood pressure values) use `font-variant-numeric: tabular-nums` with weight 800 and tight letter-spacing (−0.04em) for aligned, legible health data.

All display sizes use CSS `clamp()` for fluid scaling between mobile and desktop without breakpoint jumps.

## Surfaces and Depth

The product uses four distinct surface layers:

1. **White (#fff)** — primary page background, section cards, and the right panel of the BP input flow.
2. **Warm off-white (#faf8f5, #f5f0eb)** — hero card backgrounds, testimonial cards, footer zone. These surfaces carry visual weight without elevation.
3. **Dark (#111, #1a1a1a)** — the footer bottom bar, the scrolled navigation pill, and the left panel of the BP flow. Dark surfaces always use white text.
4. **Transparent with blur** — the scrolled header (`rgba(18, 18, 18, 0.95)` + `backdrop-filter: blur(12px)`), overlay backdrops, and CTA banner badges. Blur is used sparingly and purposefully, not as decoration.

Shadows are minimal and purpose-driven. Cards that float above content (mockup floats, popups) use `0 4px 16px rgba(0,0,0,0.10)`. The popup is the deepest element: `0 32px 80px rgba(0,0,0,0.30)` with a 1px hairline ring. Feature grid items lift on hover with a blue-tinted shadow to confirm interactivity.

## Shape and Roundness

AMC Care uses a pill-first rounding philosophy for interactive elements and graduated radius for containers:

- **Pill (999px):** All CTA buttons, navigation badges, input fields in forms, email subscribe, and dot indicators. The pill shape is the primary interactive affordance — it reads as "tappable."
- **Large cards (20px–28px):** Feature cards, hero mockup containers, the CTA banner. Rounder than standard to feel approachable and modern.
- **Standard cards (16px):** Most content cards and section blocks.
- **Small elements (8px–12px):** Reading slots, popup action buttons, note/warning items.

The header itself has a dramatic shape-morph on scroll: it collapses from a full-width transparent bar into a centered floating pill with dark glass, using a 0.4s cubic-bezier easing.

## Motion and Interaction

Transitions are kept short and purposeful:

- **Standard UI feedback (0.2s ease):** Color changes, border focus, button hovers. Near-instantaneous — the interface reacts without theatrical delay.
- **Layout morphs (0.4s, eased):** The header pill-to-bar animation. Smooth but noticeable, communicating spatial context change.
- **Entrance animations:** The popup uses a spring curve (`cubic-bezier(0.34, 1.56, 0.64, 1)`) that slightly overshoots — it pops into place rather than easing in, drawing the eye to urgent validation messages.
- **Data fills (0.8s, decelerate):** The reliability score track fills slowly, giving the number meaning and creating a moment of anticipation.
- **Ambient loops:** Typing indicators (1.3s bounce), emergency pulse (1.5s), AI shimmer (1.8s). Each loop speed communicates cadence — the slower the animation, the more passive the state.

Text that rotates in the hero and testimonials uses a simple `opacity + translateY` crossfade (0.3s–0.35s ease) for minimal visual disruption.

## Component Patterns

### Buttons
Three semantic variants share the same pill shape:
- **Dark primary** (`#111` → hover `#333`): Default non-clinical actions, navigation CTAs, "Add" in forms.
- **Blue primary** (`#1565c0` → hover `#0d47a1`): Sign-up, log in, data-related CTAs.
- **Red primary** (`#E53935` → hover `#c62828`): Blood pressure submit, review, and other clinical-flow actions.

A "smart CTA" morph pattern is used in the BP tool: the button is disabled and rendered in a faded red (`opacity: 0.28`) until the form is ready, then transitions to full-opacity active red. This reduces the need for separate enabled/disabled button components.

### Cards
Hero mockup cards sit on the warm `#f5f0eb` section background. Their inner chrome (the phone/chat mockup) uses white surfaces with `#e8e2db` borders — slightly warm, not neutral gray — to feel product-real. Floating tooltips within mockups use `box-shadow: 0 4px 16px rgba(0,0,0,0.1)` to float above the card.

### Navigation Drawer
The right-edge navigation drawer slides in over a 25% dark backdrop. Primary links are large-scale and airy (1.75rem, weight 500); secondary links are body-sized. The drawer has a left rounded edge (20px 0 0 20px) to feel embedded in the viewport rather than a separate sheet.

### Validation Popup
Error and warning states use an icon-first layout with colored icon containers (red for errors: `#fff0f0`; orange for warnings: `#fff8f0`). The popup entrance spring animation reinforces urgency. Action buttons are stacked vertically — Continue (filled), Re-enter (ghost outline), Get help (text underline) — ranked by confidence the user should feel.

### Blood Pressure Results
The hero result card is full-bleed colored (color determined by the reading category), with two decorative circles created via `::before` and `::after` pseudo-elements. The BP numbers use the largest type on the platform (`clamp(3.5rem, 8vw, 5.5rem)`, tabular-nums) for immediate impact. Reading rows that were included in the average show green highlights; excluded readings are faded.

### Step Progress Dots
The BP entry flow uses a small dot-row progress indicator: inactive dots are 7×7px circles (`rgba(255,255,255,0.2)`), completed dots shift to `rgba(255,255,255,0.5)`, and the active step morphs from a circle into an elongated pill (22px wide). This is the only place a non-button element uses the pill-morph idiom.

## Layout System

Sections use a consistent `max-width + auto margin` pattern for centering, with width varying by content density:
- Prose / focused content: 760px (hero text), 860px (FAQ)
- Results / data: 960px
- Feature grids: 1100px
- Full marketing content: 1200px

The BP entry page uses a full-viewport 50/50 split: a dark left panel (video/mockup context) and a white right panel (form). This split is a deliberate departure from the marketing page aesthetic — it signals a mode transition into a clinical tool.

The footer uses a warm `#f5f0eb` background for its link columns, transitioning to a near-black `#1a1a1a` bottom bar for copyright and social links — a common dark-footer pattern that grounds the page without requiring a hard cut.
