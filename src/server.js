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

// 🔧 Ajustes essenciais pro Railway
app.set('trust proxy', true); // deixa o Railway rotear corretamente
app.disable('x-powered-by');

// 🌍 CORS
app.use(cors({ origin: (process.env.CORS_ORIGIN || '*').split(',') }));

// 🧠 Body Parser
app.use(bodyParser.json({ limit: '1mb' }));

// 🩺 Health check
app.get('/health', (_, res) => res.status(200).json({ ok: true, message: 'API Orddex ativa!' }));

// 🚏 Rotas principais
authRoutes(app);
merchantRoutes(app);
checkoutRoute(app);
webhookPushinPayRoute(app);

// 🕓 Cron para expiração automática
cron.schedule('*/30 * * * *', async () => {
  try {
    const r = await query(`SELECT id FROM subscriptions WHERE status='active' AND end_at < now()`);
    for (const row of r.rows) {
      await query(`UPDATE subscriptions SET status='expired' WHERE id=$1`, [row.id]);
    }
    console.log('⏳ Cron executado com sucesso');
  } catch (err) {
    console.error('❌ Erro no cron:', err.message);
  }
});

// 🚀 Porta obrigatória pro Railway
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✅ API Orddex ouvindo em http://${HOST}:${PORT}`);

  if (process.env.BOT_TOKEN) {
    try {
      bot.launch().then(() => console.log('🤖 Bot ON'));
    } catch (e) {
      console.error('⚠️ Falha ao iniciar bot:', e.message);
    }
  }
});
