# MJT Recruitment — iOS & Android

A recruitment app built with Expo (React Native). It has two separate panels:

| Recruiter | Job Finder |
|---|---|
| Dashboard with stats and recent applicants | Browse and search open jobs |
| Post, edit, close and delete jobs | Apply with a CV upload (PDF/Word) |
| Review applicants, view CVs, set status | Track application status |
| Chat with applicants | Chat with recruiters |

Each panel has its own login. A recruiter account can't sign in through the Job Finder panel, and a Job Finder account can't sign in through the Recruiter panel.

**Backend:** [Supabase](https://supabase.com) **free tier** provides the database, login, CV storage and live chat. You don't need a server or a credit card.

---

## Setup (about 10 minutes, free)

### 1. Create a free Supabase project
1. Sign up at https://supabase.com (free plan, no card needed).
2. Click **New project**, then pick a name, a database password and the closest region.

### 2. Create the database
1. In your project, open **SQL Editor**, then **New query**.
2. Paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.

This creates the tables, security rules, the private `resumes` storage bucket and live chat. You can run it again safely.

### 3. (Recommended for testing) turn off email confirmation
Go to **Authentication → Sign In / Providers → Email** and turn off **Confirm email**.
Users are then logged in straight after signup. If you leave it on, users must click the link in their email before logging in.

### 4. Connect the app
Copy `.env.example` to `.env.local`, then fill in the values from **Project Settings → API**:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 5. Run it
```bash
npm install
npm start          # scan the QR code with the Expo Go app on your phone
```

## Testing with Docker (no Supabase account needed)
This runs a full local Supabase (database, login, storage, chat) plus a web build of the app, all in Docker. It comes with demo data already loaded.

```bash
npx supabase start            # first run downloads images (a few minutes)
npx supabase status -o env    # copy the ANON_KEY value
```
Create a file called `.env.docker` (it's git-ignored):
```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from above>
```
```bash
docker compose --env-file .env.docker up -d --build
```
Then open **http://localhost:8080** and log in with a demo account (password `password123`):
- Recruiter panel: `recruiter@demo.com`
- Job Finder panel: `jobfinder@demo.com`

Useful commands:
- **Database browser (Supabase Studio):** http://127.0.0.1:54323
- **Reset to fresh demo data:** `npx supabase db reset`
- **Stop everything:** `docker compose down`, then `npx supabase stop`

To test on your phone with Expo Go against this local backend, set `EXPO_PUBLIC_SUPABASE_URL` in `.env.local` to `http://<your-PC-IP>:54321`. Your phone can't reach `127.0.0.1`, which is the phone itself.

## Build an installable app (free)
```bash
npm install -g eas-cli
eas login                      # free Expo account
eas build -p android --profile preview   # gives you an .apk download link
```
Publishing to Google Play has a one-time fee of $25. The App Store costs $99 per year. You only need these to publish publicly; the APK above is free.

## Free tier limits
- 500 MB database, 1 GB file storage, 50,000 monthly users. That's plenty to launch.
- A free project **pauses after 7 days without activity**. Open the dashboard and click **Restore** to wake it. Any app usage counts as activity.

## Project structure
```
supabase/schema.sql      database tables, security rules, storage (run once)
src/lib/api.ts           every database call
src/context/AuthContext  login / signup / role check
src/navigation/          RecruiterTabs, CandidateTabs, AuthStack
src/screens/auth         Welcome (two panels), Login, Signup, Forgot password
src/screens/recruiter    Dashboard, My jobs, Job form, Applicants, Applicant detail
src/screens/candidate    Job listings, Job detail, Apply, My applications
src/screens/shared       Messages, Chat, Profile
```
