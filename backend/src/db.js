import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Função que tenta conectar com fallback entre .co e .net
async function createPool() {
  let connString = process.env.DATABASE_URL;
  let pool;

  try {
    console.log('Tentando conectar com host original...');
    pool = new Pool({
      connectionString: connString,
      ssl: { require: true, rejectUnauthorized: false },
      keepAlive: true,
      connectionTimeoutMillis: 10000,
    });
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao banco PostgreSQL (host original)');
    return pool;
  } catch (err) {
    console.warn('⚠️ Falha no host original:', err.code || err.message);
    // Tenta fallback .net
    const fallback = connString.replace('.supabase.co', '.supabase.net');
    console.log('Tentando fallback:', fallback);
    pool = new Pool({
      connectionString: fallback,
      ssl: { require: true, rejectUnauthorized: false },
      keepAlive: true,
      connectionTimeoutMillis: 10000,
    });
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao banco PostgreSQL (fallback .net)');
    return pool;
  }
}

let pool;
await createPool().then(p => (pool = p)).catch(e => {
  console.error('❌ Falha total de conexão:', e);
  process.exit(1);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
