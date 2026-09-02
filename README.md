# Katie's Pixel Friend

A phone-first, pixel-art virtual companion built for Katie. She can adopt a
cat, hamster, or panda, name it, care for it, and earn coins through two small
games. Progress saves on her phone immediately and syncs to Supabase when cloud
configuration is available.

## Current experience

- Username and password login with no email field
- Cat, hamster, and panda adoption
- Immediate companion naming
- Mood, time, action, and decoration-aware dialogue
- A friendly age calculated from the original adoption date
- Feeding, petting, washing, sleeping, and gentle time decay
- Treat Catch and Memory Pairs minigames with detailed results and replay
- A filterable Cosy Shop with permanent decorations that can be swapped at any time
- Automatic day and night room changes based on Katie's local time
- Coins, high scores, and safe restart controls
- Local-first saving with visible account, sync, and recovery status
- GitHub Pages build and installable mobile web-app shell

The companion never dies, runs away, or shames Katie for being absent. Needs
have a safe minimum and a returning pet simply says it had a long nap.

## Local development

```powershell
npm.cmd install
npm.cmd run dev
```

Without Supabase environment values, development uses a clearly marked local
preview login. Use the same preview username to load the same local save.

## Verification

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

## Production setup

1. Follow `supabase/README.md` to create the save table and Katie's user.
2. Create a public GitHub repository named `katies-pixel-friend`.
3. Add the two Actions secrets documented in `supabase/README.md`.
4. Push `main` and enable GitHub Pages with GitHub Actions as its source.
5. The expected address is `https://nova-x-lux.github.io/katies-pixel-friend/`.

## Privacy and secrets

- The GitHub repository and Pages website are public.
- Do not add private messages, chat exports, private photographs, addresses, or
  personal records to this repository.
- The Supabase publishable key may be present in browser code; access is
  restricted by Auth and Row Level Security.
- Never commit a password, Supabase secret key, or service-role key.

## Updating later

The saved JSON includes a schema version so future releases can add rooms,
items, games, dialogue, and growth stages without replacing Katie's chosen pet.
