import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// 🔧 Corrige URLs com parâmetros codificados (orddien%262026 → ordien&2026)
const connectionString = process.env.DATABASE_URL.replace('%26', '&');

// 🔥 Cria pool com SSL manualmente forçado
const pool = new Pool({
  connectionString,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

pool.on('connect', () => {
  console.log('✅ Conectado ao banco PostgreSQL com SSL ignorando certificado');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco:', err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
