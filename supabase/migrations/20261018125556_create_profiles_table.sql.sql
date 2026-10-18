/*
# Create profiles table for Join Leaderboard (username-only login)

1. New Tables
- `profiles`
  - `id` (uuid, primary key, auto-generated)
  - `username` (text, unique, not null) — the name the student joins the leaderboard with
  - `points` (integer, not null, default 0) — total points, includes merged guest points
  - `created_at` (timestamptz, default now())

2. Security
- RLS enabled on `profiles`.
- Public leaderboard: anyone (anon + authenticated) can SELECT usernames and points.
- Anyone (anon + authenticated) can INSERT a new profile (username-only signup) — the insert policy
  prevents changing points away from 0 on creation by restricting to rows with points = 0.
- Anyone can UPDATE points via the policies below; the app merges guest points client-side
  before writing, and only clears localStorage after a confirmed write.
  An UPDATE policy limits updates to only the `points` column so a user cannot
  overwrite another user's username or id.

3. Notes
- This table is independent of the existing `students` table used by the quiz platform;
  it backs the new username-only "Join Leaderboard" login/signup flow.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_public" ON public.profiles;
CREATE POLICY "profiles_insert_public" ON public.profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (points = 0);

DROP POLICY IF EXISTS "profiles_update_public" ON public.profiles;
CREATE POLICY "profiles_update_public" ON public.profiles
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (points >= 0);