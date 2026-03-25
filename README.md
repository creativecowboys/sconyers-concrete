# Sconyers Concrete, Inc. — Website

Modern website for Sconyers Concrete, Inc. — a full-service commercial concrete contractor serving Greater Atlanta, GA since 1994.

## Stack

- Pure HTML/CSS/JS (no build step required)
- Google Fonts: Barlow Condensed + Lora
- Deployed via Vercel

## Local Development

```bash
# Any static file server works
npx serve .
# or
python3 -m http.server 3000
```

## Deployment

1. Push to GitHub
2. Import repo in Vercel — it will auto-detect as a static site
3. Deploy

## Contact Form

The contact form uses Netlify Forms attributes (`data-netlify="true"`) by default.  
To use Vercel, either:
- Use [Formspree](https://formspree.io) — replace `<form>` with `action="https://formspree.io/f/YOUR_ID"`
- Or use a serverless function in `/api/contact.js`

## Pages / Sections

- **Hero** — "Built Solid. Built Right." with call CTA
- **Trust Bar** — client industries
- **Services** — 6 commercial concrete services
- **About** — 30+ year history, mission, stats
- **Why Us** — 3 pillars: Quality, Pricing, Experience  
- **Contact** — form + phone/email/address
- **Footer**

## Client Info

- **Phone:** 706-669-3089
- **Email:** chip.sconyers@sconyersconcrete.com
- **Address:** 2290 Strawn Rd, Winston, GA 30187
- **Service Area:** Greater Atlanta, GA
