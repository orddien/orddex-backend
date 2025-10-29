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

// Health check
app.get('/health', (_, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Rotas principais
authRoutes(app);
merchantRoutes(app);
checkoutRoute(app);
webhookPushinPayRoute(app);

// Cron para expiração
cron.schedule('*/30 * * * *', async () => {
  try {
    const r = await query(`SELECT id FROM subscriptions WHERE status='active' AND end_at < now()`);
    for (const row of r.rows)
      await query(`UPDATE subscriptions SET status='expired' WHERE id=$1`, [row.id]);
    console.log('⏳ Cron executado com sucesso');
  } catch (err) {
    console.error('❌ Erro no cron:', err.message);
  }
});

// Porta e host
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ API Orddex ouvindo em http://${HOST}:${PORT}`);
});

// Tratamento de erros globais
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Promessa não tratada:', reason);
});
process.on('uncaughtException', err => {
  console.error('💥 Erro não capturado:', err);
});

// Inicializa bot
(async () => {
  try {
    if (process.env.BOT_TOKEN) {
      await bot.launch();
      console.log('🤖 Bot ON');
    } else {
      console.log('⚠️ BOT_TOKEN não definido, bot não iniciado.');
    }
  } catch (err) {
    console.error('❌ Falha ao iniciar bot:', err.message);
  }
})();
