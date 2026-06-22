const APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbxUVGh-nwTt2KIZ740VAs6K8z43JHGt6vTinNhEi0VtTJkEmfq6ZWEWaNUug6DoChQ/exec';

/* ── Rate limit: per IP, 3 submissions / 60s per warm instance ── */
const rl = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const e   = rl.get(ip) || { n: 0, t: now };
  if (now - e.t > 60_000) { rl.set(ip, { n: 1, t: now }); return false; }
  if (e.n >= 3) return true;
  e.n++;
  rl.set(ip, e);
  return false;
}

/* ── Disposable / throwaway email domains ── */
const DISPOSABLE = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.biz','guerrillamail.de','guerrillamail.info','grr.la',
  'sharklasers.com','spam4.me','yopmail.com','temp-mail.org','tempmail.com',
  'throwaway.email','trashmail.com','trashmail.me','trashmail.net','trashmail.io',
  'trashmail.at','dispostable.com','mailnull.com','maildrop.cc','spamgourmet.com',
  'fakeinbox.com','tempr.email','discard.email','getonemail.com','throwam.com',
  'spamfree24.org','mail-filter.com','spamhere.eu','0-mail.com','mailnesia.com',
  'spamgrap.com','mintemail.com','sogetthis.com','spamthisplease.com',
  'crapmail.org','binkmail.com','spamavert.com','spamevader.com',
]);

function validEmail(e) {
  return /^[^\s@]{1,64}@[^\s@]{1,253}\.[a-z]{2,}$/i.test(e);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many requests' });

  const { name, email, _hp, _t } = req.body || {};

  /* Honeypot — bots fill it, humans don't. Silently accept so bots think they succeeded. */
  if (_hp) return res.status(200).json({ ok: true });

  /* Timing — legitimate form takes > 2 s to fill */
  if (typeof _t === 'number' && Date.now() - _t < 2000) {
    return res.status(200).json({ ok: true });
  }

  /* Email validation */
  if (!email || !validEmail(email)) return res.status(400).json({ error: 'Invalid email' });

  /* Disposable domain block */
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && DISPOSABLE.has(domain)) return res.status(200).json({ ok: true });

  /* Block obvious test / bot patterns */
  const lower = email.toLowerCase();
  if (/^(test|spam|bot|fake|noreply|no-reply|admin|null|undefined)@/.test(lower)) {
    return res.status(200).json({ ok: true });
  }

  try {
    const r    = await fetch(APPS_SCRIPT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || '', email }),
      redirect: 'follow',
    });
    const data = await r.json();
    return res.status(200).json(data);
  } catch {
    return res.status(500).json({ error: 'Service unavailable' });
  }
}
