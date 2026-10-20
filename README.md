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
| `NEXT_PUBLIC_GA_ID` | no | Google Analytics 4 measurement ID (`G-…`). Production only — see [Analytics](#analytics). |

Set the same variables in the Vercel project settings.

## Analytics

Google Analytics 4, wired in `components/Analytics.tsx` (mounted once in
`app/layout.tsx`), `lib/analytics.ts` and `lib/analytics-rules.ts`.

- **Off until `NEXT_PUBLIC_GA_ID` is set.** The ID is baked in at build time, so
  set it in Vercel for **Production only** (previews and local dev then send
  nothing) and redeploy. With no ID the site loads no tag and sends nothing.
- **Never on the staff admin.** Nothing under `/admin` (sign-in, the magic-link
  callback, jobs, crews, docs, media) loads the tag. If someone moves from a
  public page into the admin in the same tab, GA's own opt-out switch
  (`window['ga-disable-<ID>']`, true on any `/admin` address) drops every hit.
- **Page views:** GA4's automatic `page_view`, including client-side navigation
  (Enhanced measurement → "Page changes based on browser history events").

| Event | Fires when | Parameters |
| --- | --- | --- |
| `generate_lead` | An estimate form is sent and `/api/contact` answers success. Never on the click, a failed send, or a bot caught by the honeypot. | `form_source`: `home`, `contact`, or the landing page slug |
| `click_to_call` | Any `tel:` link is clicked, anywhere on the public site | `link_location`, `page_path`, `phone_line` (`main` = 706-669-3089, `other` = any other number) |
| `click_email` | Any `mailto:` link is clicked | `link_location`, `page_path` |

`link_location` is worked out from where the link sits, so a phone link added
later is counted without touching it: `header`, `footer`, `hero`,
`contact_section` (the "Get in touch" block on home and landing pages),
`contact_details` and `contact_team` (contact page), `form_thanks` (the note
after a sent form), `cta_band` (landing page bands), otherwise the section's
`id` or class (e.g. `services`). Rules: `LOCATION_RULES` in
`lib/analytics-rules.ts`, tested in `tests/analytics.test.mts`.

**In GA4:** Admin → Events → mark `generate_lead` and `click_to_call` as key
events. To report on the parameters, register `form_source`, `link_location`,
`page_path` and `phone_line` as event-scoped custom dimensions (Admin → Custom
definitions). A click on a phone link means someone tapped it, not that a call
connected.

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
