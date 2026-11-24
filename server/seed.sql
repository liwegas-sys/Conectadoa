
INSERT INTO categoria (nome) VALUES
('Alimentos'),
('Roupas'),
('Higiene'),
('Material escolar');

INSERT INTO doador (nome, email, telefone) VALUES
('João Silva', 'joao@email.com', '11999990000'),
('Maria Santos', 'maria@email.com', '11988880000');

INSERT INTO item (nome, descricao, categoria_id, quantidade) VALUES
('Arroz 5kg', 'Pacote de arroz de 5 quilos', 1, 20),
('Feijão 1kg', 'Pacote de feijão de 1 quilo', 1, 15),
('Camisa', 'Camisa para doação', 2, 10),
('Sabonete', 'Sabonete para higiene pessoal', 3, 30),
('Caderno', 'Caderno escolar', 4, 25);
