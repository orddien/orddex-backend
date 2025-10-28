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

// 🧩 Configurações básicas
app.use(cors({
  origin: (process.env.CORS_ORIGIN || '*').split(','),
}));
app.use(bodyParser.json({ limit: '1mb' }));

// 🩺 Health check (pra testar se o backend tá vivo)
app.get('/health', (_, res) => {
  res.json({ ok: true });
});

// 🔗 Rotas principais
authRoutes(app);
merchantRoutes(app);
checkoutRoute(app);
webhookPushinPayRoute(app);

// ⏰ Cron job a cada 30 minutos para expirar assinaturas vencidas
cron.schedule('*/30 * * * *', async () => {
  try {
    const r = await query(
      `SELECT id FROM subscriptions WHERE status='active' AND end_at < now()`
    );
    for (const row of r.rows) {
      await query(`UPDATE subscriptions SET status='expired' WHERE id=$1`, [row.id]);
    }
    console.log('⏳ Cron: assinaturas expiradas atualizadas');
  } catch (err) {
    console.error('❌ Erro no cron:', err);
  }
});

// ⚙️ Porta dinâmica para Railway
const PORT = process.env.PORT || 3000;

// 🚀 Inicializa servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API Orddex ouvindo na porta ${PORT}`);

  // 🤖 Inicializa bot de forma segura
  if (process.env.BOT_TOKEN) {
    try {
      bot.launch().then(() => console.log('🤖 Bot ON'));
    } catch (e) {
      console.error('⚠️ Falha ao iniciar bot:', e);
    }
  }
});
