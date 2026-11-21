// Vercel serverless function: receives the website forms and appends them to a Google Sheet
// through a Google Apps Script web app (see integrations/google-sheets/SETUP.md).
// Environment variables (Vercel > Project > Settings > Environment Variables):
//   GOOGLE_SCRIPT_URL  the Apps Script web app URL (ends in /exec)
//   SHEET_TOKEN        a shared secret, the same value as TOKEN in the Apps Script
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, n);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'method_not_allowed' }); }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  if (b.company) return res.status(200).json({ ok: true }); // honeypot: pretend success to bots

  const type = b.type === 'newsletter' ? 'newsletter' : 'enquiry';
  const name = clean(b.name, 120), email = clean(b.email, 160), phone = clean(b.phone, 40);
  const message = String(b.message == null ? '' : b.message).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, 2000);
  const interests = (Array.isArray(b.interests) ? b.interests : []).map(x => clean(x, 60)).filter(Boolean).slice(0, 8).join(', ');
  const page = clean(b.page, 300), lang = clean(b.lang, 8), consent = clean(b.consent, 20);
  if (!EMAIL.test(email) || (type === 'enquiry' && !name)) return res.status(400).json({ ok: false, error: 'invalid' });

  const url = process.env.GOOGLE_SCRIPT_URL;
  if (!url) { console.error('GOOGLE_SCRIPT_URL is not set; submission NOT saved'); return res.status(503).json({ ok: false, error: 'not_configured' }); }
  try {
    const r = await fetch(url, {
      method: 'POST', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain avoids a CORS preflight on Apps Script
      body: JSON.stringify({ token: process.env.SHEET_TOKEN || '', type, name, email, phone, interests, message, page, lang, consent }),
    });
    const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch (e) {}
    if (!r.ok || !j.ok) { console.error('Sheet write failed', r.status, t.slice(0, 300)); return res.status(502).json({ ok: false, error: 'upstream' }); }
    return res.status(200).json({ ok: true });
  } catch (e) { console.error('Sheet write error', e); return res.status(502).json({ ok: false, error: 'upstream' }); }
};
