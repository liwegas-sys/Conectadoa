
import express from 'express';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config({ path: './server/.env' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Verificação da API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ConectaDoa',
    hora: new Date().toISOString()
  });
});

// Listar doadores
app.get('/api/doadores', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM doador ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao consultar doadores' });
  }
});

// Listar categorias
app.get('/api/categorias', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categoria ORDER BY id'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao consultar categorias' });
  }
});

// Listar itens
app.get('/api/itens', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT item.*, categoria.nome AS categoria
      FROM item
      INNER JOIN categoria
      ON item.categoria_id = categoria.id
      ORDER BY item.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao consultar itens' });
  }
});

// Cadastrar doador
app.post('/api/doadores', async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        erro: 'Nome e e-mail são obrigatórios'
      });
    }

    const [resultado] = await pool.query(
      'INSERT INTO doador (nome, email, telefone) VALUES (?, ?, ?)',
      [nome, email, telefone || null]
    );

    res.status(201).json({
      id: resultado.insertId,
      nome,
      email,
      telefone
    });
  } catch (error) {
    console.error(error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        erro: 'Este e-mail já está cadastrado'
      });
    }

    res.status(500).json({ erro: 'Erro ao cadastrar doador' });
  }
});

;

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ConectaDoa',
    hora: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
