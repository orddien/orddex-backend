import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export default function authRoutes(app) {
  const JWT_SECRET = process.env.JWT_SECRET || 'troque-me';

  app.post('/auth/registrar', async (req, res) => {
    try {
      const { nome, email, senha } = req.body || {};
      if (!nome || !email || !senha) return res.status(400).json({ erro: 'nome, email e senha são obrigatórios' });
      const apiKey = 'ok_' + crypto.randomBytes(16).toString('hex');
      const hash = await bcrypt.hash(senha, 10);
      const r = await query(
        `INSERT INTO merchants (name, api_key, email, password_hash)
         VALUES ($1,$2,$3,$4) RETURNING id, api_key`,
        [nome, apiKey, email.toLowerCase(), hash]
      );
      const token = jwt.sign({ sub: r.rows[0].id, email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ ok: true, token, api_key: r.rows[0].api_key });
    } catch (e) { console.error(e); res.status(500).json({ erro: 'falha no cadastro' }); }
  });

  app.post('/auth/login', async (req, res) => {
    try {
      const { email, senha } = req.body || {};
      if (!email || !senha) return res.status(400).json({ erro: 'email e senha são obrigatórios' });
      const r = await query(`SELECT id, password_hash, api_key FROM merchants WHERE email=$1`, [email.toLowerCase()]);
      if (!r.rows.length) return res.status(401).json({ erro: 'credenciais inválidas' });
      const ok = await bcrypt.compare(senha, r.rows[0].password_hash || '');
      if (!ok) return res.status(401).json({ erro: 'credenciais inválidas' });
      const token = jwt.sign({ sub: r.rows[0].id, email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ ok: true, token, api_key: r.rows[0].api_key });
    } catch (e) { console.error(e); res.status(500).json({ erro: 'falha no login' }); }
  });
}
