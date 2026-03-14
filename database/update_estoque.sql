-- SQL para atualizar a tabela 'estoque' no Supabase
-- Execute este comando no SQL Editor do seu projeto Supabase

ALTER TABLE estoque 
ADD COLUMN IF NOT EXISTS quantidade DECIMAL(10,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS modo_estocagem VARCHAR(50) DEFAULT 'un',
ADD COLUMN IF NOT EXISTS custo DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS preco_venda DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW();

-- Libera o acesso para que o servidor possa salvar os itens
ALTER TABLE estoque DISABLE ROW LEVEL SECURITY;

-- Dica: Após rodar este comando, recarregue a página de estoque no site.
