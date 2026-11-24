
import express from 'express';
import dotenv from 'dotenv';
import pool from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
// Cadastrar doação
app.post('/api/doacoes', async (req, res) => {
  const { doador_id, itens } = req.body;

  if (!doador_id || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({
      erro: 'Informe o doador e pelo menos um item'
    });
  }

  const conexao = await pool.getConnection();

  try {
    await conexao.beginTransaction();

    const [doacao] = await conexao.query(
      'INSERT INTO doacao (doador_id) VALUES (?)',
      [doador_id]
    );

    for (const item of itens) {
      if (!item.item_id || !Number.isInteger(item.quantidade) || item.quantidade <= 0) {
        throw new Error('Item ou quantidade inválida');
      }

      await conexao.query(
        'INSERT INTO doacao_item (doacao_id, item_id, quantidade) VALUES (?, ?, ?)',
        [doacao.insertId, item.item_id, item.quantidade]
      );
    }

    await conexao.commit();

    res.status(201).json({
      mensagem: 'Doação cadastrada com sucesso!',
      id: doacao.insertId
    });

  } catch (error) {
    await conexao.rollback();
    res.status(500).json({ erro: error.message });

  } finally {
    conexao.release();
  }
});

// Listar doações
app.get('/api/doacoes', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        doacao.id,
        doador.nome AS doador,
        doacao.data_doacao,
        doacao.status,
        item.nome AS item,
        doacao_item.quantidade
      FROM doacao
      INNER JOIN doador ON doacao.doador_id = doador.id
      INNER JOIN doacao_item ON doacao.id = doacao_item.doacao_id
      INNER JOIN item ON doacao_item.item_id = item.id
      ORDER BY doacao.id DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao consultar doações' });
  }
});
// Cadastrar usuário
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: 'Nome, e-mail e senha são obrigatórios'
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        erro: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const [resultado] = await pool.query(
      'INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );

    res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso',
      id: resultado.insertId
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        erro: 'Este e-mail já está cadastrado'
      });
    }

    console.error(error);
    res.status(500).json({
      erro: 'Erro ao cadastrar usuário'
    });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: 'Informe o e-mail e a senha'
      });
    }

    const [usuarios] = await pool.query(
      'SELECT * FROM usuario WHERE email = ?',
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        erro: 'E-mail ou senha incorretos'
      });
    }

    const usuario = usuarios[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({
        erro: 'E-mail ou senha incorretos'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: 'Erro ao realizar login'
    });
  }
});
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
