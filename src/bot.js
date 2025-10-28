import { Telegraf } from 'telegraf';
import { query } from './db.js';

export const bot = new Telegraf(process.env.BOT_TOKEN || '');

bot.start(async (ctx) => {
  const tg = ctx.from;
  try {
    await query(
      `INSERT INTO customers (telegram_id, name, username)
       VALUES ($1,$2,$3)
       ON CONFLICT (telegram_id) DO UPDATE SET name=EXCLUDED.name, username=EXCLUDED.username`,
      [String(tg.id), tg.first_name || '', tg.username || null]
    );
    await ctx.reply(`Bem-vindo à Orddex! Para assinar, acesse: ${process.env.APP_BASE_URL || ''}/planos`);
  } catch (e) { console.error(e); }
});

export async function enviarConvite({ telegramId, chatId }) {
  if (!bot?.telegram || !chatId) return;
  const link = await bot.telegram.createChatInviteLink(chatId, { name: `orddex-${Date.now()}`, creates_join_request: false });
  await bot.telegram.sendMessage(telegramId, `✅ Pagamento aprovado! Entre no grupo: ${link.invite_link}`);
}

export default bot;
