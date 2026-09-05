# Supabase setup

The public site uses a username with no email or password. The normalized
username is the cloud save key. This is intentionally convenient rather than
private: anyone who knows a username can open, change, or reset its save.

## Create the project

1. Create a Supabase project.
2. If this is a new project, run
   `migrations/202609020001_create_pet_saves.sql` in the SQL editor first.
3. Run `migrations/202609050001_username_only_access.sql` in the SQL editor.
   It creates the username-keyed table, migrates other existing alias-account
   saves, and leaves `katie` blank for her first visit. The old authenticated
   table is not deleted and remains available as a rollback backup.

## Connect local development

Copy `.env.example` to `.env.local` and provide the project URL and current
publishable browser key. `.env.local` is ignored by Git.

## Connect GitHub Pages

Create these GitHub Actions repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The browser key is designed to be public. Never use a Supabase secret or
service-role key in this project.
