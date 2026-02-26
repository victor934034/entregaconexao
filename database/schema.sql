-- TABELA: usuarios
CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  senha_hash    VARCHAR(255) NOT NULL,
  perfil        ENUM('SUPER_ADM','ADM','ENTREGADOR') NOT NULL DEFAULT 'ENTREGADOR',
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TABELA: permissoes_usuario (permissões customizadas por usuário)
CREATE TABLE permissoes_usuario (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  permissao   VARCHAR(60) NOT NULL,
  permitido   BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uq_usuario_permissao (usuario_id, permissao)
);

-- TABELA: pedidos
CREATE TABLE pedidos (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  numero_pedido        VARCHAR(20) NOT NULL UNIQUE,
  data_pedido          DATETIME NOT NULL,
  data_entrega_inicio  DATE,
  data_saida           DATE,
  hora_prevista        TIME,

  -- Dados do cliente
  nome_cliente         VARCHAR(150),
  telefone_cliente     VARCHAR(20),
  email_cliente        VARCHAR(150),
  celular_cliente      VARCHAR(20),

  -- Endereço de entrega
  logradouro           VARCHAR(200),
  numero_end           VARCHAR(20),
  complemento          VARCHAR(100),
  bairro               VARCHAR(100),
  cidade               VARCHAR(100),
  estado               CHAR(2),
  cep                  VARCHAR(10),
  endereco_completo    TEXT,

  -- Financeiro
  total_itens          DECIMAL(10,2) DEFAULT 0.00,
  total_liquido        DECIMAL(10,2) DEFAULT 0.00,
  forma_pagamento      VARCHAR(30),
  vencimento           DATE,

  -- Controle
  status               ENUM('PENDENTE','EM_ROTA','ENTREGUE','CANCELADO') DEFAULT 'PENDENTE',
  entregador_id        INT,
  observacoes          TEXT,
  arquivo_pdf_path     VARCHAR(500),
  criado_por           INT,
  criado_em            DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (entregador_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- TABELA: itens_pedido
CREATE TABLE itens_pedido (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id       INT NOT NULL,
  codigo          VARCHAR(30),
  descricao       VARCHAR(300) NOT NULL,
  quantidade      DECIMAL(10,3) NOT NULL,
  unidade         VARCHAR(10),
  valor_unitario  DECIMAL(10,2),
  valor_total     DECIMAL(10,2),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- TABELA: historico_status (log de todas as mudanças de status)
CREATE TABLE historico_status (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id    INT NOT NULL,
  status_de    VARCHAR(20),
  status_para  VARCHAR(20) NOT NULL,
  alterado_por INT,
  observacao   TEXT,
  alterado_em  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (alterado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- TABELA: sessoes_revogadas (controle de tokens JWT inválidos / logout)
CREATE TABLE sessoes_revogadas (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  token_jti  VARCHAR(255) NOT NULL UNIQUE,
  revogado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
