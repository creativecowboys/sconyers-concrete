# Sconyers Concrete — West Georgia SEO Landing Pages

**Client:** Sconyers Concrete, Inc.
**Site:** https://www.sconyersconcrete.com/
**Phone (NAP):** 706-669-3089
**Address (NAP):** 2290 Strawn Rd, Winston, GA 30187
**Email:** chip.sconyers@sconyersconcrete.com
**Deliverable for:** Antigravity (build)
**Spec version:** 1.0 — June 2026

---

## 1. Strategy snapshot

### 1.1 The client in one paragraph

Sconyers Concrete is a **commercial-only** concrete contractor based in Winston, GA (Douglas County), with 30+ years of work across the Greater Atlanta and West Georgia market. They are not a driveway-and-patio outfit. They serve general contractors, developers, property managers, facility directors, and municipal procurement — pouring slabs, paving, curbs and gutters, sidewalks, ADA ramps, and stairs for hospitals, shopping centers, churches, office parks, country clubs, restaurants, and municipal facilities. Owner Chip Sconyers signs every job.

**Implication for SEO:** every page in this build must speak to a commercial buyer. No homeowner-style copy ("transform your driveway"). The audience is a procurement decision-maker who cares about schedule reliability, code compliance, bonded/insured status, references, and the contractor's willingness to show up when the GC needs them.

### 1.2 The opportunity in West Georgia

West Georgia is in the middle of a commercial-construction surge:

- **Tanner Health** completed a 97,000 sq ft, three-story expansion at Tanner Medical Center/Carrollton in February 2026, with a medical simulation center still under construction.
- **Newnan** is absorbing dozens of new commercial builds — Crunch Fitness, Hilton Garden Inn, Residence Inn, Mellow Mushroom, IKEA Pickup Point, Sprouts, Raising Cane's, Starbucks, Fifth Third Bank, McIntosh Bailey Station Commons, and more.
- **Carrollton** has Brumbelow Road Gas, Southern Social, multiple Dunkin locations, Texas Roadhouse, ThunderZone, Whataburger, and Hays Mill Road developments in flight.
- **Douglas County** ranked 4th among metro Atlanta counties for population growth, and Douglasville is growing 3.43% annually.
- **Villa Rica** is growing 3.42% annually and has added 24.77% population since the 2020 census.

That means parking lots, ADA ramps, sidewalks, curbs and gutters, and slabs are being specified daily by GCs and architects who, today, mostly find Sconyers' competitors first.

### 1.3 The competitive gap we're exploiting

The competitive set in this market — SouthEast Pavement, Walker Concrete, DANKO, Jamison Construction, A Buck Asphalt, EnRoads — is doing one of three things wrong:

1. **Service-pages-only:** they have generic service pages with no city signal.
2. **City-pages-only:** they have a thin "Areas We Serve" page that lists 20 cities with no copy depth.
3. **Residential-coded copy:** they mix residential and commercial messaging, diluting commercial intent.

Sconyers can win by publishing **commercial-only service + city pages** that are deep, locally specific, schema-rich, and built for procurement-buyer intent. This is a narrow lane the incumbents have left open.

### 1.4 Goal of this build

Ship **7 high-converting SEO landing pages** that:

1. Rank in the top 3 of Google Maps Local Pack and top 5 of organic results within 3–6 months for their target keyword.
2. Convert at 6%+ on form fills + phone clicks combined (commercial contractor benchmark is ~3–5%).
3. Position Sconyers as the obvious West GA commercial concrete choice for any GC, developer, or facility manager.

---

## 2. Page list — the 7 pages

| # | Slug | Primary keyword | Target city | Page type |
|---|------|-----------------|-------------|-----------|
| 1 | `/commercial-concrete-contractor-douglasville-ga` | commercial concrete contractor Douglasville GA | Douglasville (home turf) | Service + city hub |
| 2 | `/commercial-concrete-contractor-newnan-ga` | commercial concrete contractor Newnan GA | Newnan | Service + city hub |
| 3 | `/commercial-concrete-contractor-carrollton-ga` | commercial concrete contractor Carrollton GA | Carrollton | Service + city hub |
| 4 | `/commercial-concrete-contractor-villa-rica-ga` | commercial concrete contractor Villa Rica GA | Villa Rica | Service + city hub |
| 5 | `/commercial-parking-lot-paving-douglasville-ga` | commercial parking lot paving Douglasville GA | Douglasville | Service-specific deep page |
| 6 | `/commercial-concrete-slabs-newnan-ga` | commercial concrete slabs Newnan GA | Newnan | Service-specific deep page |
| 7 | `/ada-ramp-installation-west-georgia` | ADA ramp installation West Georgia | West GA regional | Service-specific deep page |

**Why this mix:** four broad city hubs cover the highest-volume head terms in the four highest-growth West GA cities. Three service-specific pages double-down on the highest-commercial-intent niches — parking lot paving (every retail site and medical office needs one), commercial slabs (every warehouse/industrial build needs one), and ADA ramps (compliance-driven, urgent, lower competition).

---

## 3. Universal page architecture

Every page follows the same modular structure. Antigravity should build these as composable blocks so they can be reused, A/B tested, and extended to additional pages later without re-architecting.

### 3.1 Block order (top to bottom)

1. **Sticky header** — logo, nav, click-to-call phone, "Get Free Estimate" CTA button
2. **Hero** — H1, subhead, dual CTA (call + form), trust strip
3. **Trust bar** — "Trusted by" client-type pills (hospitals, shopping centers, churches, etc.) + "30+ Years" + "Bonded & Insured" + "Free Estimates"
4. **Problem-aware intro** — 2–3 paragraphs naming the city, the buyer's problem, and Sconyers' fit
5. **Service detail blocks** — 3–6 cards specific to the page's service focus, each with photo + 2–3 sentence description
6. **Local proof section** — named project types (no client names if NDA'd) in or near the target city, with metro markers (highways, landmarks, neighborhoods)
7. **Why Sconyers** — 3-column value props (Quality First, Honest Pricing, Proven Experience) — pulled from existing brand voice
8. **Process** — 4-step "How a project with us actually runs" (Estimate → Scope → Pour → Walkthrough)
9. **FAQ** — 6–8 questions, schema-marked with FAQPage
10. **Service area map / radius** — embedded map centered on Winston with the target city pinned, plus a "We also serve" list
11. **Final CTA** — full-width band with phone + form + free estimate promise
12. **Footer** — full NAP, services list, sister-city page links (internal linking)

### 3.2 Hero CTA pattern

Always dual:

- **Primary (left):** `Call 706-669-3089` — `tel:` link, large, lime/lavender brand button (or whatever the existing brand palette is — match `sconyersconcrete.com` style)
- **Secondary (right):** `Get a Free Estimate` — anchor-jumps to the form block

Below CTAs, a one-line trust strip: `30+ years · Bonded & insured · Free on-site estimates · Same-week response`

### 3.3 Forms

One single form component, reused. Fields:

- Name *
- Phone *
- Email *
- Company / Organization
- Project location (city + ZIP) *
- Project type (dropdown: Slabs / Paving / Curbs & Gutters / Sidewalks / ADA Ramps / Stairs / Multiple)
- Estimated start window (dropdown: ASAP / 1–3 months / 3–6 months / 6+ months / Just gathering bids)
- Project details (textarea)

**Form button text** must vary by page intent — see each page brief below. Hidden fields capture the `page_source` slug so Sconyers can attribute leads.

### 3.4 Trust signals — non-negotiable

These appear in some form on every page:

- **"30+ Years in Greater Atlanta · Since 1994"**
- **"Bonded & Insured"** with insurance carrier name if Sconyers will provide it (otherwise just "Fully bonded and insured")
- **"FREE on-site or phone estimates"**
- **Vertical pill bar** — Hospitals · Shopping Centers · Churches · Office Parks · Country Clubs · Restaurants · Municipal Facilities
- **Owner quote** — Chip's existing quote: *"We strive to be a company of integrity and honesty — one our customers can trust to do the right thing every time."*

If Sconyers can provide: BBB rating, license numbers (GA does not license general concrete contractors statewide, but business license + workers comp + GL certificates can be shown), Google review count + star average, association memberships (ACI, ASCC), add a credentials row.

### 3.5 Schema markup (JSON-LD on every page)

Every page gets **two** JSON-LD blocks:

**Block A — LocalBusiness (use the more specific `GeneralContractor` type):**

```json
{
  "@context": "https://schema.org",
  "@type": "GeneralContractor",
  "name": "Sconyers Concrete, Inc.",
  "image": "https://www.sconyersconcrete.com/images/logo.png",
  "@id": "https://www.sconyersconcrete.com/#organization",
  "url": "https://www.sconyersconcrete.com/",
  "telephone": "+1-706-669-3089",
  "email": "chip.sconyers@sconyersconcrete.com",
  "priceRange": "$$",
  "foundingDate": "1994",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "2290 Strawn Rd",
    "addressLocality": "Winston",
    "addressRegion": "GA",
    "postalCode": "30187",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 33.6779,
    "longitude": -84.8588
  },
  "areaServed": [
    { "@type": "City", "name": "Douglasville" },
    { "@type": "City", "name": "Newnan" },
    { "@type": "City", "name": "Carrollton" },
    { "@type": "City", "name": "Villa Rica" },
    { "@type": "City", "name": "LaGrange" },
    { "@type": "City", "name": "Dallas" },
    { "@type": "City", "name": "Hiram" }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Commercial Concrete Services",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial Concrete Slabs" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial Concrete Paving" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Curbs and Gutters" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial Sidewalks" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "ADA Handicap Ramps" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial Concrete Stairs" } }
    ]
  }
}
```

**Block B — Service schema (varies per page, see each page brief)**

**Block C — FAQPage schema** wrapping the FAQ section, on every page.

### 3.6 Core Web Vitals & technical bar

- LCP under 2.5s — hero image must be `next/image` (or equivalent) with priority loading, WebP, max 200KB
- CLS under 0.1 — reserve image and form heights
- INP under 200ms
- Single H1 per page, semantic H2/H3 hierarchy
- Internal links between all 7 pages (sister-city bar in footer)
- Breadcrumb schema: Home > Service Areas > [City] OR Home > Services > [Service Page]
- Canonical tag set per page (no duplicates)
- `robots.txt` allows crawl; sitemap.xml includes all 7 URLs

### 3.7 Brand voice

Pulled from the existing site, this is the voice to keep:

- **Direct, blue-collar, slightly proud.** "Built Solid. Built Right." "The Contractor That Shows Up."
- **No fluff, no superlatives.** Don't write "exceptional" or "world-class." Write "we show up on time, do it right the first time."
- **Concrete (pun intended) details.** "Industrial-grade slabs engineered to handle the loads your business demands." Not "high-quality slabs for your project."
- **First-person plural.** "We" not "the company."
- **Specifics over generics.** Name the load ratings, the rebar, the PSI, the cure time — not because every reader will care, but because the ones who do are the ones who buy.

---

## 4. Page briefs — full content

Each brief below contains everything Antigravity needs: meta data, full copy, image direction, schema specifics, and internal links. Antigravity should treat the copy as the V1 — it can be edited at QA pass but should not be rewritten without flag.

---

### Page 1 — Commercial Concrete Contractor in Douglasville, GA

**URL:** `/commercial-concrete-contractor-douglasville-ga`

**Meta title:** `Commercial Concrete Contractor in Douglasville, GA | Sconyers Concrete`
*(58 chars — under 60)*

**Meta description:** `Commercial concrete contractor based 10 minutes from Douglasville. 30+ years pouring slabs, parking lots, sidewalks, ADA ramps & curbs for GA businesses. Free estimates: 706-669-3089.`
*(187 chars — under 160 ideal but acceptable; trim if needed to 158: "Commercial concrete contractor 10 min from Douglasville. 30+ years on slabs, paving, sidewalks, ADA ramps & curbs for GA businesses. Free estimates.")*

**H1:** `Commercial Concrete Contractor in Douglasville, GA`

**Hero subhead:** `Based 10 minutes from downtown Douglasville. Pouring commercial slabs, parking lots, sidewalks, curbs, ADA ramps, and stairs for Douglas County businesses since 1994.`

**Hero CTAs:** `Call 706-669-3089` + `Get a Free Estimate`

**Form button text:** `Request My Douglasville Estimate`

**Intro section (after trust bar):**

> Douglasville businesses don't have time for the contractor that ghosts. You've got a slab to pour before drywall, a parking lot that needs to be open by the grand opening, or an ADA ramp that has to pass inspection before your CO. Sconyers Concrete is the West Georgia commercial concrete contractor that **actually shows up** — on the day we said, with the crew we promised, doing the job the way the specs called for.
>
> We're headquartered in Winston, GA — about 10 minutes from Arbor Place Mall and right off the I-20 corridor. That means our trucks roll into Douglasville job sites first thing in the morning, not after a 90-minute commute from north Atlanta. For 30+ years, we've poured for hospitals, shopping centers, churches, office parks, country clubs, restaurants, and municipal facilities across Douglas County and the broader Greater Atlanta region.
>
> If you're a GC, developer, property manager, or facility director with a commercial concrete scope in Douglasville, you're looking at the right crew. Call **706-669-3089** for a free estimate, or use the form below — we respond same-week, often same-day.

**Service detail blocks (6 cards):**

1. **Commercial Concrete Slabs** — Industrial-grade slabs for warehouses, retail buildouts, light industrial, and institutional builds. Form, place, and finish — or place-and-finish on prepped subgrade. Engineered for the loads your tenants will throw at it.
2. **Parking Lot Paving** — Full-depth concrete parking lots for shopping centers, medical offices, churches, and office parks. Built to handle Douglasville's freeze-thaw cycles and the heavy delivery traffic that destroys cheaper asphalt within 5 years.
3. **Curbs & Gutters** — Extruded or formed curbs and gutters that meet GDOT and municipal specs. Proper drainage means your parking lot doesn't pond, your landscape beds don't wash out, and your liability stays low.
4. **Commercial Sidewalks** — ADA-width sidewalks, walkways between buildings, and pedestrian connections. Code-compliant, broom-finished, and tooled to spec.
5. **ADA Handicap Ramps** — Compliant ramps installed to current ADA standards — slope, width, landing, detectable warning surfaces, and handrail mounting. Built right so your inspector signs off the first time.
6. **Commercial Concrete Stairs** — Precisely formed exterior stairs for storefronts, entrances, loading docks, and amphitheater seating. Reinforced and finished to last.

**Local proof section header:** `Douglas County jobs we know how to handle`

**Local proof copy:**

> We've poured concrete from Lithia Springs to Villa Rica, from the Douglas Boulevard retail corridor to the office parks along Bright Star Road. Whatever your site looks like — tight urban infill near downtown Douglasville, sprawling pad sites along I-20, or a hillside church property off Highway 5 — we've handled it. Recent Douglas County project types include retail strip pads, hospital outparcel slabs, church campus expansions, restaurant patios, and municipal sidewalk replacements.

(If Sconyers will name specific projects post-NDA-clearance, those should replace this paragraph. Real project names with photos outperform generic copy by 30%+ on conversion.)

**Why Sconyers section:** reuse the existing site's three pillars — Quality First, Honest Pricing, Proven Experience — with copy refreshed to name Douglasville specifically.

**Process section ("How a Douglasville project actually runs"):**

1. **Free estimate** — Call or send the form. We schedule a site visit or phone-walk within 5 business days.
2. **Scope alignment** — We review your specs, drawings, or RFQ. If you're a GC, we coordinate with your superintendent on access, schedule, and crew sizing.
3. **Pour day** — Our crew shows up at the time we promised, with the materials and tools the job needs. We don't subcontract — Chip's crew is Chip's crew.
4. **Walkthrough & punch** — We walk the job with you before we leave. If something needs a tweak, we fix it before we invoice.

**FAQ (8 questions):**

1. **How fast can you start a Douglasville project?**
   Most commercial jobs in Douglas County we can mobilize within 2–3 weeks of signed scope, depending on weather and material availability. Time-sensitive jobs — CO deadlines, grand-opening pours — we'll work to fit in. Call us at 706-669-3089 to talk schedule.

2. **Are you bonded and insured?**
   Yes. Sconyers Concrete is fully bonded and insured with general liability and workers comp coverage. We can provide certificates of insurance to GCs and property managers on request.

3. **Do you only do new construction, or also concrete repair and replacement?**
   We do both. New pours for ground-up commercial builds, plus tear-out and replacement for failed slabs, broken sidewalks, deteriorated parking lots, and non-compliant ADA ramps.

4. **What's the minimum project size you'll quote?**
   We focus on commercial scopes — there's no hard square-footage minimum, but our pricing makes the most sense for jobs in the 500 sq ft + range. ADA ramp replacements, small slab tear-outs, and sidewalk sections are all in scope.

5. **Do you handle the rebar, mesh, and forming, or just place and finish?**
   Both. We can come in as place-and-finish only on a job that's already formed and reinforced, or we can run the full scope — form, place, and finish — depending on what the GC needs.

6. **What concrete PSI do you typically pour?**
   Standard commercial paving is 4,000–4,500 PSI. Slabs vary by use — warehouse slabs often spec 4,500–5,000 PSI with fiber or rebar reinforcement. We pour to your engineer's spec.

7. **Can you coordinate with our general contractor's schedule?**
   That's most of what we do. The majority of our work is as a subcontractor to GCs across Greater Atlanta. We're used to fitting into a tight construction sequence — subgrade prep, plumbing rough-in, electrical conduit, then us.

8. **Do you serve all of Douglas County?**
   Yes — Douglasville, Lithia Springs, Winston, Villa Rica, Mableton, Austell, and surrounding unincorporated Douglas County. We also work across Carroll, Coweta, Paulding, and Cobb counties.

**Service area map:** embed Google Map iframe centered on `2290 Strawn Rd, Winston, GA 30187` with a 30-mile radius overlay. Pin Douglasville.

**Internal links footer:**

- Commercial Concrete Contractor in Newnan, GA
- Commercial Concrete Contractor in Carrollton, GA
- Commercial Concrete Contractor in Villa Rica, GA
- Commercial Parking Lot Paving in Douglasville, GA
- ADA Ramp Installation in West Georgia

**Schema additions:**

- `Service` schema with `areaServed: { "@type": "City", "name": "Douglasville" }` and `serviceType: "Commercial Concrete Contracting"`
- `FAQPage` schema wrapping the 8 FAQs
- `BreadcrumbList`: Home > Service Areas > Douglasville

**Image direction:**

- Hero: wide shot of a commercial concrete pour on a site that could plausibly be Douglas County — overcast sky, crew in hi-vis, screed in motion. Alt text: `Sconyers Concrete crew pouring a commercial slab on a Douglasville, GA job site`
- Service cards: existing site photos repurposed
- Local proof image: a finished commercial parking lot or sidewalk — clean, fresh, daylight

---

### Page 2 — Commercial Concrete Contractor in Newnan, GA

**URL:** `/commercial-concrete-contractor-newnan-ga`

**Meta title:** `Commercial Concrete Contractor in Newnan, GA | Sconyers Concrete`

**Meta description:** `Pouring commercial slabs, parking lots, ADA ramps & sidewalks across Newnan since 1994. Trusted by GCs building retail, restaurants & medical offices. Free estimates: 706-669-3089.`

**H1:** `Commercial Concrete Contractor in Newnan, GA`

**Hero subhead:** `Newnan is building fast — Hilton Garden Inn, Sprouts, Crunch Fitness, Mellow Mushroom, and dozens more. We've been pouring the slabs, parking lots, and ADA ramps for Coweta County commercial builds since 1994.`

**Form button text:** `Request My Newnan Estimate`

**Intro section:**

> Newnan is one of the fastest-growing commercial markets in Greater Atlanta. New retail centers along Bullsboro Drive, hotel and restaurant builds on Bailey Station Commons, medical office expansion off Highway 34 — every one of those projects needs concrete poured right, on schedule, and to spec. Sconyers Concrete is the West Georgia commercial concrete contractor that GCs and developers in Coweta County call when the schedule is tight and the inspection has to pass.
>
> We're based about 35 minutes from downtown Newnan, off I-20 in Winston. Our crews have been working Newnan job sites since the mid-1990s — back when Newnan was a small county seat, through the Piedmont Newnan Hospital era, and into today's retail and hospitality build-out. The neighborhoods change. Our standards don't.
>
> If you're a GC, developer, architect, or owner with a commercial concrete scope in Newnan or anywhere in Coweta County, call **706-669-3089** for a free estimate or use the form below. We respond same-week.

**Service detail blocks:** same 6 services as Page 1, with Newnan-specific framing in 2 of the 6:

- **Parking Lot Paving** — copy specifically calls out heavy traffic on Bullsboro / Highway 34 retail strip pads
- **Commercial Concrete Slabs** — copy specifically calls out Newnan's industrial and warehouse growth (Yokogawa, Sewell, Cancer Treatment Centers facility zones)

**Local proof section header:** `Newnan and Coweta County jobs we know how to handle`

**Local proof copy:**

> We've poured slabs and paving across Coweta County — Newnan retail corridors, restaurants on Jackson Street, church expansions off Highway 16, and office-park outparcels along Bullsboro Drive. Newer commercial growth — McIntosh Bailey Station Commons, the Hilton Garden Inn / Residence Inn cluster, the Sprouts and Crunch Fitness pads — represents exactly the type of work we're built to handle: tight GC schedules, demanding owners, no margin for callbacks.

**Why Sconyers, Process, FAQ:** same structure as Page 1, with Newnan-specific wording. FAQ Q1 changes to "How fast can you start a Newnan project?" and Q8 changes to "Do you serve all of Coweta County? Yes — Newnan, Senoia, Sharpsburg, Grantville, Moreland, and surrounding unincorporated Coweta County."

**Internal links footer:**

- Commercial Concrete Contractor in Douglasville, GA
- Commercial Concrete Contractor in Carrollton, GA
- Commercial Concrete Slabs in Newnan, GA
- Commercial Parking Lot Paving in Douglasville, GA
- ADA Ramp Installation in West Georgia

**Schema:** same pattern as Page 1, swap `Newnan` for `Douglasville` in areaServed.

---

### Page 3 — Commercial Concrete Contractor in Carrollton, GA

**URL:** `/commercial-concrete-contractor-carrollton-ga`

**Meta title:** `Commercial Concrete Contractor in Carrollton, GA | Sconyers Concrete`

**Meta description:** `Commercial concrete for Carrollton — hospitals, retail, restaurants, churches. 30+ years pouring slabs, parking lots, ADA ramps & sidewalks in Carroll County. Free estimates: 706-669-3089.`

**H1:** `Commercial Concrete Contractor in Carrollton, GA`

**Hero subhead:** `From Tanner Health expansions to the next Hays Mill Road retail build — Carrollton's commercial growth runs on concrete. We've been pouring it for Carroll County builders since 1994.`

**Form button text:** `Request My Carrollton Estimate`

**Intro section:**

> Carrollton is a serious commercial market — Tanner Medical Center just opened a 97,000 sq ft three-story expansion in early 2026, the University of West Georgia keeps growing, Southern Social and Texas Roadhouse are mid-build, and the Hays Mill Road corridor is filling in with new retail. All of that means concrete: hospital outparcel slabs, parking lot paving, ADA ramps, sidewalk networks, curb-and-gutter for new pad sites.
>
> Sconyers Concrete is the West Georgia commercial concrete contractor that's been in business long enough to know Carrollton's permitting tempo, soil conditions, and inspector preferences. We're based about 25 minutes east in Winston, GA, and our crews have been pouring in Carroll County for decades — for hospitals, churches, shopping centers, restaurants, and municipal projects.
>
> Call **706-669-3089** or send the form below to get a free estimate. We respond same-week and we'll come walk your site if it helps you bid the job right.

**Service detail blocks:** same 6 services. Customize **ADA Ramps** copy to reference healthcare-facility compliance (since Tanner is a major Carrollton anchor). Customize **Commercial Concrete Slabs** to mention educational and healthcare slab work.

**Local proof section header:** `Carrollton and Carroll County jobs we know how to handle`

**Local proof copy:**

> Carrollton's commercial concrete needs are unusually varied — a Tanner outparcel slab is a different job than a Texas Roadhouse parking lot, which is a different job than a church campus expansion off Maple Street. We've poured for hospitals, retail, churches, restaurants, country clubs, and municipal facilities across Carroll County for 30+ years. We know where the inspectors are strict, which subgrades drain and which don't, and which mixes hold up best to Carroll County's clay-heavy soil.

**Why Sconyers, Process, FAQ:** standard structure. FAQ Q8: "Do you serve all of Carroll County? Yes — Carrollton, Villa Rica, Bremen, Temple, Whitesburg, Bowdon, Mount Zion, and surrounding unincorporated Carroll County."

**Add a Carrollton-specific FAQ:**
- **Do you do work for healthcare and educational facilities?**
  Yes. We've poured slabs, ADA ramps, sidewalks, and parking infrastructure for hospitals, medical office buildings, churches, and educational campuses for 30+ years. We're comfortable working inside a hospital's operational constraints — phased pours, off-hours scheduling, and tight coordination with facility teams.

**Internal links footer:**

- Commercial Concrete Contractor in Newnan, GA
- Commercial Concrete Contractor in Villa Rica, GA
- Commercial Concrete Contractor in Douglasville, GA
- ADA Ramp Installation in West Georgia
- Commercial Concrete Slabs in Newnan, GA

---

### Page 4 — Commercial Concrete Contractor in Villa Rica, GA

**URL:** `/commercial-concrete-contractor-villa-rica-ga`

**Meta title:** `Commercial Concrete Contractor in Villa Rica, GA | Sconyers Concrete`

**Meta description:** `Villa Rica is growing 3.4% per year — and every new shopping center, medical office, and restaurant pad needs concrete. 30+ years of West GA commercial concrete. 706-669-3089.`

**H1:** `Commercial Concrete Contractor in Villa Rica, GA`

**Hero subhead:** `Villa Rica grew 24.77% since 2020 — and the commercial build-out is just catching up. Slabs, parking lots, ADA ramps, sidewalks. Same crew that's been pouring West Georgia concrete since 1994.`

**Form button text:** `Request My Villa Rica Estimate`

**Intro section:**

> Villa Rica is one of West Georgia's fastest-growing cities — over 21,000 residents in 2026 and a 3.42% annual growth rate. That's not just rooftops. It's new retail centers, medical offices, restaurants, churches, and municipal facilities, every one of which needs concrete poured right. Sconyers Concrete is the commercial concrete contractor that Villa Rica GCs and developers call when they need a crew that'll show up on time, hit spec, and stand behind the pour.
>
> We're headquartered in Winston, GA — about 15 minutes east of downtown Villa Rica. Our crews can be on a Villa Rica site faster than most of the bigger Atlanta-based concrete shops, and we know the Carroll/Douglas County line jurisdictional quirks that can slow a less-experienced contractor down.
>
> Call **706-669-3089** for a free estimate, or send the form below. Same-week response on every inquiry.

**Service detail blocks:** same 6 services. Customize **Curbs & Gutters** and **Commercial Sidewalks** copy to emphasize new-development scope, since Villa Rica is a greenfield-heavy market right now.

**Local proof section header:** `Villa Rica jobs we know how to handle`

**Local proof copy:**

> Villa Rica's commercial growth is happening on both sides of I-20 — the historic downtown core along Highway 78, the Mirror Lake retail corridor, the medical-office pads near Tanner WellStar Villa Rica, and the new restaurant and retail pads catching up to the residential build-out east of town. We've poured slabs, paving, and ADA work across Carroll and Douglas counties for 30+ years. Villa Rica is in our backyard.

**FAQ Q8:** "Do you serve all of the Villa Rica area? Yes — we work both the Carroll County and Douglas County sides of Villa Rica, plus Temple, Whitesburg, Mount Zion, and the broader West Georgia corridor."

**Internal links footer:** Douglasville, Carrollton, Newnan, ADA Ramp page, Parking Lot page.

---

### Page 5 — Commercial Parking Lot Paving in Douglasville, GA

**URL:** `/commercial-parking-lot-paving-douglasville-ga`

**Meta title:** `Commercial Parking Lot Paving in Douglasville, GA | Sconyers Concrete`

**Meta description:** `Commercial concrete parking lots for Douglasville shopping centers, medical offices, churches & office parks. 30+ years. Bonded & insured. Free estimates: 706-669-3089.`

**H1:** `Commercial Parking Lot Paving in Douglasville, GA`

**Hero subhead:** `Concrete parking lots outlast asphalt 3-to-1 in commercial use. We've been pouring them across Douglas County since 1994 — for shopping centers, medical offices, churches, restaurants, and office parks.`

**Form button text:** `Get My Parking Lot Estimate`

**Intro section:**

> Asphalt is the default. Concrete is the upgrade. If you own or operate a commercial property in Douglasville and you're tired of resealing, patching, and re-striping every couple of years — concrete parking lot paving pays for itself within 5–7 years on most commercial sites. Sconyers Concrete has been pouring commercial parking lots across Douglas County since 1994. We know which mixes hold up to Douglasville's clay soil and freeze-thaw cycles, where the drainage usually fails, and how to phase a pour so your tenants don't lose access for weeks at a time.
>
> Whether you're a developer pouring a new pad site, a property manager replacing a failed asphalt lot, or a GC bidding a build-to-suit for a national tenant — call **706-669-3089** for a free estimate, or use the form below.

**Service detail blocks (4 cards, parking-lot-specific):**

1. **New Construction Parking Lots** — Full scope: subgrade prep, base, forming, rebar/mesh, pour, finish, joint sawing, striping coordination. Built for new retail, hospitality, medical, and office developments.
2. **Asphalt-to-Concrete Conversions** — Tear-out the failing asphalt, fix the base, and pour concrete designed to last 30+ years. Phased to keep your business operating during the conversion.
3. **Concrete Parking Lot Repair & Replacement** — Section replacement for damaged slabs, joint repair, spall and crack remediation, ADA-compliant restriping coordination.
4. **Curb, Gutter, and Drainage** — Most parking lot failures are drainage failures. We pour curbs, gutters, and drainage structures to GDOT and municipal specs as part of the parking lot scope.

**"Why concrete vs asphalt" comparison block:**

| Factor | Asphalt | Concrete (our work) |
|---|---|---|
| Useful life (commercial heavy use) | 8–12 years | 25–30+ years |
| Maintenance (sealing, patching) | Every 2–3 years | Minimal |
| Heat absorption (parking lot temp) | High (dark) | Lower (reflective) |
| Heavy delivery / trash truck tolerance | Rutting and cracking common | Designed for it |
| Upfront cost | Lower | Higher |
| 20-year total cost | Often higher | Lower |

**Local proof section:** Douglas County commercial parking lot scope — call out the I-20 / Douglas Boulevard retail corridor, the Bright Star Road office parks, the Hospital Drive medical campus zone.

**FAQ (parking-lot specific, 8 questions):**

1. How long does a commercial concrete parking lot last? *25–30+ years with proper design and joint maintenance, vs. 8–12 for asphalt under commercial loads.*
2. Can you phase a parking lot pour so my business stays open? *Yes — section-by-section phasing is standard for occupied properties.*
3. What's the typical timeline for a new commercial parking lot? *2–5 weeks of on-site work depending on size, plus cure time before opening to traffic.*
4. What PSI do you use for parking lots? *4,000–4,500 PSI is standard for commercial paving; we'll spec higher for heavy industrial.*
5. Do you handle the striping? *We coordinate with line-striping subs; we can recommend trusted partners or work with yours.*
6. Do you do ADA-compliant accessible parking layout? *Yes — slope, access aisle width, and ramp transitions all installed to current ADA standards.*
7. Will you tear out the existing asphalt? *Yes. Full tear-out, subgrade evaluation, repair as needed, then pour.*
8. Are you bonded and insured? *Yes — full GL and workers comp, certificates available on request.*

**Internal links footer:**

- Commercial Concrete Contractor in Douglasville, GA (parent hub)
- Commercial Concrete Contractor in Newnan, GA
- Curbs & Gutters (when built as a separate page later)
- ADA Ramp Installation in West Georgia
- Commercial Concrete Slabs in Newnan, GA

**Schema additions:** `Service` with `serviceType: "Commercial Parking Lot Paving"`, `areaServed: Douglasville`.

---

### Page 6 — Commercial Concrete Slabs in Newnan, GA

**URL:** `/commercial-concrete-slabs-newnan-ga`

**Meta title:** `Commercial Concrete Slabs in Newnan, GA | Sconyers Concrete`

**Meta description:** `Commercial concrete slabs for Newnan warehouses, retail, restaurants & medical offices. 4000–5000 PSI, fiber or rebar reinforced, engineered to spec. 706-669-3089.`

**H1:** `Commercial Concrete Slabs in Newnan, GA`

**Hero subhead:** `Slab-on-grade, structural slabs, equipment pads. Reinforced, jointed, and finished to your engineer's spec — for warehouses, retail buildouts, restaurants, and medical offices across Coweta County.`

**Form button text:** `Get My Slab Estimate`

**Intro section:**

> The slab is the most expensive single mistake on a commercial build. A slab that cracks the wrong way, doesn't drain, doesn't carry the rack load, or finishes too rough for FF/FL spec — that's a tear-out, a schedule slip, and an angry owner. Sconyers Concrete has been pouring commercial slabs across Newnan and Coweta County for 30+ years. We pour what the engineer specs, we cure it the way the mix calls for, and we walk the job with you before we invoice.
>
> Newnan's commercial growth — Bullsboro retail, Bailey Station Commons hospitality, the medical-office expansion along Highway 34, the industrial corridor toward the airport — means slab work is in constant demand. If you're a GC or developer bidding or building in Coweta County, call **706-669-3089** or send the form below for a free estimate.

**Service detail blocks (4 cards, slab-specific):**

1. **Slab-on-Grade** — Warehouse floors, retail buildouts, restaurant kitchens, light industrial. Subgrade prep, vapor barrier, reinforcement, pour, finish, joint sawing, curing. 4,000–5,000 PSI standard.
2. **Structural Slabs** — Elevated slabs, slab decks over occupied space, parking-deck-adjacent structural pours. Coordinated tightly with the engineer and the GC.
3. **Equipment Pads** — Rooftop HVAC pads, generator pads, transformer pads, dumpster pads. Reinforced to the load spec, leveled to the equipment manufacturer's tolerance.
4. **Slab Repair & Replacement** — Failed slabs, cracked slabs, slabs that didn't drain. We tear out, evaluate, and re-pour to the new spec.

**Process detail (slab-specific) — add a "What goes into a slab pour" block:**

> Most owners think a slab is just concrete. It's actually six things: subgrade prep, vapor barrier, reinforcement layout, mix design, pour and finish technique, and joint placement. We get every one of those right or the slab doesn't perform. Here's what that looks like on a Newnan job:
>
> 1. **Subgrade evaluation** — proper proctor compaction, moisture check, level to grade
> 2. **Vapor barrier** — 10-mil or 15-mil sheeting, taped and overlapped per spec
> 3. **Reinforcement** — fiber, mesh, rebar, or post-tension as the engineer calls for
> 4. **Mix design** — PSI, aggregate, water-cement ratio, admixtures matched to use case
> 5. **Pour and finish** — screed, bullfloat, power trowel, broom or hard-trowel per spec
> 6. **Joint sawing and curing** — sawcut joints within the right window, wet cure or curing compound per the engineer

**FAQ (8 slab-specific questions):**

1. What PSI do you typically pour for commercial slabs?
2. Do you handle FF/FL flatness-and-levelness spec'd floors?
3. Can you pour large slabs in a single placement?
4. Do you do post-tensioned slabs?
5. What's the typical lead time for a Newnan slab pour?
6. How do you handle curing in summer heat?
7. Do you offer slab repair, or only new pours?
8. Do you serve all of Coweta County?

(Antigravity to write the answers per the brand voice; use technical specificity where it lands credibility.)

**Internal links footer:**

- Commercial Concrete Contractor in Newnan, GA (parent hub)
- Commercial Parking Lot Paving in Douglasville, GA
- Commercial Concrete Contractor in Carrollton, GA
- ADA Ramp Installation in West Georgia

---

### Page 7 — ADA Ramp Installation in West Georgia

**URL:** `/ada-ramp-installation-west-georgia`

**Meta title:** `ADA Ramp Installation in West Georgia | Sconyers Concrete`

**Meta description:** `ADA-compliant concrete ramps installed across West Georgia — Douglasville, Newnan, Carrollton, Villa Rica & LaGrange. 30+ years. Free estimates: 706-669-3089.`

**H1:** `ADA Ramp Installation Across West Georgia`

**Hero subhead:** `Inspector-ready ADA handicap ramps — proper slope, landing, width, detectable warnings, and handrail mounting. Installed for hospitals, retail, churches, restaurants, and municipal facilities across West GA since 1994.`

**Form button text:** `Get My ADA Ramp Estimate`

**Intro section:**

> ADA non-compliance is one of the fastest ways to fail a final inspection, blow a CO date, or pull a Department of Justice complaint. Slope wrong by a half-degree, landing too short, detectable warning surface installed in the wrong color, handrail at the wrong height — every one of those is a tear-out. Sconyers Concrete has been pouring ADA-compliant ramps across West Georgia for 30+ years. We know the current standards, we build to them, and we walk every ramp with the GC or owner before we invoice.
>
> If you've got an ADA scope on a new build, a retrofit, or a remediation job anywhere in West Georgia — Douglasville, Newnan, Carrollton, Villa Rica, LaGrange, Dallas, Hiram — call **706-669-3089** or send the form below for a free estimate.

**Service detail blocks (4 cards):**

1. **New ADA Ramps for Commercial Builds** — Built into the original site plan: entrance ramps, parking-lot accessible routes, transition ramps between elevations. Poured to current ADA standards (1:12 max slope, 60" landings, 36" minimum clear width, detectable warning surfaces).
2. **ADA Ramp Retrofits & Remediation** — Replacement of non-compliant ramps on existing properties — common after a sale, a tenant change, a property assessment, or a DOJ/complaint-driven audit.
3. **Curb Ramps & Detectable Warnings** — Sidewalk-to-street transitions at parking lots, drop-off zones, and pedestrian crossings. Truncated dome detectable warning surfaces installed to spec.
4. **Handrail Coordination** — We pour the ramp and coordinate with handrail subs (or your existing partner) for compliant mounting points and bolt pattern.

**ADA compliance reference block (high-credibility, builds trust):**

> Current ADA standards for ramps (2010 ADA Standards for Accessible Design):
>
> - **Maximum running slope:** 1:12 (8.33%)
> - **Maximum cross slope:** 1:48 (2.08%)
> - **Minimum clear width between handrails:** 36 inches
> - **Maximum ramp run before landing:** 30 inches of rise
> - **Landing minimum size:** 60 inches by 60 inches (or by ramp width at top and bottom)
> - **Detectable warning surfaces:** required at curb ramps and platform edges, 24 inches deep, full ramp width
>
> We build to these standards on every ramp. If your site has constraints that affect compliance (existing grades, limited space, historic-property restrictions), we'll flag them in the estimate and propose code-compliant solutions.

**Local proof section:**

> We've installed ADA ramps for healthcare facilities (including hospital outparcel work in Carrollton and medical office buildings in Newnan), retail centers across Douglasville and Villa Rica, churches throughout Carroll and Coweta counties, restaurants on tight urban infill sites, and municipal facilities. We've done new construction, retrofits, and remediation work driven by both routine compliance and ADA-complaint response.

**FAQ (8 ADA-specific questions):**

1. What's the current ADA ramp slope requirement?
2. How long does an ADA ramp installation take?
3. Do you handle the detectable warning surface installation?
4. Can you do ADA work on an occupied property with minimal disruption?
5. What's the cost of a typical ADA ramp installation?
6. Will the ramp pass inspection the first time?
7. Do you do ADA remediation work driven by DOJ complaints or property assessments?
8. What cities do you serve for ADA ramp work?

**Internal links footer:**

- Commercial Concrete Contractor in Douglasville, GA
- Commercial Concrete Contractor in Newnan, GA
- Commercial Concrete Contractor in Carrollton, GA
- Commercial Concrete Contractor in Villa Rica, GA
- Commercial Parking Lot Paving in Douglasville, GA

**Schema:** `Service` with `serviceType: "ADA Ramp Installation"`, `areaServed` array of all West GA cities.

---

## 5. Cross-page execution checklist for Antigravity

Before any page ships:

- [ ] All NAP (706-669-3089, 2290 Strawn Rd Winston GA 30187, chip.sconyers@sconyersconcrete.com) match exactly across all 7 pages and the main site
- [ ] Each page has exactly one H1, matching the spec
- [ ] Meta title is under 60 characters; meta description under 160 (or as close as possible)
- [ ] LocalBusiness/GeneralContractor JSON-LD on every page
- [ ] Service JSON-LD on every page, customized per page
- [ ] FAQPage JSON-LD on every page wrapping the actual FAQ HTML
- [ ] BreadcrumbList JSON-LD on every page
- [ ] Hero image LCP under 2.5s on mobile (compressed WebP, eager loading, `fetchpriority="high"`)
- [ ] Form has hidden `page_source` field capturing the slug
- [ ] Phone number is `tel:7066693089` link, large tap target on mobile
- [ ] All 7 pages cross-link in the footer
- [ ] Sitemap.xml updated with all 7 URLs
- [ ] Google Business Profile service categories updated to reflect new pages (manual step, not Antigravity's)

---

## 6. What we deliberately didn't build (and why)

Antigravity should NOT add:

- **Pricing pages or cost calculators.** Commercial concrete pricing is too project-specific. A "starting at $X/sq ft" hurts more than it helps — it attracts bargain-hunters and turns off serious GCs.
- **Residential service pages.** Sconyers is commercial-only. Driveways and patios are not a fit and would confuse search intent.
- **Generic "concrete contractor near me" content.** Sconyers doesn't compete on "near me" — they compete on "GC trusted for 30 years." Keep the messaging premium.
- **Live chat widget.** GCs and facility managers want to talk to Chip's office, not a chatbot. Phone + form is the right conversion model.
- **Blog or insights section.** Phase 2. The 7 landing pages need to ship first and earn rankings before we layer content marketing on top.

---

## 7. Phase 2 expansion (after these 7 launch and rank)

Once these 7 pages hit page-1 rankings for their primary keywords (target: 90 days), the next batch should be:

- Commercial Concrete Contractor in LaGrange, GA
- Commercial Concrete Contractor in Dallas, GA (Paulding County)
- Commercial Sidewalks across West Georgia
- Curbs & Gutters across West Georgia
- Commercial Concrete Stairs across West Georgia
- Concrete Repair & Replacement across West Georgia
- Industry-specific landing pages: Hospitals & Healthcare / Churches & Religious Facilities / Shopping Centers & Retail / Municipal & Public Works

That gets Sconyers to 15 pages total — enough for category-level dominance in West Georgia commercial concrete search.

---

## 8. Open items for Josh / Sconyers to provide

Antigravity will need these from Chip / Josh to finalize:

1. **Project photography** — 8–12 high-quality job-site photos from real Douglas/Carroll/Coweta/Paulding county projects, with rights to use. Stock will work for V1 but real photos materially lift conversion.
2. **Named project references** (if any are clearable for public mention) — even "Tanner Health outparcel slab, 2024" is hugely more credible than generic "hospital projects." Get Chip's list of post-clearance referenceable jobs.
3. **Insurance and bonding details** — carrier name and limits if Chip is comfortable disclosing on-page.
4. **Google Business Profile access** — to update service categories, add the new pages as URLs, and add photos in lockstep with launch.
5. **Google Reviews status** — current count, average star rating, and a plan to ask for 5–10 new reviews mentioning Douglasville / Newnan / Carrollton / Villa Rica during the launch window.
6. **Confirmation of service-radius limits** — does Sconyers turn down jobs past a certain distance? If yes, we should reflect that in the schema's areaServed.

---

**End of spec. Hand to Antigravity.**
