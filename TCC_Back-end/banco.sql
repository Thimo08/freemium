CREATE DATABASE IF NOT EXISTS edutech;

USE edutech;

-- Tabela para Instituições (Escolas/Empresas)
CREATE TABLE IF NOT EXISTS Instituicao (
    id_instituicao SERIAL PRIMARY KEY,
    nome_instituicao VARCHAR(150) NOT NULL,
    email_contato VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL -- Em produção, use senhas com hash
);

-- Tabela de Usuários (Alunos) com vínculo à instituição
CREATE TABLE IF NOT EXISTS Usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo_plano ENUM('freemium', 'premium') NOT NULL DEFAULT 'premium',
    id_instituicao BIGINT UNSIGNED, -- Chave estrangeira para a instituição
    FOREIGN KEY (id_instituicao) REFERENCES Instituicao(id_instituicao) ON DELETE SET NULL
);

-- Inserir uma instituição de exemplo para você poder testar
INSERT INTO Instituicao (nome_instituicao, email_contato, senha) 
VALUES ('Escola Exemplo Digital', 'admin@escola.com', 'admin123');



Email: admin@escola.com

Senha: admin123