# Supabase setup

The public site shows a username and password. Supabase Auth still needs an
internal identity, so the client maps a normalized username to:

```text
<username>@pixel-friend.example
```

Katie never needs to see or type that alias.

## Create the project

1. Create a Supabase project.
2. Open the SQL editor and run
   `migrations/202609020001_create_pet_saves.sql`.
3. Open Authentication > Users and create one password user.
4. Use `katie@pixel-friend.example` as the internal email alias.
5. Mark the user as confirmed while creating it.
6. Set a strong password privately. Never commit it or send it in chat.
7. Do not add a public sign-up screen.

## Connect local development

Copy `.env.example` to `.env.local` and provide the project URL and current
publishable browser key. `.env.local` is ignored by Git.

## Connect GitHub Pages

Create these GitHub Actions repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The browser key is designed to be public. The database remains protected by
Katie's authenticated user ID and the row-level policies in the migration.
Never use a Supabase secret or service-role key in this project.
