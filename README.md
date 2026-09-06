# Academy Platform

Next.js 14 (App Router, TypeScript) + Prisma (PostgreSQL) + NextAuth.js.

## What's here

- **Public marketing site** — `/`, `/about`, `/teams`, `/news`, `/contact` (no login needed)
- **Player portal** — `/portal/*` (dashboard, profile, schedule, videos) — requires login
- **Staff area** — `/admin/*` (players, schedule) — requires ADMIN or COACH role
- **Data model** — `prisma/schema.prisma`: User, Player, Coach, Team, PlayerStat,
  ProgressNote, ScheduleEvent, Video, NewsPost
- **Auth** — NextAuth credentials login, JWT sessions, role-based route protection via
  `src/middleware.ts`

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in a real `DATABASE_URL` (PostgreSQL) and a
   generated `NEXTAUTH_SECRET`:
   ```bash
   cp .env.example .env
   openssl rand -base64 32   # paste the output into NEXTAUTH_SECRET
   ```
3. Push the schema to your database and seed an admin user:
   ```bash
   npx prisma migrate dev --name init
   npm run seed
   ```
   This creates `admin@academy.local` / `changeme123` — **change this password after first login.**
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Pushing this to GitHub

From inside this project folder:

```bash
git init
git add .
git commit -m "Initial scaffold: data model, auth, public site, player portal"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Create the empty repo on GitHub first (no README/gitignore, since you already have them here),
then run the commands above.

## Suggested next steps

1. Swap the seed data for real teams/players, or build an admin "create player" form.
2. Add real content to the public pages (About, Contact form wiring).
3. Deploy — Vercel is the easiest path for Next.js, plus a managed Postgres
   (Neon, Supabase, or Railway all work well and have generous free tiers).
4. Add password reset / "invite a player" flow instead of manually seeding accounts.
