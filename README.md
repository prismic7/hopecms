# HopeCMS — Hope, Inc. Customer Management System

A 6-week capstone project for BS Computer Science.
Built with React 18, Vite, Tailwind CSS, and Supabase.

## Team                              

| Member | Role                          |
|--------|-------------------------------|
| M1     | Project Lead / Full-Stack     |
| M2     | Frontend Developer (UI/UX)    |
| M3     | Backend / DB Engineer         |
| M4     | Rights & Auth Specialist      |
| M5     | QA / Documentation            |

## Prerequisites                     

Before setting up locally, make sure you have:
- [Node.js](https://nodejs.org/) v18 or higher — run `node -v` to check
- [Git](https://git-scm.com/) — run `git --version` to check
- Supabase credentials from M3 (URL + anon key)

## Tech Stack
- Frontend: React 18 + Vite
- Styling: Tailwind CSS
- Backend/DB: Supabase (PostgreSQL)
- Auth: Supabase Auth (Email + Google OAuth)

## Local Setup
1. Clone the repo
   git clone https://github.com/prismic7/hopecms.git

2. Install dependencies
   npm install

3. Set up environment variables
   - Copy .env.example to .env
   - Fill in your Supabase URL and anon key (get from M3)

4. Run the app
   npm run dev

5. Open browser at http://localhost:5173

## Running Tests                     

npm run test

## Branching Strategy
- main — production only, no direct pushes
- dev — stable base, all PRs merge here
- feature branches — always branch from dev

## Branch Naming
- feat/ — new feature
- fix/ — bug fix
- db/ — database changes
- test/ — test files
- docs/ — documentation
- chore/ — config and tooling
- refactor/ — code cleanup

## PR Rules
- Never push directly to main or dev
- Always open a PR targeting dev
- At least 1 teammate must approve before merging
- Delete branch after merging

## Deployment                        

Live URL: [To be added after Sprint 3 deployment]