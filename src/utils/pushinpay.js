import fetch from 'node-fetch';
export async function criarCobrancaPix({ token, amount_cents, description, external_id, apiUrl }) {
  const url = apiUrl || 'https://api.pushinpay.com.br/api/pix/cashIn';
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const payload = { amount: amount_cents, price: amount_cents, description, external_id };
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  const text = await r.text();
  if (!r.ok) throw new Error(`PushinPay ${r.status}: ${text}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}
