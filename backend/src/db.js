import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

// 🔥 Força o Node a aceitar certificados autoassinados globalmente
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Corrige caso a senha tenha & codificado
const connectionString = process.env.DATABASE_URL.replace('%26', '&');

const pool = new Pool({
  connectionString,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

pool.on('connect', () => {
  console.log('✅ Conectado ao banco PostgreSQL (SSL ignorando certificado)');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco:', err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
