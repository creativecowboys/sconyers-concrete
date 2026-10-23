// Unit test for the vendor-pitch screen as this site uses it. No network.
// Run: node scripts/test-pitch.mjs
//
// The messages are made up. The real-shaped ones copy the kind of thing
// Sconyers Concrete customers send; the pitches copy the SEO / web / marketing /
// loan offers that actually reach small-business forms (Oct 2026).

import test from "node:test";
import assert from "node:assert/strict";
import { screenPitch } from "../lib/pitch.ts";

const PROFILE = "default";
const screen = (message) => screenPitch([message], { profile: PROFILE });

const REAL = [
  "Looking for a quote on a 30x40 slab for a new shop building in Bowdon. Timeline is next month.",
  "We're a general contractor building a dental office in Villa Rica and need sidewalks, curb and gutter, and a dumpster pad. Can you bid?",
  "Driveway is cracked and sinking near the garage. Would like it torn out and repoured, about 600 sq ft.",
  "Commercial parking lot repair for our retail center. Please send someone to look at the trip hazards.",
  "Our marketing team is opening a new office and needs a stamped concrete patio for the break area.",
  "My neighbor recommended you. He said you replaced his roof in 2 days and insurance covered it.",
  "Your website says free estimates. Can I get one this week? Is this the right email for that?",
  "We're redesigning our backyard and need a concrete patio and fire pit pad.",
  "Our property management company handles 40 rentals and needs a long-term roofing vendor. Would you be interested in a partnership?",
  "Looking to get more customers into my store with a cleaner storefront. Need pressure washing monthly.",
  "We are hosting FireBible Sunday and want to increase your reach in our region. Please send materials.",
  "Our church would love to get you to speak at our missions conference this fall.",
  "We will help you get more churches in our section involved in FireBible Sunday.",
  "We would like to leave funding up to $10,000 in our will for translations.",
  "Name: Min-ji Seo. Kitchen faucet is leaking under the sink.",
  "I came across your website while looking for a plumber in Hiram. Water heater is out.",
  "I'm the business owner of a restaurant and need the parking lot resealed and striped.",
  "Can you do the job within 48 hours? I can pay cash. The funding from my insurance arrived.",
  "I visited your website and there were some issues with the quote form on my phone, so I'm emailing. Need a roof inspection."
];

const PITCHES = [
  "Hi, I came across your website and noticed it isn't ranking on the first page of Google for roofing in your area. Would you be interested in a free SEO audit?",
  "Hello, I was checking your website and found a few SEO errors that are hurting your rankings. I can get you on the first page of Google within 60 days.",
  "We are a web development company offering website redesign at affordable prices. Can I send you our portfolio and pricing?",
  "Is your website mobile friendly? I'd like to redesign your website so it brings in more customers. Our packages start at $499.",
  "I can help you increase your website traffic and leads with our proven SEO services. Reply STOP to opt out.",
  "Hey there! Are you looking for more customers? We help local businesses get more calls with Google Maps optimization and GMB management.",
  "Your business has been pre-approved for up to $250,000 in working capital. Funds in 24 hours, no collateral needed. Reply here to claim your funding offer.",
  "Quick question - would you be open to a merchant cash advance? We fund businesses like yours within 48 hours, line of credit up to $500k.",
  "Did you know your business may qualify for the Employee Retention Credit? ERC refunds up to $26,000 per employee. Book a 15 minute call: calendly.com/erc-team",
  "I'm a freelance web designer and WordPress developer. I noticed your website looks outdated. Would you like me to revamp your website for a flat fee?",
  "Hi, I would like to publish a guest post on your website. We pay $50 per do-follow link. Let me know your price for sponsored articles.",
  "We provide virtual assistants for small businesses at $8/hour. Outsource your admin, scheduling and customer service to our trained offshore team.",
  "Our AI receptionist answers every call 24/7 and books appointments for you. Want to see a free demo? Takes 10 minutes.",
  "We are a digital marketing agency specializing in lead generation for contractors. We can get you 20+ qualified leads per month.",
  "I visited your Google Business Profile and saw you're not showing up in the map pack. We offer GBP optimization services with guaranteed results.",
  "Hello Business Owner, we develop custom mobile apps and websites. App development services at 50% off this month.",
  "Need business funding? Get approved for a business line of credit up to $150,000 today. Same-day funding available.",
  "Dear Sir, we offer SEO and SMM services to boost your online presence and grow your business. Kindly reply with your budget.",
  "I'd love to help your business rank higher. I specialize in local SEO for small businesses. Are you the decision-maker?",
  "We write SEO-optimized blog posts for your website, 4 articles a month for $199. Want samples?"
];

test("real-shaped Sconyers Concrete messages are never treated as a pitch", () => {
  for (const m of REAL) assert.notEqual(screen(m).verdict, "pitch", m);
});

test("most real-shaped messages go through clean (no [Check] tag)", () => {
  const clean = REAL.filter((m) => screen(m).verdict === "clean").length;
  assert.ok(clean >= REAL.length - 2, `${clean}/${REAL.length} clean`);
});

test("vendor pitches are caught", () => {
  const caught = PITCHES.filter((m) => screen(m).verdict === "pitch").length;
  assert.ok(caught >= 20, `${caught}/${PITCHES.length} caught`);
  for (const m of PITCHES) assert.notEqual(screen(m).verdict, "clean", m);
});

test("one generic word never flags a message", () => {
  for (const m of ["website", "loan", "marketing", "funding", "app", "Google", "online"]) {
    assert.equal(screen(`Question about my ${m}.`).verdict, "clean", m);
  }
});

test("empty or odd input is clean", () => {
  assert.equal(screenPitch([]).verdict, "clean");
  assert.equal(screenPitch([null, undefined, 42, {}]).verdict, "clean");
  assert.equal(screenPitch("").verdict, "clean");
});
