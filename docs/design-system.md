Design System Snapshot
======================

Brand Voice
-----------
- Tone: friendly, confident, plain-language.
- Do not use technical terms such as “AI,” “render,” or “compute.”
- Primary action verbs: “See,” “Adjust,” “Send,” “Take Photo.”

Color Palette
-------------
- Primary Action: `#1F4CFF` (blue) ← CTA buttons (e.g., “See how it looks”).
- Secondary Action: `#0F172A` (dark navy) ← “Back to Store.”
- Neutral Background: `#F5F5F7`.
- Surface: `#FFFFFF`.
- Accent (Progress/Highlights): `#34D399`.
- Text Primary: `#111827`.
- Text Secondary: `#4B5563`.
- Border Radius: 20px on large cards, 12px on buttons, 16px on modals.

Typography
----------
- Font Stack: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.
- Heading (Modal titles): 20px, medium weight, letter-spacing 0.
- Body copy: 16px regular.
- Instructions/Helper text: 14px regular, secondary color.

Component Patterns
------------------
- **Modal Shell**: full-screen on mobile with top bar (close icon left, product title centered, share icon optional).
- **Carousel**: auto-advance every 5s, pagination dots, not interactive required but swipe-enabled.
- **Buttons**: full-width, 56px height, high contrast text (white on primary/dark, dark on tertiary).
- **Instruction Banner**: semi-transparent dark overlay with rounded corners, text centered.
- **Loading Indicator**: circular spinner (CSS animation) with 16px margin spacing and subtext.
- **Email Modal**: floating card over dimmed backdrop, 24px padding, includes consent checkbox and helper text.
- **Placement Guides Toggle**: ghost button in toolbar; when active overlays light grid for alignment.

States & Accessibility
----------------------
- All primary and secondary buttons include focus outlines (`2px #1F4CFF`) and pressed states darkened by 8%.
- Error toasts use accent color `#EF4444` with white text; success toasts use accent `#34D399`.
- Instruction banner announced via `aria-live="polite"` when screen loads; close icons have `aria-label`.
- Minimum tap target size is 48px; spacing ensures 16px between actionable elements.

Iconography
-----------
- Use outline icons from Heroicons where possible; line weight 2px.
- Ensure icons are secondary color with 24px size.

Spacing Scale
-------------
- Base unit: 4px.
- Key values: 8, 12, 16, 24, 32, 48.
- Modal padding: 24px horizontal; card corner radius 20px.

Motion
------
- Transition duration: 200ms ease-out for button presses and modal transitions.
- Carousel fade: 350ms ease-in-out.
- Placement canvas: real-time with requestAnimationFrame; apply 150ms ease when releasing gestures.

Assets
------
- Store product PNGs stored via Shopify metafield `custom.see_it_image`.
- Carousel imagery sized 600x600, optimized <150KB, stored in CDN.
- Placeholder room photo for empty state (used in onboarding carousel).

