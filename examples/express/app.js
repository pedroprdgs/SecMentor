// VULNERÁVEL DE PROPÓSITO. Dados fictícios. Use somente em localhost.
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import child_process from 'node:child_process';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';
const app = express();
app.use(express.json());
app.use(cors({ origin: '*', credentials: true }));
const apiKey = 'sk_demo_nao_e_uma_chave_real';
const db = { query: (query) => console.log('Simulação de query:', query) };
app.get('/usuarios', (req, res) => {
  db.query('SELECT * FROM users WHERE id = ' + req.query.id);
  res.cookie('session', 'ficticia', { httpOnly: false, secure: false });
  res.json({ ok: true, demo: apiKey.slice(0, 7) });
});
// Funções para inspeção estática. Estas rotas não são expostas pelo servidor.
export function exemplos(req, res, token, expectedToken) {
  const passwordHash = crypto.createHash('md5').update(req.body.password).digest('hex');
  eval(req.body.expression);
  child_process.exec('echo ' + req.query.name);
  fs.readFile(req.query.path, () => {});
  const user = jwt.decode(token);
  if (token == expectedToken) res.json({ user, passwordHash });
}
if (process.env.SECMENTOR_RUN_UNSAFE_DEMO === 'sim') {
  app.listen(3010, '127.0.0.1', () => console.log('Demo didática em http://127.0.0.1:3010'));
}
