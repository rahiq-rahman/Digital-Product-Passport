// DPP/server/src/modules/ai/ai.service.js
// Uses HuggingFace router via native fetch — no extra dependencies needed.

const HF_URL   = 'https://router.huggingface.co/v1/chat/completions';
const MODEL    = 'deepseek-ai/DeepSeek-V3-0324:novita';

// ── Core fetch wrapper ────────────────────────────────────────────────────────
const hfChat = async (messages, max_tokens = 600, temperature = 0.3) => {
  const response = await fetch(HF_URL, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${process.env.HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens, temperature }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace API error ${response.status}: ${err}`);
  }

  const result = await response.json();
  return result.choices[0].message.content.trim();
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = d =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'unknown date';

const buildContext = (passport) => {
  const p         = passport.product;
  const ownership = passport.ownership || [];
  const repairs   = passport.repairs   || [];
  const events    = passport.events    || [];

  const mfgDate    = p.manufacturing_date ? new Date(p.manufacturing_date) : null;
  const now        = new Date();
  const ageMonths  = mfgDate ? Math.floor((now - mfgDate) / (1000*60*60*24*30)) : null;

  const firstSale  = events.find(e => e.event_type === 'SOLD_TO_CUSTOMER');
  const firstSaleDate = firstSale ? new Date(firstSale.event_date || firstSale.timestamp) : null;
  const daysToFirstSale = mfgDate && firstSaleDate
    ? Math.floor((firstSaleDate - mfgDate) / (1000*60*60*24))
    : null;

  const transferDates = ownership
    .map(o => new Date(o.transfer_date))
    .filter(Boolean)
    .sort((a, b) => a - b);

  let fastTransfers = 0;
  for (let i = 1; i < transferDates.length; i++) {
    if ((transferDates[i] - transferDates[i-1]) / (1000*60*60*24) < 30) fastTransfers++;
  }

  return {
    product: {
      name:               p.product_name,
      serial:             p.serial_number,
      model:              p.model_no,
      manufacturing_date: fmt(p.manufacturing_date),
      warranty_months:    p.warranty || 0,
      current_status:     p.current_status,
      description:        p.description || null,
      age_months:         ageMonths,
    },
    ownership_count:    ownership.length,
    owners:             ownership.map(o => ({ name: o.name, date: fmt(o.transfer_date) })),
    repair_count:       repairs.length,
    repairs:            repairs.map(r => ({
      issue:      r.issue,
      type:       r.repair_type,
      shop:       r.repairshop_name,
      price_bdt:  r.repair_price,
      status:     r.repair_status,
      date:       fmt(r.repair_date),
    })),
    event_count:        events.length,
    days_to_first_sale: daysToFirstSale,
    fast_transfers:     fastTransfers,
  };
};

// ── Summary ───────────────────────────────────────────────────────────────────
const generateSummary = async (passport) => {
  const ctx = buildContext(passport);

  return await hfChat([
    {
      role: 'system',
      content: 'You are a product history analyst for a Digital Product Passport system in Bangladesh. Write concise, factual, buyer-friendly summaries in plain prose. No markdown. No bullet points. No headings.',
    },
    {
      role: 'user',
      content: `Write a 2-3 sentence plain English summary of this product for a potential buyer.
Cover: when it was made, how many owners, any repairs, current status.
Be factual and neutral. Under 80 words. Write only the paragraph.

${JSON.stringify(ctx, null, 2)}`,
    },
  ], 200, 0.4);
};

// ── Authenticity Score ────────────────────────────────────────────────────────
const generateScore = async (passport) => {
  const ctx = buildContext(passport);

  const raw = await hfChat([
    {
      role: 'system',
      content: 'You are a product authenticity analyst. Respond ONLY with valid JSON. No markdown fences. No explanation outside the JSON object.',
    },
    {
      role: 'user',
      content: `Analyze this product passport and return a trust score as JSON.

Scoring criteria (total 100 points):
- lifecycle_integrity (25pts): Logical lifecycle? CREATED→IN_SHOWROOM→SOLD is normal. Missing stages or instant flips = lower.
- ownership_pattern (25pts): 1-2 owners over a reasonable period = high. Many owners in quick succession = low.
- repair_history (25pts): No repairs = high. Few minor repairs = medium. Many or expensive recurring repairs = lower.
- warranty_validity (15pts): Is warranty still active based on manufacture date + warranty months?
- registration_completeness (10pts): Are all fields (serial, model, description, dates) filled?

Return ONLY this JSON, nothing else:
{
  "total": <integer 0-100>,
  "grade": "<Excellent|Good|Fair|Caution|Poor>",
  "breakdown": {
    "lifecycle_integrity":       { "score": <int>, "max": 25, "note": "<one short sentence>" },
    "ownership_pattern":         { "score": <int>, "max": 25, "note": "<one short sentence>" },
    "repair_history":            { "score": <int>, "max": 25, "note": "<one short sentence>" },
    "warranty_validity":         { "score": <int>, "max": 15, "note": "<one short sentence>" },
    "registration_completeness": { "score": <int>, "max": 10, "note": "<one short sentence>" }
  },
  "verdict": "<1-2 sentence plain English verdict for a buyer>",
  "flags": []
}

Product data:
${JSON.stringify(ctx, null, 2)}`,
    },
  ], 700, 0.1);

  // Strip any accidental markdown fences
  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  return JSON.parse(clean);
};

// ── Combined — called by controller ──────────────────────────────────────────
const analyzePassport = async (passport) => {
  const [summary, score] = await Promise.all([
    generateSummary(passport),
    generateScore(passport),
  ]);
  return { summary, score };
};

module.exports = { analyzePassport };