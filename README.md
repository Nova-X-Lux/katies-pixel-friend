# Katie's Pixel Friend

A phone-first, pixel-art virtual companion built for Katie. She can adopt a
cat, hamster, or panda, name it, care for it, and earn coins through three small
games. Progress saves on her phone immediately and syncs to Supabase when cloud
configuration is available.

## Current experience

- Username-only entry with no email or password
- Cat, hamster, and panda adoption
- Immediate companion naming
- Mood, time, action, and decoration-aware dialogue
- A friendly age calculated from the original adoption date
- Feeding, petting, washing, sleeping, and gentle time decay
- Treat Catch, Memory Pairs and Snack Stack with detailed results and replay
- Three optional daily activities: 5 coins each and a 10-coin parcel; no streak penalties
- A keepsake book with friendship hearts, eight milestone stamps and favourite snacks
- Four permanent room palettes: Rose cottage, Garden room, Lilac evening and Peaches & cream
- A filterable Cosy Shop with permanent decorations that can be swapped at any time
- Automatic day and night room changes based on Katie's local time
- Coins, high scores, and safe restart controls
- Soft sound effects, muted by default, and keyboard-accessible care menus
- Local-first saving with visible account, sync, and recovery status
- Save loading fails safely: a connection error never looks like a new adoption
- GitHub Pages build and installable mobile web-app shell

The companion never dies, runs away, or shames Katie for being absent. Needs
have a safe minimum and a returning pet simply says it had a long nap.

## Local development

```powershell
npm.cmd install
npm.cmd run dev
```

Without Supabase environment values, development uses a clearly marked local
preview. Use the same preview username to load the same local save.
Cloud profiles need a successful initial connection before play; the site keeps
cached saves safe rather than uploading an uncertain offline copy. Changes made
after loading are saved locally and can be retried when the connection returns.

## Verification

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

## Production setup

1. Follow `supabase/README.md` to create the username save table.
2. Create a public GitHub repository named `katies-pixel-friend`.
3. Add the two Actions secrets documented in `supabase/README.md`.
4. Push `main` and enable GitHub Pages with GitHub Actions as its source.
5. The expected address is `https://nova-x-lux.github.io/katies-pixel-friend/`.

## Privacy and secrets

- The GitHub repository and Pages website are public.
- Do not add private messages, chat exports, private photographs, addresses, or
  personal records to this repository.
- The Supabase publishable key may be present in browser code. Username-only
  access is intentionally shared: anyone who knows a username can open, change,
  or reset that save.
- Never commit a password, Supabase secret key, or service-role key.

## Updating later

The saved JSON includes a schema version so future releases can add rooms,
items, games, dialogue, and growth stages without replacing Katie's chosen pet.
Version 3 upgrades version 1/2 saves in the browser. Existing pets, names, coins,
scores, items and adoption dates stay intact; new activity history starts with
this update. No database migration or save reset is needed for this release.

The service-worker cache is versioned independently. Bump it when publishing
shell updates so an installed copy receives the new interface.
