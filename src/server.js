import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cron from 'node-cron';
import { query } from './db.js';
import bot from './bot.js';

import authRoutes from './routes/auth.js';
import merchantRoutes from './routes/merchant.js';
import checkoutRoute from './routes/checkout.js';
import webhookPushinPayRoute from './routes/webhook-pushinpay.js';

const app = express();
app.use(cors({ origin: (process.env.CORS_ORIGIN || '*').split(',') }));
app.use(bodyParser.json({ limit: '1mb' }));

app.get('/health', (_, res) => res.json({ ok: true }));

authRoutes(app);
merchantRoutes(app);
checkoutRoute(app);
webhookPushinPayRoute(app);

cron.schedule('*/30 * * * *', async () => {
  const r = await query(`SELECT id FROM subscriptions WHERE status='active' AND end_at < now()`);
  for (const row of r.rows) await query(`UPDATE subscriptions SET status='expired' WHERE id=$1`, [row.id]);
});

try { if (process.env.BOT_TOKEN) bot.launch().then(()=>console.log('Bot ON')); }
catch(e){ console.error('Falha ao iniciar bot:', e); }

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('API Orddex ouvindo na porta', port));
