import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

// Conexão PostgreSQL (modo Railway)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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
