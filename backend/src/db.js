import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const query=(t,p)=>pool.query(t,p);
export default pool;
