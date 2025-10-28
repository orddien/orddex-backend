import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false },
});

pool.on('connect', () => console.log('✅ Conectado ao PostgreSQL (Supabase)'));
pool.on('error', (err) => console.error('❌ Erro de conexão com o banco:', err));

export const query = (text, params) => pool.query(text, params);
export default pool;
