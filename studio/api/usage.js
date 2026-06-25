// ───────────────────────────────────────────────────────────────────────────
//  ENDPOINT ADMIN — réservé à TOI (protégé par un mot de passe secret).
//
//  Sert à :
//   • voir combien de créations une cliente a utilisées
//   • la débloquer / remettre son compteur à zéro (ex. elle a payé un nouvel accès)
//
//  Protégé par la variable d'environnement ADMIN_SECRET (choisis un mot de passe).
//
//  Exemples (remplace TON_SECRET et l'e-mail) :
//   • Voir :       /api/usage?secret=TON_SECRET&email=cliente@mail.com
//   • Débloquer :  /api/usage?secret=TON_SECRET&email=cliente@mail.com&reset=1
// ───────────────────────────────────────────────────────────────────────────

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KV_ON = !!(KV_URL && KV_TOKEN);

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const d = await r.json();
  return d && d.result != null ? parseInt(d.result, 10) || 0 : 0;
}
async function kvSet(key, val) {
  await fetch(`${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(val)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
}

export default async function handler(req, res) {
  const q = req.query || {};
  const secret = q.secret || (req.body && req.body.secret);
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) return res.status(500).json({ error: 'ADMIN_SECRET non configuré côté serveur.' });
  if (secret !== adminSecret) return res.status(401).json({ error: 'Accès refusé.' });
  if (!KV_ON) return res.status(500).json({ error: 'Base KV non configurée — le comptage est désactivé.' });

  const limit = parseInt(process.env.USAGE_LIMIT || '10', 10) || 10;
  const email = String(q.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Paramètre email manquant.' });
  const key = 'usage:' + email;

  if (q.reset === '1' || q.reset === 'true') {
    await kvSet(key, 0);
    return res.status(200).json({ email, used: 0, limit, remaining: limit, message: 'Compteur remis à zéro ✅' });
  }

  const used = await kvGet(key);
  return res.status(200).json({ email, used, limit, remaining: Math.max(0, limit - used) });
}
