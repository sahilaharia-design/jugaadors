const APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbxUVGh-nwTt2KIZ740VAs6K8z43JHGt6vTinNhEi0VtTJkEmfq6ZWEWaNUug6DoChQ/exec';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const response = await fetch(APPS_SCRIPT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name || '', email }),
    redirect: 'follow',
  });

  const data = await response.json();
  return res.status(200).json(data);
}
