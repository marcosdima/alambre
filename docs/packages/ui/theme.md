---
title: Theme & Design Tokens Reference
summary: Design tokens, color palette, typography, spacing, and theme provider contracts for @some-alambre/ui.
---

# Theme & Design Tokens (`@some-alambre/ui`)

`@some-alambre/ui` provides a unified design token system for tactile mobile interfaces. All tokens are reactive and automatically adapt to light and dark color schemes.

---

## 1. Provider Setup (`App.tsx`)

`<ThemeProvider>` must sit near the top of the application provider tree (above `NavigatorProvider`, `ConfirmProvider`, `ToastProvider`, and `Root`) and receive both the active color palette and `fontFamily`:

```tsx
import { ThemeProvider } from '@some-alambre/ui';

<ThemeProvider theme={{ ...theme, fontFamily: config.fontFamily }}>
  {/* NavigatorProvider, ConfirmProvider, ToastProvider, Root */}
</ThemeProvider>
```

---

## 2. Consuming Tokens (`useTheme`)

Access the active theme tokens in any presentation component:

```tsx
import { useTheme } from '@some-alambre/ui';

const theme = useTheme();
```

### Color Tokens

| Token | Purpose | Typical Value (Light / Dark) |
| --- | --- | --- |
| `theme.background` | Screen background color | Neutral base background |
| `theme.surface` | Primary card, dialog, sheet background | Card elevation base |
| `theme.surfaceAlt` | Secondary container, track, chip background | Inset background |
| `theme.color` | Primary foreground text color | High-contrast text |
| `theme.muted` | Secondary text, placeholder, caption color | Medium-contrast text |
| `theme.primary` | Brand accent color | Primary interactive surfaces |
| `theme.primarySoft` | Soft tint background for primary actions | Low-opacity primary tint |
| `theme.onPrimary` | Contrast text rendered on top of primary | White or dark contrast |
| `theme.secondary` | Secondary accent | Supporting accents |
| `theme.secondarySoft` | Secondary soft tint | Low-opacity secondary tint |
| `theme.sand` | Warm neutral accent | Warm paper / earth tone |
| `theme.sandSoft` | Warm neutral tint | Warm subtle container fill |
| `theme.border` | Standard card and input border | Subtle structural divider |
| `theme.borderSoft` | Hairline border | Hairline separator |
| `theme.success` | Status success green | Confirmation, completed |
| `theme.warning` | Status warning amber | Caution, pending |
| `theme.danger` | Status danger red | Destructive actions, errors |
| `theme.dangerSoft` | Status danger soft tint | Error background container |
| `theme.overlay` | Modal backdrop color | Dimmed scrim (`rgba(0,0,0,0.5)`) |
| `theme.overlayBar` | Bottom sheet drag grabber bar | Muted handle pill |
| `theme.fontFamily` | Active global font family | Propagated to all components |

---

## 3. Strict Token Guidelines

1. **Zero Hardcoded Colors:** Never use hex or rgb literals directly in component styles. Always reference `theme.*`.
2. **Typography Consistency:** Render text using `AppText` or `AppTitle` so that `theme.fontFamily` and `theme.color` apply automatically.
3. **Accessibility Contrast:** Ensure interactive text uses `theme.onPrimary` when sitting on `theme.primary`, or `theme.color` on `theme.surface`.
