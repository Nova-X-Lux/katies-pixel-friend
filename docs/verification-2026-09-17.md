# Little Keepsakes release checks

Verified locally on 17 September 2026. Browser checks used isolated Chromium
profiles and synthetic saves; no real user progress was changed during testing.

## Automated checks

- TypeScript build and Vite production build.
- Unit tests for care, rewards, save migration and validation, username entry,
  cloud failure handling, daily claims, parcels, friendship, permanent palette
  purchases and Snack Stack overlap/score calculations.
- Mock-backend browser tests for failed reads, late requests, save retries,
  account switching, restart ordering, failed deletion recovery, unavailable
  local storage and future-version save protection.

## Browser interaction checks

- Adoption of all three pets; immediate naming; switching local usernames.
- Local reload preserves coins, pet, palette and collected rewards.
- Three daily claims award 5 coins each; parcel awards 10 once. Repeated
  clicks and reload do not repeat those rewards.
- Room previews do not spend coins. Purchased palettes persist, and swapping
  owned palettes is free.
- Care sheet keyboard focus stays inside, Escape closes it and focus returns.
- Restart requires the pet name and a sustained press, including keyboard use.
- Treat Catch: movement, manual/background pause, frozen timer, one reward,
  replay and no reward on unfinished exit, including React StrictMode.
- Memory Pairs: twelve accessible cards, input lock during resolution, matched
  cards disabled, completion, one reward, replay and cleanup on exit.
- Snack Stack: keyboard/touch drop, perfect 12-layer win (210 points, 18 coins),
  partial loss, previous best, replay, pause and unfinished exit.
- Sound is silent by default, starts after a user gesture, and respects mute.
- Reduced-motion preference suppresses the pet's continuous animation.

## Visual checks

Reviewed the room, adoption, keepsake pages, colour preview, settings and all
three games at phone sizes, including 320px and 390px widths, plus desktop.
No horizontal scrolling in checked screens. The notebook uses paper texture,
collected stamps and a pet photograph, keeping secondary activity out of the
main room. Screenshots are local artifacts under `output/playwright/`.

These checks emulate mobile viewports; they are not a claim of physical iPhone
or Android device testing. Cloud access still requires a connection on initial
load. Username-only profiles remain accessible to anyone who knows the name.
