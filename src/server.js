// 🚀 Porta obrigatória pro Railway
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// Garante que a porta é número e o app responde
app.listen(parseInt(PORT, 10), HOST, () => {
  console.log(`✅ API Orddex ouvindo na porta ${PORT}`);

  if (process.env.BOT_TOKEN) {
    try {
      bot.launch().then(() => console.log('🤖 Bot ON'));
    } catch (e) {
      console.error('⚠️ Falha ao iniciar bot:', e.message);
    }
  }
});

// Tratamento global de erros (garante que o app nunca cai)
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não tratado:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Promessa rejeitada:', reason);
});
