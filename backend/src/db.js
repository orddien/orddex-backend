import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

// 🔥 Aceita SSL autoassinado (necessário para Supabase no Render)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
  keepAlive: true,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log('✅ Conectado ao banco PostgreSQL (SSL ativo)');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco:', err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
