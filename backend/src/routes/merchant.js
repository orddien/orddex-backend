import { query } from '../db.js';

function exigirChave(req, res, next) {
  const key = req.headers['x-orddex-key'] || req.headers['x-ordex-key'];
  if (!key) return res.status(401).json({ erro: 'header x-orddex-key é obrigatório' });
  req.apiKey = String(key);
  next();
}

export default function merchantRoutes(app) {
  app.post('/integracoes/pushinpay', exigirChave, async (req, res) => {
    const { token, webhook_secret } = req.body || {};
    if (!token) return res.status(400).json({ erro: 'token é obrigatório' });
    const m = await query(`SELECT id FROM merchants WHERE api_key=$1`, [req.apiKey]);
    if (!m.rows.length) return res.status(404).json({ erro: 'merchant não encontrado' });
    const merchantId = m.rows[0].id;
    await query(`INSERT INTO merchant_integrations (merchant_id, provider, token, webhook_secret)
                 VALUES ($1,'pushinpay',$2,$3)
                 ON CONFLICT (merchant_id, provider) DO UPDATE SET token=EXCLUDED.token, webhook_secret=EXCLUDED.webhook_secret`,
                [merchantId, token, webhook_secret || null]);
    res.json({ ok: true });
  });

  app.post('/merchant/grupos', exigirChave, async (req, res) => {
    const { telegram_chat_id, title, type } = req.body || {};
    if (!telegram_chat_id) return res.status(400).json({ erro: 'telegram_chat_id é obrigatório' });
    const m = await query(`SELECT id FROM merchants WHERE api_key=$1`, [req.apiKey]);
    if (!m.rows.length) return res.status(404).json({ erro: 'merchant não encontrado' });
    const merchantId = m.rows[0].id;
    await query(`INSERT INTO merchant_groups (merchant_id, telegram_chat_id, title, type) VALUES ($1,$2,$3,$4)`,
                [merchantId, String(telegram_chat_id), title || null, type || null]);
    res.json({ ok: true });
  });
}
