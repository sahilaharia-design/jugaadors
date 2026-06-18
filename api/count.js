const APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbxUVGh-nwTt2KIZ740VAs6K8z43JHGt6vTinNhEi0VtTJkEmfq6ZWEWaNUug6DoChQ/exec';
const FALLBACK = parseInt(process.env.WAITLIST_COUNT || '153', 10);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const r = await fetch(`${APPS_SCRIPT}?action=count`, { redirect: 'follow' });
    const data = await r.json();
    if (typeof data.count === 'number') {
      return res.status(200).json({ count: data.count });
    }
  } catch (_) {
    // Apps Script doesn't support count yet — use env fallback
  }

  return res.status(200).json({ count: FALLBACK });
}
