// ───────────────────────────────────────────────────────────────────────────
//  MINI-SERVEUR — garde ta clé API CACHÉE + compte les créations PAR E-MAIL.
//
//  • Ta clé Anthropic n'apparaît JAMAIS dans la page web (variable d'env).
//  • Chaque cliente est limitée à USAGE_LIMIT créations, comptées CÔTÉ SERVEUR
//    par adresse e-mail → limite vraiment infranchissable (vider le navigateur
//    ou changer d'appareil ne remet rien à zéro).
//
//  Le compteur est stocké dans Vercel KV (base de données gratuite). Voir le
//  guide pour l'activer en quelques clics. Tant que KV n'est pas configuré, le
//  studio fonctionne mais SANS limite stricte (utile pour tester).
// ───────────────────────────────────────────────────────────────────────────

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KV_ON = !!(KV_URL && KV_TOKEN);

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const d = await r.json();
  return d && d.result != null ? parseInt(d.result, 10) || 0 : 0;
}
async function kvIncr(key) {
  const r = await fetch(`${KV_URL}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const d = await r.json();
  return d && d.result != null ? parseInt(d.result, 10) || 0 : 0;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const limit = parseInt(process.env.USAGE_LIMIT || '10', 10) || 10;
  const email = String(body.email || '').trim().toLowerCase();
  const key = 'usage:' + email;

  // 1) Vérification simple du quota (à l'entrée de l'e-mail) — ne consomme rien.
  if (body.check) {
    if (!email) return res.status(400).json({ error: 'E-mail manquant.' });
    const used = KV_ON ? await kvGet(key) : 0;
    return res.status(200).json({ used, limit, remaining: Math.max(0, limit - used) });
  }

  // 2) Génération.
  const prompt = body.prompt;
  if (!prompt) return res.status(400).json({ error: 'Prompt manquant.' });

  // Quota strict, côté serveur, par e-mail.
  if (KV_ON && email) {
    const used = await kvGet(key);
    if (used >= limit) {
      return res.status(403).json({ error: 'limit', used, limit, remaining: 0 });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Clé API absente côté serveur (ANTHROPIC_API_KEY).' });
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      const msg = data && data.error ? data.error.message : 'Erreur de l\'API Anthropic';
      return res.status(r.status).json({ error: msg });
    }

    const text = (data.content || []).map((b) => b.text || '').join('');

    // On ne décompte qu'une génération RÉUSSIE.
    let remaining = null;
    if (KV_ON && email) {
      const nu = await kvIncr(key);
      remaining = Math.max(0, limit - nu);
    }

    return res.status(200).json({ text, limit, remaining });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
