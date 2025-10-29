import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

// ✅ Corrige leitura e garante conexão mesmo com espaços invisíveis
const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error("❌ DATABASE_URL não definida ou inválida!");
  process.exit(1);
}

// ✅ Conexão PostgreSQL (Railway + Supabase)
export const pool = new Pool({
  connectionString,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}
