// Vendor-pitch screen for website lead forms.
//
// Creative Cowboys shared list (Oct 22 2026, modeled on the Arctic Law
// screen). It catches messages that are a sales pitch TO the business rather
// than a customer asking for help:
//   - SEO, marketing, web design, app and outsourcing pitches
//   - business loan / funding offers
//
// It never blocks on one generic word ("website", "loan", "marketing"): a real
// customer writes "the form on your website didn't work" or "my loan closes
// Friday". Patterns are whole-word phrases shaped like a pitch.
//
// Scoring:
//   OFFER patterns (the pitch aimed at the business) weigh 2.
//   SERVICE patterns (a vendor-service phrase like "SEO services") weigh 2 on
//     the default profile and 1 on the "business" profile. Use "business" for
//     law firms and insurance agencies, whose real clients may describe a
//     dispute with, or coverage for, exactly that kind of company.
//   WEAK patterns weigh 1. CONTEXT patterns weigh 1 but only count when some
//     other pattern also hit ("I came across your website" opens real
//     inquiries too).
// Verdict:
//   "pitch": score 2+ with at least one 2-weight hit, or 3+ from weaker hits.
//     On the business profile it needs an offer hit (or a score of 4+).
//   "check": any other hit. "clean": nothing hit.
// The caller decides what "pitch" means for its site (held in the site's own
// store, or delivered with a "[Filtered: pitch]" subject) and adds "[Check]"
// for "check". Nothing in this file drops a lead.
//
// Keep this file the same in every client repo that uses it (Creative Cowboys
// pitch filter, Oct 2026). Per-site tuning goes in the caller: the profile,
// `skip` for a phrase a business's real customers use, `promote` for one no
// real customer of that business would write.
//
// Pure: no imports, no I/O, so it runs in Node, the Edge runtime and tests.

export type PitchVerdict = "pitch" | "check" | "clean";
export type PitchProfile = "default" | "business";
export type PitchResult = { verdict: PitchVerdict; score: number; reasons: string[] };
export type PitchOptions = {
  profile?: PitchProfile;
  /** Rule ids this site ignores (a phrase its real customers use). */
  skip?: string[];
  /** Rule ids this site treats as offers (weight 2), e.g. "bulk-optout" where
   *  no real customer would quote an opt-out line. */
  promote?: string[];
};

type Kind = "offer" | "service" | "weak" | "context";
type Rule = { id: string; kind: Kind; re: RegExp; reason: string };

// Bounded gap inside one sentence: "rank YOUR NEW WEBSITE on the first page".
const GAP = "[^.!?\\n]{0,40}";
const rx = (source: string) => new RegExp(source, "i");

const RULES: Rule[] = [
  // ------------------------------------------------------------ offers (2)
  {
    id: "rank-you",
    kind: "offer",
    reason: "offers first-page Google rankings",
    re: rx(`\\b(get|put|bring|rank|ranking|push)\\b${GAP}\\b(your|you)\\b${GAP}\\b(first|1st|top|front|#1|number one|no\\.? ?1)\\s+(page|spot|position|results?)\\b`),
  },
  {
    id: "fix-your-site",
    kind: "offer",
    reason: "offers to redesign or optimize your website",
    re: rx(
      "\\b(redesign(ing)?|revamp(ing)?|rebuild(ing)?|moderni[sz](e|ing)|optimi[sz](e|ing)|upgrad(e|ing)|re-?design)\\b (of )?your (current |existing |old |outdated )?(web ?site|site|online presence|google (my )?business (profile|listing)|seo|landing pages?|online store)\\b"
    ),
  },
  {
    id: "your-site-issues",
    kind: "offer",
    reason: "cold audit of your website or rankings",
    re: rx(
      `\\b(noticed|found|saw|spotted|came across|checked|reviewed|audited|analy[sz]ed|looked at|went through|visited|ran)\\b${GAP}\\byour (web ?site|site|google (my )?business (profile|listing)|online presence|seo|rankings?|search rankings?|social media)\\b[^.!?\\n]{0,80}\\b(rank(s|ing)?|traffic|seo|visibility|not (showing|appearing|ranking|found|visible)( up)? (on|in) (google|search|the map pack|the local pack|google maps|maps)|mobile[- ]friendly|load(ing)? speed|page speed|optimi[sz]ed|(seo|technical|on[- ]page|design|ranking|indexing) (issues|errors|problems|mistakes)|could (use|be) (some |a few )?(improvements?|improved|better)|outdated|out of date|old[- ]fashioned|not (very )?(user[- ]friendly|modern))\\b`
    ),
  },
  {
    id: "more-for-your",
    kind: "offer",
    reason: "promises more traffic/leads for your business",
    re: rx(
      "\\bmore (traffic|leads|calls|customers|clients|sales|reviews|visibility|bookings|patients|jobs|business|visitors|members)\\b[^.!?\\n]{0,25}\\b(for|to|into) your (business|website|site|company|firm|practice|church|ministry|shop|store|brand)\\b"
    ),
  },
  {
    id: "increase-your",
    kind: "offer",
    reason: "promises to grow your traffic/sales",
    re: rx(
      "\\b(increase|boost|grow|double|triple|improve|skyrocket|maximi[sz]e|scale|generate)\\b (up )?your (website'?s? |site'?s? |online |organic |web |google |local |search |monthly )?(traffic|leads|sales|revenue|visibility|rankings?|conversions?|online presence|presence|business|customer base|client base|bookings|profits?|roi)\\b"
    ),
  },
  {
    id: "we-can-help",
    kind: "offer",
    reason: "\"we can get you more leads/rankings\" offer",
    re: rx(
      `\\b(i|we|our (team|agency|company|firm|experts?|developers?))\\b(\\s(can|could|would|will)|'d|'ll) (love to |be happy to |like to )?(help|get) (you|your (business|company|firm|practice|website|site|brand|church|shop|store))\\b(?! to\\b)${GAP}\\b(rank(ing)?|traffic|leads?|seo|search results|online presence|more (clients|customers|patients|calls|sales|reviews)|funding|working capital)\\b`
    ),
  },
  {
    id: "free-audit",
    kind: "offer",
    reason: "offers a free website/SEO audit",
    re: rx(
      "\\bfree (website|web ?site|seo|site|marketing|digital|growth|ranking) (audit|analysis|report|review|consultation|strategy|proposal|mock-?up|demo|evaluation|assessment)\\b"
    ),
  },
  {
    id: "link-selling",
    kind: "offer",
    reason: "guest post / backlink pitch",
    re: rx(
      "\\b(guest[- ]?posts?|guest[- ]posting|sponsored (posts?|articles?)|link[- ]?building|back[- ]?links?|domain authority|do-?follow links?|link insertions?|niche edits?)\\b"
    ),
  },
  {
    id: "you-preapproved",
    kind: "offer",
    reason: "\"you're pre-approved\" funding offer",
    re: rx(
      `\\b(you|your (business|company|firm|church|organization|practice|shop))(('re| are|'s| is|'ve been| have been| has been| were| was)( now| already| officially)? (pre-?approved|pre-?qualified|approved|eligible|qualified)| (may|might|could|will) (qualify|be eligible))\\b${GAP}\\b(for|up to)\\b[^.!?\\n]{0,30}(\\$|usd|funding|capital|loans?|lines? of credit|financing|cash advance|credit line|tax credits?|retention credit|refunds?|grants?)`
    ),
  },
  {
    id: "outsource-your",
    kind: "offer",
    reason: "offers to take over your work (outsourcing)",
    re: rx("\\b(outsourc(e|ing)|delegate|hand off) your (admin|bookkeeping|marketing|seo|calls|phones|scheduling|customer service|back office|social media|web ?site|lead generation|sales)\\b"),
  },
  {
    id: "content-for-you",
    kind: "offer",
    reason: "offers to write content for your website",
    re: rx("\\b(blog (posts|articles)|seo content|articles|content) for your (web ?site|site|blog)\\b"),
  },
  {
    id: "answers-calls",
    kind: "offer",
    reason: "AI answering-service pitch",
    re: rx(
      "\\b(answers?|answering|handles?|handling|captures?|capturing) (every|all|your|missed) (incoming |inbound )?(calls?|leads?)\\b[^.!?\\n]{0,40}(24/?7|for you|around the clock)"
    ),
  },
  {
    id: "hand-off-the",
    kind: "offer",
    reason: "offers to take over your admin/CRM work",
    re: rx("\\bhand off (the|your|all (the|your)) (admin|crm|follow[- ]?ups?|bookkeeping|marketing|scheduling|busy ?work|back office)\\b"),
  },
  {
    id: "give-you-va",
    kind: "offer",
    reason: "offers you a trained VA / assistant",
    re: rx(
      "\\b(give|provide|assign|get|match) you (with )?(a|an|your own) (((trained|dedicated|virtual|personal|full[- ]time|part[- ]time|remote) )*(va|virtual assistant|appointment setter)|(trained|dedicated|virtual|remote|offshore) (assistant|developer|team|marketer))\\b"
    ),
  },
  {
    id: "trained-va",
    kind: "offer",
    reason: "offers a trained/dedicated VA",
    re: rx("\\b(trained|dedicated|offshore|filipino|full[- ]time|part[- ]time) (va|vas)\\b"),
  },
  {
    id: "bulk-optout",
    kind: "service",
    reason: "bulk-sender opt-out line",
    re: rx("\\b(reply|text|respond with) ['\"]?(stop|remove|unsubscribe|no)['\"]? (to|if you('d| would) like to) (opt[- ]?out|unsubscribe|stop|be removed)\\b"),
  },
  {
    id: "need-more-customers",
    kind: "offer",
    reason: "\"want more customers?\" cold opener",
    re: rx(
      "\\b(are you (looking|wanting|trying) (for|to get)|do you (need|want)|would you like|want) (more|new|extra) (customers|clients|leads|traffic|calls|patients|sales|bookings|reviews)\\b"
    ),
  },
  {
    id: "funds-fast",
    kind: "offer",
    reason: "fast business funding offer",
    re: rx(
      "\\b(same[- ]day funding|(funds?|funded|funding)\\b[^.!?\\n]{0,40}\\b(in|within) (24|48|72) hours|fund (businesses|companies) like yours|no credit check (funding|loans?|financing)|funding (offers?|approval) for your business|business funding offers?)\\b"
    ),
  },

  // ------------------------------------------------------- services (2 / 1)
  {
    id: "seo-services",
    kind: "service",
    reason: "SEO services pitch",
    re: rx(
      "\\b(local seo|seo|search engine optimi[sz]ation) (services?|packages?|experts?|specialists?|agency|company|firm|audits?|reports?|plans?|strategy|strategies|campaigns?|consultants?|solutions?|optimization|work|team)\\b"
    ),
  },
  {
    id: "web-services",
    kind: "service",
    reason: "web design/development services pitch",
    re: rx(
      "\\b(web ?site|web) (design|development|redesign|developer|designer|design (and|&) development) (services?|company|agency|firm|team|packages?|solutions?|experts?|specialists?)\\b"
    ),
  },
  {
    id: "marketing-services",
    kind: "service",
    reason: "marketing agency/services pitch",
    re: rx(
      "\\b(digital|internet|online|seo|social media|local|performance|growth) marketing (agency|services?|company|firm|experts?|specialists?|solutions?|packages?|campaigns?|consultants?|strategy|strateg(ist|ists))\\b"
    ),
  },
  {
    id: "lead-gen",
    kind: "service",
    reason: "lead generation pitch",
    re: rx("\\blead[- ]gen(eration)?\\b"),
  },
  {
    id: "app-dev",
    kind: "service",
    reason: "app development pitch",
    re: rx(
      "\\b((mobile |ios |android |custom |web )?app(lication)? development (services?|company|agency|team|firm|solutions?|partners?)|(we|i) (build|develop|create|design) (custom |high[- ]quality )?(mobile |web |ios |android )?apps?)\\b"
    ),
  },
  {
    id: "virtual-assistant",
    kind: "service",
    reason: "virtual assistant pitch",
    re: rx("\\bvirtual assistan(t|ts|ce)\\b"),
  },
  {
    id: "outsourcing",
    kind: "service",
    reason: "outsourcing pitch",
    re: rx(
      "\\b(outsourc(e|ing) (your|services?|partners?|company|team|solutions?|agency)|(offshore|outsourced|dedicated remote) (team|staff|developers?|agents?|assistants?)|white[- ]label (seo|web|marketing|services?|agency))\\b"
    ),
  },
  {
    id: "ppc-social",
    kind: "service",
    reason: "ads/social management pitch",
    re: rx(
      "\\b((ppc|pay[- ]per[- ]click|google ads|facebook ads|meta ads) (management|services?|campaigns?|experts?|specialists?|agency)|social media (management|marketing) (services?|packages?|agency|company|plans?))\\b"
    ),
  },
  {
    id: "gbp-services",
    kind: "service",
    reason: "Google Business Profile services pitch",
    re: rx(
      "\\b((google (my )?business|gmb|gbp) (profile |listing )?(optimization|management|ranking|verification services?|services?)|google maps (ranking|optimization|seo))\\b"
    ),
  },
  {
    id: "ai-agent",
    kind: "service",
    reason: "AI receptionist/chatbot pitch",
    re: rx(
      "\\b(ai (receptionists?|chat ?bots?|voice agents?|phone agents?|answering (service|agents?)|sales agents?|appointment setters?)|ai[- ](powered|driven) (chat ?bots?|receptionists?|agents?|marketing|lead))\\b"
    ),
  },
  {
    id: "our-ai-system",
    kind: "service",
    reason: "pitches an AI system/tool",
    re: rx(
      "\\b((our|my) (own |custom |proprietary |in[- ]house )?ai (systems?|tools?|platforms?|agents?|assistants?|solutions?|software|workflows?)|(the )?power of ai without)"
    ),
  },
  {
    id: "we-offer",
    kind: "service",
    reason: "\"we offer/provide\" marketing, web or funding services",
    re: rx(
      "\\b(i|we)('m| am|'re| are)? (offer|offering|provide|providing|specialize in|specializing in|help businesses with)\\b[^.!?\\n]{0,30}\\b(seo|search engine optimi[sz]ation|web ?site (design|development|redesign)|web (design|development)|digital marketing|social media (marketing|management)|lead generation|app development|link building|back ?links?|ppc|google ads|virtual assistan(t|ce)|outsourc\\w*|business (loans?|funding|financing)|merchant cash advances?|working capital)\\b"
    ),
  },
  {
    id: "we-are-agency",
    kind: "service",
    reason: "introduces a web/SEO/marketing agency",
    re: rx(
      "\\b(we|i)('re| are|'m| am) (a |an )?(leading |top |professional |small |full[- ]service |certified |experienced |freelance |independent )*(web ?site|web|seo|digital marketing|internet marketing|online marketing|marketing|app development|software development|wordpress|shopify|lead generation) (design |development )?(company|agency|firm|team|studio|expert|experts|specialist|specialists|developer|designer|consultant|professional)s?\\b"
    ),
  },
  {
    id: "platform-dev",
    kind: "service",
    reason: "website builder developer pitch",
    re: rx(
      "\\b(wordpress|shopify|wix|squarespace|webflow|woocommerce) (developers?|experts?|designers?|specialists?|agency|(web ?site )?(design|development) services?)\\b"
    ),
  },
  {
    id: "content-writing",
    kind: "service",
    reason: "content writing pitch",
    re: rx(
      "\\b((content|article|blog|seo) writing services?|(seo|seo-optimized|seo optimized) (articles|blog posts|content)|blog (posts|articles) for your (website|site|business|blog))\\b"
    ),
  },
  {
    id: "business-funding",
    kind: "service",
    reason: "business loan/funding pitch",
    re: rx(
      "\\b(business funding|working capital|merchant cash advances?|revenue[- ]based financing|business (loans?|financing|lines? of credit) (offers?|options|up to|approval|program)|(sba|eidl) loans?|employee retention (tax )?credits?|\\berc (refunds?|credits?|claims?|funds?))\\b"
    ),
  },
  {
    id: "credit-up-to",
    kind: "service",
    reason: "\"credit line up to $\" funding pitch",
    re: rx(
      "\\b(lines? of credit|credit lines?|business (loans?|funding|financing))\\b[^.!?\\n]{0,15}\\b(of )?up to \\$?\\s?\\d"
    ),
  },

  // ---------------------------------------------------------------- weak (1)
  // Case-sensitive on purpose: "Seo" is also a Korean family name.
  { id: "w-seo", kind: "weak", reason: "mentions SEO", re: /\b(SEO|seo|[Ss]earch [Ee]ngine [Oo]ptimi[sz]ation)\b/ },
  {
    id: "w-saw-your-site",
    kind: "context",
    reason: "\"I came across your website\" opener",
    re: rx(
      "\\b(i|we) (just |recently )?(noticed|came across|found|checked out|looked at|was looking at|was browsing|visited|reviewed|stumbled upon)\\b[^.!?\\n]{0,15}\\byour (web ?site|site|online presence|google (my )?business (profile|listing))\\b"
    ),
  },
  {
    id: "w-first-page",
    kind: "context",
    reason: "talks about Google rankings",
    re: rx(
      "\\b((first|1st|front|top) page (of|on|in) (google|bing|search)|page (one|1) (of|on) google|top (of|in) google|google rankings?|rank(ing)? (higher|better) (on|in) google|outrank)\\b"
    ),
  },
  {
    id: "w-agency",
    kind: "context",
    reason: "mentions a marketing/web agency",
    re: rx("\\b(marketing|seo|web ?design|web development|digital|creative) (agency|agencies)\\b"),
  },
  { id: "w-outsourcing", kind: "context", reason: "mentions outsourcing", re: rx("\\b(outsourc(e|ing)|offshore)\\b") },
  {
    id: "w-book-call",
    kind: "context",
    reason: "asks to book a quick call",
    re: rx(
      "(calendly\\.com|cal\\.com/|tidycal\\.com|\\bbook a (quick |short |free |brief )(call|chat|meeting)|\\b(10|15|20)[- ]min(ute)? (call|chat|meeting)|\\bquick (call|chat) (this|next) week)"
    ),
  },
  {
    id: "w-interested",
    kind: "context",
    reason: "cold-outreach question",
    re: rx(
      "\\b(would you be (interested|open) (in|to) (a|an|our|my|hearing)|is this the (right|best) (person|email|contact)|are you the (business owner|owner|decision[- ]maker)|decision[- ]maker)\\b"
    ),
  },
  {
    id: "w-generic-greeting",
    kind: "context",
    reason: "addressed to \"business owner\" / \"sir\"",
    re: rx("^\\s*(hello|hi|dear|hey|greetings),? (business owner|sir|sir/madam|sir or madam|website owner|site owner|webmaster)\\b"),
  },
  {
    id: "w-like-yours",
    kind: "context",
    reason: "\"businesses like yours\" wording",
    re: rx("\\b(businesses|companies|firms|brands) like yours\\b"),
  },
  {
    id: "w-unsubscribe",
    kind: "weak",
    reason: "bulk-mail opt-out wording",
    re: rx("\\b(unsubscribe|opt[- ]out|reply ['\"]?(stop|no|remove)['\"]?)\\b"),
  },
  {
    id: "w-ai-tools",
    kind: "context",
    reason: "AI automation sales wording",
    re: rx("\\b(ai|artificial intelligence)\\b[^.!?\\n]{0,20}\\b(automation|agents?|tools?|solutions?|chat ?bots?)\\b"),
  },
  {
    id: "w-funding",
    kind: "weak",
    reason: "mentions business funding",
    re: rx("\\b(funding|capital|financing) (offers?|programs?|solutions?) for (your|small) business(es)?\\b"),
  },
];

/** Ids of every rule, for a site's `skip` list and for tests. */
export const PITCH_RULE_IDS: readonly string[] = RULES.map((r) => r.id);

function normalize(value: unknown): string {
  if (Array.isArray(value)) return value.map(normalize).filter(Boolean).join("\n");
  if (typeof value !== "string") return "";
  return value
    .replace(/[​-‍﻿]/g, "")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[ \t ]+/g, " ");
}

/**
 * Screen the free text of a submission (message, subject, company, name...).
 * Pass the fields as an array of strings; anything that is not a string is
 * ignored.
 */
export function screenPitch(fields: unknown, options: PitchOptions = {}): PitchResult {
  const text = normalize(fields);
  const profile = options.profile || "default";
  const skip = new Set(options.skip || []);
  const promote = new Set(options.promote || []);
  let score = 0;
  let strong = false;
  let standalone = false;
  let offer = false;
  const reasons: string[] = [];
  if (!text.trim()) return { verdict: "clean", score: 0, reasons };

  for (const rule of RULES) {
    if (skip.has(rule.id) || !rule.re.test(text)) continue;
    const kind: Kind = promote.has(rule.id) ? "offer" : rule.kind;
    const weight = kind === "offer" ? 2 : kind === "service" ? (profile === "business" ? 1 : 2) : 1;
    if (weight === 2) strong = true;
    if (kind !== "context") standalone = true;
    if (kind === "offer") offer = true;
    score += weight;
    reasons.push(rule.reason);
  }

  // Context rules ("I came across your website", "would you be interested in")
  // also open plenty of real inquiries, so on their own they mean nothing.
  if (!standalone) return { verdict: "clean", score: 0, reasons: [] };
  // On the business profile a real client may describe their OWN agency or
  // lender ("we are a digital marketing agency and need event AV"), so a
  // pitch needs an offer aimed at the business, or a pile of signals.
  const pitch = profile === "business" ? (offer && score >= 2) || score >= 4 : (strong && score >= 2) || score >= 3;
  const verdict: PitchVerdict = pitch ? "pitch" : "check";
  return { verdict, score, reasons };
}

/** "[Filtered: pitch] " / "[Check] " / "" for an email subject. */
export function pitchSubjectPrefix(result: PitchResult): string {
  if (result.verdict === "pitch") return "[Filtered: pitch] ";
  if (result.verdict === "check") return "[Check] ";
  return "";
}

/** One plain sentence for the top of a lead email, or "" when clean. */
export function pitchNote(result: PitchResult): string {
  if (result.verdict === "clean") return "";
  const why = result.reasons.join("; ");
  return result.verdict === "pitch"
    ? `The website flagged this as a likely sales pitch (${why}). It was delivered anyway so nothing is lost.`
    : `The website flagged this for a second look (${why}). It may be a real inquiry.`;
}
