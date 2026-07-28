# Sconyers Concrete, Inc. — Website

Website for Sconyers Concrete, Inc. — a full-service commercial concrete contractor
serving Greater Atlanta, GA since 1994.

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- Global CSS (`app/globals.css`) — the original hand-written stylesheet, not Tailwind
- `next/font` self-hosting Barlow Condensed + Lora (no Google Fonts requests)
- Resend for contact-form delivery
- Deployed on Vercel

## Local development

```bash
npm install
npm run dev
```

Runs on <http://localhost:3712>.

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | Sends estimate requests. Without it the forms return a "call us" error. |
| `CONTACT_TO_EMAIL` | no | Lead destination. Defaults to `chip.sconyers@sconyersconcrete.com`. |
| `CONTACT_FROM_EMAIL` | no | From address. **Its domain must be verified in Resend.** |

Set the same variables in the Vercel project settings.

## Routes

| Route | Source |
| --- | --- |
| `/` | `app/page.tsx` |
| `/contact` | `app/contact/page.tsx` |
| 7 West Georgia SEO landing pages | `app/[slug]/page.tsx` + `lib/landing/*` |
| `/api/contact` | `app/api/contact/route.ts` |
| `/sitemap.xml`, `/robots.txt` | `app/sitemap.ts`, `app/robots.ts` |

### Landing pages

All seven SEO pages share one template. Their copy lives as data in
`lib/landing/`, one file per page, typed by `lib/landing/types.ts`:

- `douglasville`, `newnan`, `carrollton`, `villa-rica` — city pages (6 service
  cards + a process block)
- `parking-lot-paving`, `concrete-slabs`, `ada-ramps` — service pages (4 service
  cards + one "feature band": a comparison table, step list, or compliance block)

`lib/landing/index.ts` is the single source of truth for which pages exist — it
drives the routes, `generateStaticParams`, and the sitemap. Adding a page means
adding a data file and registering it there.

Paragraph strings may contain `<strong>…</strong>`; `components/RichText.tsx`
renders that and nothing else, so content files can't inject markup.

JSON-LD (GeneralContractor, Service, FAQPage, BreadcrumbList) is generated in
`lib/schema.ts` from the same data.

## Business details

Shared NAP data lives in `lib/site.ts` — change it there, not in components.

- **Phone:** 706-669-3089
- **Email:** chip.sconyers@sconyersconcrete.com
- **Address:** 2290 Strawn Rd, Winston, GA 30187
- **Service area:** Greater Atlanta / West Georgia
