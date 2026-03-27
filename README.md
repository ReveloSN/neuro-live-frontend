## Production

- Frontend URL: https://neuro-live-frontend.vercel.app/
  

# NeuroLive Frontend

Minimal but production-ready frontend MVP for the NeuroLive project. It is built with Next.js App Router, TypeScript, and Tailwind CSS, and is prepared for direct deployment on Vercel.

## Tech stack

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Server-side health check support through `NEXT_PUBLIC_API_URL`
- Internal API proxy routes aligned with the Java backend

## Folder structure

```text
app/
  dashboard/page.tsx   Dashboard preview route
  globals.css          Global styles and design tokens
  layout.tsx           Root layout and metadata
  page.tsx             Landing page
components/
  button.tsx           Reusable action button
  card.tsx             Reusable content container
  section-header.tsx   Reusable section heading block
  status-badge.tsx     Reusable status indicator
lib/
  api.ts               Backend health check helper
  backend-proxy.ts     Server-side proxy helper for backend calls
  types.ts             Shared frontend types aligned with backend DTOs
  utils.ts             Small shared utility functions
```

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell you can use:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. If the backend is available, set the API URL in `.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Available routes

- `/` landing page
- `/dashboard` dashboard preview

## Internal API routes

These routes are prepared so the frontend can talk to the backend through Next.js server routes when deployed on Vercel:

- `/api/health`
- `/api/auth/login`
- `/api/auth/register`
- `/api/users/me`

This approach helps keep the frontend aligned with the current Java backend and reduces the risk of browser-side CORS problems when frontend and backend are deployed on different platforms.

## Environment variables

Required when backend connectivity or proxying should be enabled:

- `NEXT_PUBLIC_API_URL`: Base URL of the deployed backend API. The landing page performs a lightweight request to `/health`.

If `NEXT_PUBLIC_API_URL` is not set, the UI safely shows that the backend is not configured yet, and the internal proxy routes return a safe fallback response.

## Vercel deployment

1. Push this frontend repository to GitHub.
2. Import the project into Vercel.
3. Keep the default framework preset as `Next.js`.
4. Add the environment variable `NEXT_PUBLIC_API_URL` in the Vercel project settings if you want live backend connectivity.
5. Deploy.

No extra Vercel configuration is required for this MVP.

## Alignment with the current backend

The frontend is prepared around the backend endpoints that already exist in the Java service:

- `/health`
- `/auth/login`
- `/auth/register`
- `/users/me`

At the moment, the UI still uses mock content for the dashboard view, but the API layer is already shaped to match the backend contract and can be extended without restructuring the project.

## Notes for continuation

- Authentication can be added later without changing the current route structure.
- Shared UI components are intentionally simple so the design system can grow gradually.
- The backend health check is implemented with safe server-side fallback behavior for missing or unreachable endpoints.
- If the backend stays on Azure and the frontend is deployed on Vercel, the internal Next.js proxy routes are the safest starting point for integration.
