import fs from "fs";
import path from "path";

const GEMINI_KEY = "AIzaSyBEAbKHb2YtyJuvyDMfteaBl1ifiqHRrDg";
const API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_KEY}`;
const OUT = "/Users/spartacusclaud/.openclaw/workspace/sconyers-concrete/images";

fs.mkdirSync(OUT, { recursive: true });

async function generateImage(name, prompt) {
  console.log(`\nGenerating: ${name}...`);
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["image", "text"] },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`API Error: ${JSON.stringify(data.error)}`);
  const imgPart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!imgPart) throw new Error(`No image in response`);
  const buf = Buffer.from(imgPart.inlineData.data, "base64");
  const filePath = path.join(OUT, `${name}.jpg`);
  fs.writeFileSync(filePath, buf);
  console.log(`✅ Saved: ${filePath}`);
  return filePath;
}

const images = [
  {
    name: "hero",
    prompt: `Photorealistic wide-angle cinematic photograph of a commercial concrete crew pouring and finishing a massive concrete slab for a large commercial building in Georgia. Late afternoon golden hour light. 3–4 workers in hard hats and safety vests using bull floats and screeds on a massive wet concrete pour. Heavy industrial equipment in background. Dramatic sky with warm light hitting the wet concrete surface. High resolution, professional construction photography style. No text.`
  },
  {
    name: "concrete-slabs",
    prompt: `Photorealistic professional construction photo of commercial concrete slab work. Workers finishing a large-scale concrete floor slab with power trowels for a commercial warehouse or industrial building. Smooth wet concrete surface reflecting light. Hard hats, safety vests. Close-up perspective showing the texture and scale. Professional photography, sharp focus, natural light. No text.`
  },
  {
    name: "concrete-paving",
    prompt: `Photorealistic professional construction photo of commercial concrete paving. A large commercial parking lot or road being paved with concrete. Concrete paving machine in action, fresh concrete being laid in thick slabs. Workers guiding the process. Clean, industrial, Georgia setting. Wide angle. No text.`
  },
  {
    name: "curbs-gutters",
    prompt: `Photorealistic professional construction photo of commercial concrete curb and gutter installation. Workers forming and pouring concrete curbs along a commercial property edge. Fresh grey concrete curbing alongside a parking area or road. Professional, clean, suburban commercial setting. No text.`
  },
  {
    name: "sidewalks",
    prompt: `Photorealistic professional photo of freshly poured commercial concrete sidewalk being finished. Workers smoothing and finishing a wide commercial sidewalk in front of a modern commercial building. Clean smooth grey concrete, expansion joints visible. Professional construction photography. No text.`
  },
  {
    name: "ada-ramps",
    prompt: `Photorealistic professional construction photo of ADA handicap concrete ramp being constructed at a commercial building entrance. Workers forming and finishing a concrete accessibility ramp with proper slope and truncated dome surface. Professional, clean, commercial setting. No text.`
  },
  {
    name: "stairs",
    prompt: `Photorealistic professional photo of freshly formed concrete stairs at a commercial building. Wide concrete steps with clean edges and smooth finish at the entrance of a commercial or institutional building. Strong architectural lines. Late afternoon light casting shadows on the steps. Professional photography. No text.`
  },
  {
    name: "about-team",
    prompt: `Photorealistic professional photo of a small commercial concrete contracting crew of 3–4 workers posing confidently at a job site in Greater Atlanta, Georgia. They wear hard hats and high-visibility safety vests. Background shows a large finished concrete commercial project. Late afternoon warm light. Pride, craftsmanship, experience. Professional, authentic, trustworthy. No text.`
  },
];

async function main() {
  console.log("🏗️  Generating Sconyers Concrete site images...\n");
  const results = [];
  for (const img of images) {
    try {
      await generateImage(img.name, img.prompt);
      results.push({ name: img.name, status: "✅" });
    } catch (err) {
      console.error(`❌ Failed: ${img.name} — ${err.message}`);
      results.push({ name: img.name, status: "❌", error: err.message });
    }
  }
  console.log("\n📋 RESULTS:");
  results.forEach(r => console.log(`${r.status} ${r.name}${r.error ? ` — ${r.error}` : ""}`));
  console.log(`\n📁 Saved to: ${OUT}`);
}

main().catch(console.error);
