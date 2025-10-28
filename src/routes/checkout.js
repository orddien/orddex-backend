import crypto from 'crypto';
import { query } from '../db.js';
import { criarCobrancaPix } from '../utils/pushinpay.js';

export default function checkoutRoute(app) {
  app.post('/checkout', async (req, res) => {
    try {
      const apiKey = (req.headers['x-orddex-key'] || req.query.merchant || req.body.merchant || '').toString();
      if (!apiKey) return res.status(400).json({ erro: 'merchant api_key é obrigatória (?merchant=)' });

      const { plan_code, telegram_id } = req.body || {};
      if (!plan_code || !telegram_id) return res.status(400).json({ erro: 'plan_code e telegram_id são obrigatórios' });

      const merchant = await query(`SELECT id FROM merchants WHERE api_key=$1`, [apiKey]);
      if (!merchant.rows.length) return res.status(404).json({ erro: 'merchant não encontrado' });
      const merchantId = merchant.rows[0].id;

      const integ = await query(`SELECT token FROM merchant_integrations WHERE merchant_id=$1 AND provider='pushinpay'`, [merchantId]);
      if (!integ.rows.length || !integ.rows[0].token) return res.status(400).json({ erro: 'merchant sem token PushinPay' });
      const merchantToken = integ.rows[0].token;

      const plan = await query(`SELECT id, name, price_cents, duration_days FROM plans WHERE merchant_id=$1 AND code=$2 AND active=TRUE`,
                               [merchantId, plan_code]);
      if (!plan.rows.length) return res.status(404).json({ erro: 'plano não encontrado' });
      const p = plan.rows[0];

      const cu = await query(
        `INSERT INTO customers (telegram_id) VALUES ($1)
         ON CONFLICT (telegram_id) DO UPDATE SET telegram_id=EXCLUDED.telegram_id
         RETURNING id`,
        [String(telegram_id)]
      );
      const customerId = cu.rows[0].id;

      const sub = await query(
        `INSERT INTO subscriptions (merchant_id, customer_id, plan_id, status) VALUES ($1,$2,$3,'pending') RETURNING id`,
        [merchantId, customerId, p.id]
      );
      const subscriptionId = sub.rows[0].id;

      const paymentId = crypto.randomUUID();
      await query(`INSERT INTO payments (id, subscription_id, amount_cents, status) VALUES ($1,$2,$3,'pending')`,
                  [paymentId, subscriptionId, p.price_cents]);

      const charge = await criarCobrancaPix({
        token: merchantToken,
        amount_cents: p.price_cents,
        description: `Orddex — ${p.name}`,
        external_id: paymentId
      });

      await query(`UPDATE payments SET external_id=$1, payload_json=$2 WHERE id=$3`,
                  [charge?.external_id || paymentId, charge, paymentId]);

      res.json({
        pagamento_id: paymentId,
        assinatura_id: subscriptionId,
        pix_code: charge?.pix_code || charge?.pixCopiaCola || null,
        qrcode_base64: charge?.qrcode_base64 || null
      });
    } catch (e) { console.error(e); res.status(500).json({ erro: 'falha no checkout' }); }
  });
}
