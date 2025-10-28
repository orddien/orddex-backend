import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL || process.env.PG_PROXY_URL;

const pool = new Pool({
  connectionString,
  ssl: { require: true, rejectUnauthorized: false },
});

pool.on('connect', () => console.log('✅ Conectado ao banco PostgreSQL via Proxy'));
pool.on('error', (err) => console.error('❌ Erro de conexão com o banco:', err));

export const query = (text, params) => pool.query(text, params);
export default pool;
