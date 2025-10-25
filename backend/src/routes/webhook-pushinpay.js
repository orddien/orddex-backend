import { query } from '../db.js';
import { enviarConvite } from '../bot.js';

export default function webhookPushinPayRoute(app) {
  app.post('/webhooks/pushinpay', async (req, res) => {
    try {
      const evt = req.body || {};
      if (evt.status === 'paid' && evt.external_id) {
        const paymentId = evt.external_id;
        const q = await query(
          `SELECT p.id as payment_id, s.id as subscription_id, s.merchant_id, s.customer_id,
                  c.telegram_id, pl.duration_days
           FROM payments p
           JOIN subscriptions s ON s.id = p.subscription_id
           JOIN customers c ON c.id = s.customer_id
           JOIN plans pl ON pl.id = s.plan_id
           WHERE p.id=$1`, [paymentId]
        );
        if (!q.rows.length) return res.status(404).send('payment not found');
        const row = q.rows[0];
        await query(`UPDATE payments SET status='paid', payload_json=$1 WHERE id=$2`, [evt, paymentId]);
        await query(`UPDATE subscriptions SET status='active', start_at=now(), end_at=now()+ ($1||' days')::interval WHERE id=$2`,
                    [row.duration_days, row.subscription_id]);

        const g = await query(`SELECT telegram_chat_id FROM merchant_groups WHERE merchant_id=$1 ORDER BY created_at LIMIT 1`, [row.merchant_id]);
        const chatId = g.rows.length ? g.rows[0].telegram_chat_id : (process.env.TELEGRAM_GROUP_ID || null);
        if (row.telegram_id && chatId) await enviarConvite({ telegramId: row.telegram_id, chatId });
      }
      res.status(200).send('ok');
    } catch (e) { console.error(e); res.status(500).send('error'); }
  });
}
