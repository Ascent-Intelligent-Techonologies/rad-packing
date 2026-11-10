# RAD Packing Solutions: website + CRM

Modern, mobile-first rebuild of [radpacking.com](https://www.radpacking.com) with a built-in back-office CRM.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · Tailwind CSS v4 · Prisma 7 + PostgreSQL (Prisma Postgres) · zod · lucide-react

## What's inside

### Public website (`/`)
- Home, About, Products & Solutions, Contact, Privacy Policy, Accessibility Statement. All copy comes from the current site.
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

1. Push this repo and import it in Vercel.
2. Add a **Prisma Postgres** database (Vercel → Storage / Marketplace) and connect it to the project. `DATABASE_URL` is injected.
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
4. Deploy. The `vercel-build` script runs `prisma generate`, `prisma migrate deploy` and `next build`.
5. Add the `radpacking.com` domain when ready to go live.

## Notes
- Money is stored as integer fils (1 AED = 100 fils).
- The chat engine lives in `src/lib/chat/knowledge.ts` (intents → answer, links, quick replies). Add or edit intents there.
- Rate limiting is in-memory per server instance. For hard limits add Vercel Firewall rules or a shared store.
