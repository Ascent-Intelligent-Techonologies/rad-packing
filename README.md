# RAD Packing Solutions: website + CRM

Modern, mobile-first rebuild of [radpacking.com](https://www.radpacking.com) with a built-in back-office CRM.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · Tailwind CSS v4 · Prisma 7 + PostgreSQL (Prisma Postgres) · zod · lucide-react

## What's inside

### Public website (`/`)
- Home, About, Products & Solutions, Contact, Privacy Policy, Accessibility Statement. All copy comes from the current site.
- **Product catalogue** (`/products`): category → sub-category → product hierarchy with a category sidebar, live search, paged product grid, category pages (`/products/category/<path>`), and product pages with photo gallery, features, specifications and a pre-filled quote form.
  - Choosing a category, searching and paging update only the product area (no page reload); the address bar still changes, so views can be shared and Back works. It also works without JavaScript.
  - Search is word based (any order, singular or plural, title matches first) and looks in titles, tags, categories and descriptions. See `searchCatalogue` in `src/lib/catalogue/public.ts`.
  - Products without a photo show an original illustration picked from the product type (`src/components/catalogue/ProductArt.tsx`) until staff upload a real photo.
  - Everything is managed from the admin (see *Website catalogue* below), cached, and refreshed the moment staff save a change.
- Header with both phone numbers, location bar, mobile menu, and a thumb-reach **Call / WhatsApp / Quote** bar on phones.
- Full-bleed looping "packaging line" hero (drop a real clip at `public/media/hero.mp4` and it fades in over the animation).
- **Smart Chat** widget (structured, rule-based, no AI model): answers common questions with bold key terms, page-link chips and quick-reply buttons, then opens an inline lead form (name, email, phone, message).
- Quote form with product chips, contact form, honeypot spam trap, rate limiting.
- SEO: metadata, sitemap, robots, LocalBusiness + FAQPage JSON-LD.

### CRM back office (`/admin`)
Email + password staff login (server-side, revocable sessions; scrypt-hashed passwords).

| Area | What it does |
| --- | --- |
| Dashboard | New enquiries, open pipeline value, won this month, win rate, my tasks, recent activity |
| Enquiries | Kanban (drag & drop; "Move to" selector on phones) + list. Website form, quote form and chat enquiries arrive automatically, scored 0-100, auto-linked to known customers, with a follow-up task |
| Customers / Contacts | Company records, contacts, notes & timeline, linked enquiries/quotes/tasks |
| Quotes | Line-item builder from the price list, 5% UAE VAT, numbering `RAD-Q-0001`, printable/PDF, status workflow |
| Tasks | My / all / overdue / today, linked to enquiries and customers |
| Website catalogue | Add, edit, hide and remove the categories and products shown on `/products`: titles, descriptions, key features, specifications, tags and photo uploads (several per product, reorderable, first = cover). Photos are resized in the browser and stored in the database, so nothing extra to set up |
| Price list | Internal product & service prices used in quotes |
| AI chats | Read-only log of website chat conversations (what customers ask) |
| Reports | Funnel, sources, industries, products, win rate, leaderboard, CSV exports |
| Team / Settings | Staff accounts and roles; company profile, VAT, quote terms; demo-data loader |

**Roles:** `admin` · `manager` · `sales` · `ops` · `viewer` (see `src/lib/crm/permissions.ts`).

## Local development

```bash
npm install
npm run db:dev          # starts a local Prisma Postgres, prints a postgres:// URL
cp .env.example .env    # set DATABASE_URL (from the line above), ADMIN_EMAIL, ADMIN_PASSWORD
npx prisma migrate deploy
npm run dev             # http://localhost:3000
```

Sign in at `/admin/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The first sign-in creates the Administrator account (only while there are no users). Change the password afterwards under *My account*. In *Settings → Demo data* an administrator can load clearly-labelled fictional records to demo the CRM, and remove them again.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string (set automatically by the Vercel + Prisma Postgres integration; `POSTGRES_URL` also works) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first run | Bootstrap the first administrator |
| `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, `LEAD_FROM_EMAIL` | optional | Email the team when a website enquiry arrives |

## Deploying to Vercel

Production: https://rad-packing.vercel.app (Vercel project `rad-packing`, Prisma Postgres database `rad-packing-db`).

The Vercel project is connected to this GitHub repo, so **every push to `main` deploys automatically**. You can also deploy by hand with `npx vercel@latest deploy --prod`.

The build runs `prisma generate`, `prisma migrate deploy` and `next build`. Production environment variables (database URL from the Prisma Postgres integration, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) live in the Vercel project. Add the `radpacking.com` domain in the project's Domains settings when ready to go live.

## Notes
- Money is stored as integer fils (1 AED = 100 fils).
- The chat engine lives in `src/lib/chat/knowledge.ts` (intents → answer, links, quick replies). Add or edit intents there.
- Rate limiting is in-memory per server instance. For hard limits add Vercel Firewall rules or a shared store.
