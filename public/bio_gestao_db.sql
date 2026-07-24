-- ==============================================================================
-- SCHEMAS & DATABASE STRUCTURE - BIO GESTÃO DE ATIVOS E NOTAS FISCAIS (MYSQL)
-- Versão do MySQL Recomendada: MySQL 8.0+ / MariaDB 10.5+
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "-03:00";

-- ------------------------------------------------------------------------------
-- 1. CRIAÇÃO DO BANCO DE DADOS
-- ------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `bio_gestao_db` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `bio_gestao_db`;

-- ------------------------------------------------------------------------------
-- 2. TABELA DE CONFIGURAÇÕES DO SISTEMA
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `configuracoes_sistema`;
CREATE TABLE `configuracoes_sistema` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome_usuario` VARCHAR(100) NOT NULL DEFAULT 'Administrador' COMMENT 'Nome do usuário principal',
  `empresa` VARCHAR(100) NOT NULL DEFAULT 'Bio Group' COMMENT 'Nome da corporação/empresa',
  `email` VARCHAR(150) NOT NULL DEFAULT 'admin@biogroup.com.br' COMMENT 'E-mail administrativo',
  `tema` ENUM('light', 'dark') NOT NULL DEFAULT 'light' COMMENT 'Tema visual preferencial',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurações gerais do sistema';

-- ------------------------------------------------------------------------------
-- 3. TABELA DE COLABORADORES
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `colaboradores`;
CREATE TABLE `colaboradores` (
  `id` VARCHAR(50) NOT NULL,
  `nome_completo` VARCHAR(150) NOT NULL COMMENT 'Nome completo do colaborador',
  `exibicao` VARCHAR(100) NOT NULL COMMENT 'Nome simplificado para exibição na UI',
  `cpf` VARCHAR(14) NOT NULL COMMENT 'CPF no formato XXX.XXX.XXX-XX',
  `rg` VARCHAR(20) DEFAULT NULL COMMENT 'Documento RG',
  `data_nascimento` DATE DEFAULT NULL COMMENT 'Data de nascimento',
  `cargo` VARCHAR(100) NOT NULL COMMENT 'Cargo ocupado na empresa',
  `setor` VARCHAR(100) NOT NULL COMMENT 'Setor ou departamento de trabalho',
  `email` VARCHAR(150) NOT NULL COMMENT 'Endereço de e-mail profissional',
  `telefone` VARCHAR(20) DEFAULT NULL COMMENT 'Telefone de contato',
  `data_admissao` DATE NOT NULL COMMENT 'Data de contratação',
  `status` ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo' COMMENT 'Situação cadastral',
  `avatar_color` VARCHAR(50) DEFAULT 'bg-blue-500 text-white' COMMENT 'Classe visual de avatar',
  `empresa` VARCHAR(100) DEFAULT NULL COMMENT 'Empresa contratante (Bio Brands, Bio Scientific, etc)',
  `filial` VARCHAR(100) DEFAULT NULL COMMENT 'Filial ou unidade física de trabalho',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_colaborador_cpf` (`cpf`),
  UNIQUE KEY `uk_colaborador_email` (`email`),
  KEY `idx_colaborador_status` (`status`),
  KEY `idx_colaborador_setor` (`setor`),
  KEY `idx_colaborador_empresa` (`empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cadastro de colaboradores e funcionários';

-- ------------------------------------------------------------------------------
-- 4. TABELA DE EQUIPAMENTOS (ATIVOS DE TI/PATRIMÔNIO)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `equipamentos`;
CREATE TABLE `equipamentos` (
  `id` VARCHAR(50) NOT NULL,
  `nome` VARCHAR(150) NOT NULL COMMENT 'Nome descritivo do dispositivo',
  `tipo` ENUM('Desktop', 'Laptop', 'Smartphone', 'Servidor', 'Roteador', 'Wifi', 'Outro') NOT NULL COMMENT 'Categoria técnica do ativo',
  `numero_serie` VARCHAR(100) NOT NULL COMMENT 'Número de série do fabricante',
  `patrimonio` VARCHAR(50) NOT NULL COMMENT 'Código identificador de patrimônio',
  `marca_modelo` VARCHAR(150) DEFAULT NULL COMMENT 'Detalhes de marca e modelo',
  `status` ENUM('Ativo', 'Inativo', 'Em Manutenção', 'Baixado') NOT NULL DEFAULT 'Ativo' COMMENT 'Estado operacional',
  `data_aquisicao` DATE NOT NULL COMMENT 'Data da compra do ativo',
  `colaborador_id` VARCHAR(50) DEFAULT NULL COMMENT 'ID do colaborador responsável pelo ativo',
  `empresa` ENUM('Bio Brands', 'Bio Scientific') NOT NULL COMMENT 'Empresa proprietária do bem',
  `observacoes` TEXT DEFAULT NULL COMMENT 'Notas explicativas sobre o equipamento',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_equipamento_patrimonio` (`patrimonio`),
  KEY `idx_equipamento_status` (`status`),
  KEY `idx_equipamento_tipo` (`tipo`),
  KEY `idx_equipamento_empresa` (`empresa`),
  KEY `idx_equipamento_colaborador` (`colaborador_id`),
  CONSTRAINT `fk_equipamentos_colaboradores` 
    FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Inventário de ativos de TI e equipamentos';

-- ------------------------------------------------------------------------------
-- 5. TABELA DE HISTÓRICO DE MOVIMENTAÇÃO DE EQUIPAMENTOS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `historico_equipamentos`;
CREATE TABLE `historico_equipamentos` (
  `id` VARCHAR(50) NOT NULL,
  `equipamento_id` VARCHAR(50) NOT NULL COMMENT 'Equipamento associado',
  `data` DATETIME NOT NULL COMMENT 'Data e hora do registro',
  `acao` VARCHAR(100) NOT NULL COMMENT 'Tipo da ocorrência (ex: Cadastro, Atribuição)',
  `descricao` TEXT NOT NULL COMMENT 'Descrição detalhada da ação efetuada',
  `usuario` VARCHAR(100) NOT NULL COMMENT 'Nome do usuário registrador',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_historico_equipamento` (`equipamento_id`),
  CONSTRAINT `fk_historico_equipamentos` 
    FOREIGN KEY (`equipamento_id`) REFERENCES `equipamentos` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Histórico de alocações e manutenção de equipamentos';

-- ------------------------------------------------------------------------------
-- 6. TABELA DE NOTAS FISCAIS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `notas_fiscais`;
CREATE TABLE `notas_fiscais` (
  `id` VARCHAR(50) NOT NULL,
  `numero` VARCHAR(50) NOT NULL COMMENT 'Número do documento fiscal',
  `emissor` VARCHAR(200) NOT NULL COMMENT 'Razão Social ou Nome do fornecedor emissor',
  `data_emissao` DATE NOT NULL COMMENT 'Data de emissão da nota fiscal',
  `data_cadastro` DATETIME NOT NULL COMMENT 'Data e hora de inserção no sistema',
  `valor_total_nota` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Somatório total faturado',
  `empresa` ENUM('Bio Brands', 'Bio Scientific') NOT NULL COMMENT 'Empresa destinatária',
  `observacoes` TEXT DEFAULT NULL COMMENT 'Comentários ou justificativas de compra',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nota_numero` (`numero`),
  KEY `idx_nota_data_emissao` (`data_emissao` DESC),
  KEY `idx_nota_empresa` (`empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de notas fiscais de compra';

-- ------------------------------------------------------------------------------
-- 7. TABELA DE ITENS DA NOTA FISCAL
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `nota_fiscal_itens`;
CREATE TABLE `nota_fiscal_itens` (
  `id` VARCHAR(50) NOT NULL,
  `nota_fiscal_id` VARCHAR(50) NOT NULL COMMENT 'Nota Fiscal pai',
  `quantidade` INT NOT NULL DEFAULT 1 COMMENT 'Quantidade comercializada',
  `descricao` VARCHAR(255) NOT NULL COMMENT 'Descrição detalhada do item/produto',
  `valor_unitario` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Valor unitário em R$',
  `valor_total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Valor total do item (qtd * unitario)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_nota_fiscal` (`nota_fiscal_id`),
  CONSTRAINT `fk_itens_nota_fiscal` 
    FOREIGN KEY (`nota_fiscal_id`) REFERENCES `notas_fiscais` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Itens discriminados em cada nota fiscal';

-- ------------------------------------------------------------------------------
-- 8. TABELA DE ANEXOS DA NOTA FISCAL (DOCUMENTOS PDF/XML E BOLETOS)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `nota_fiscal_anexos`;
CREATE TABLE `nota_fiscal_anexos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nota_fiscal_id` VARCHAR(50) NOT NULL COMMENT 'Nota Fiscal vinculada',
  `tipo_anexo` ENUM('Principal', 'Outro') NOT NULL DEFAULT 'Outro' COMMENT 'Categoria do anexo (NF oficial ou boleto)',
  `nome_arquivo` VARCHAR(255) NOT NULL COMMENT 'Nome do arquivo armazenado',
  `tamanho_bytes` INT NOT NULL DEFAULT 0 COMMENT 'Tamanho em bytes do arquivo',
  `tipo_mime` VARCHAR(100) NOT NULL DEFAULT 'application/pdf' COMMENT 'MIME type do documento',
  `conteudo_base64` LONGTEXT DEFAULT NULL COMMENT 'Conteúdo do arquivo codificado em Base64',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_anexo_nota_fiscal` (`nota_fiscal_id`),
  CONSTRAINT `fk_anexos_nota_fiscal` 
    FOREIGN KEY (`nota_fiscal_id`) REFERENCES `notas_fiscais` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Arquivos digitais anexados às notas fiscais';

-- ==============================================================================
-- VIEWS (VISÕES CONSOLIDADAS PARA RELATÓRIOS)
-- ==============================================================================

-- 1. Visão de Equipamentos com Nome do Colaborador Alocado
CREATE OR REPLACE VIEW `vw_equipamentos_detalhados` AS
SELECT 
  e.`id` AS equipamento_id,
  e.`nome` AS equipamento_nome,
  e.`tipo` AS tipo_equipamento,
  e.`patrimonio`,
  e.`numero_serie`,
  e.`marca_modelo`,
  e.`status` AS status_equipamento,
  e.`data_aquisicao`,
  e.`empresa` AS empresa_equipamento,
  c.`id` AS colaborador_id,
  c.`nome_completo` AS colaborador_nome,
  c.`cargo` AS colaborador_cargo,
  c.`setor` AS colaborador_setor,
  c.`email` AS colaborador_email
FROM `equipamentos` e
LEFT JOIN `colaboradores` c ON e.`colaborador_id` = c.`id`;

-- 2. Visão de Resumo Faturado de Notas Fiscais por Empresa
CREATE OR REPLACE VIEW `vw_resumo_faturamento` AS
SELECT 
  `empresa`,
  COUNT(`id`) AS total_notas,
  SUM(`valor_total_nota`) AS valor_total_acumulado,
  MIN(`data_emissao`) AS primeira_emissao,
  MAX(`data_emissao`) AS ultima_emissao
FROM `notas_fiscais`
GROUP BY `empresa`;

-- ==============================================================================
-- INSERÇÃO DE DADOS INICIAIS (SEED DATA)
-- ==============================================================================

INSERT INTO `configuracoes_sistema` (`id`, `nome_usuario`, `empresa`, `email`, `tema`) VALUES
(1, 'Administrador', 'Bio Group', 'admin@biogroup.com.br', 'light')
ON DUPLICATE KEY UPDATE 
  `nome_usuario` = VALUES(`nome_usuario`),
  `empresa` = VALUES(`empresa`),
  `email` = VALUES(`email`);

INSERT INTO `colaboradores` (`id`, `nome_completo`, `exibicao`, `cpf`, `rg`, `data_nascimento`, `cargo`, `setor`, `email`, `telefone`, `data_admissao`, `status`, `avatar_color`, `empresa`, `filial`) VALUES
('colab-1', 'Carlos Henrique Souza', 'Carlos Souza', '123.456.789-00', '12.345.678-9', '1988-04-15', 'Desenvolvedor Software Senior', 'Tecnologia', 'carlos.souza@empresa.com.br', '(11) 98765-4321', '2021-03-10', 'Ativo', 'bg-blue-500 text-white', 'Bio Brands', 'Rio de Janeiro'),
('colab-2', 'Amanda Martins Silva', 'Amanda Silva', '987.654.321-11', '98.765.432-1', '1992-09-22', 'Gerente de Recursos Humanos', 'Recursos Humanos', 'amanda.silva@empresa.com.br', '(11) 97654-3210', '2019-07-01', 'Ativo', 'bg-emerald-500 text-white', 'Bio Scientific', 'Matriz'),
('colab-3', 'Roberto Alves Oliveira', 'Roberto Oliveira', '456.789.123-22', '45.678.912-3', '1985-11-05', 'Analista Financeiro Pleno', 'Financeiro', 'roberto.oliveira@empresa.com.br', '(21) 99876-5432', '2020-01-15', 'Ativo', 'bg-amber-500 text-white', 'Terceiros', 'CDBR116'),
('colab-4', 'Juliana Costa Ramos', 'Juliana Ramos', '789.123.456-33', '78.912.345-6', '1995-07-30', 'Coordenadora de Marketing', 'Marketing', 'juliana.ramos@empresa.com.br', '(11) 95544-3322', '2022-06-18', 'Ativo', 'bg-purple-500 text-white', 'Bio Brands', 'Moema'),
('colab-5', 'Lucas Medeiros Lima', 'Lucas Lima', '234.567.890-44', '23.456.789-0', '1990-12-12', 'Executivo de Vendas', 'Vendas', 'lucas.lima@empresa.com.br', '(31) 98877-6655', '2023-02-01', 'Ativo', 'bg-rose-500 text-white', 'Bio Brands', 'Vila Madalena'),
('colab-6', 'Patrícia Neves Santos', 'Patrícia Santos', '345.678.901-55', '34.567.890-1', '1983-02-28', 'Coordenadora de Operações', 'Operações', 'patricia.santos@empresa.com.br', '(19) 97766-5544', '2018-10-10', 'Inativo', 'bg-slate-500 text-white', 'Bio Scientific', 'CDBR116');

INSERT INTO `equipamentos` (`id`, `nome`, `tipo`, `numero_serie`, `patrimonio`, `marca_modelo`, `status`, `data_aquisicao`, `colaborador_id`, `empresa`, `observacoes`) VALUES
('eq-1', 'Notebook Dell Latitude 5430', 'Laptop', 'DELL-58X9J23', 'PAT-2023-0891', 'Dell Latitude 5430 Core i5 16GB', 'Ativo', '2023-05-12', 'colab-1', 'Bio Brands', 'Entregue com mochila, carregador e mouse sem fio.'),
('eq-2', 'Macbook Pro M2 16"', 'Laptop', 'APPLE-M2-8921A', 'PAT-2023-1102', 'Apple MacBook Pro M2 512GB', 'Ativo', '2023-09-01', 'colab-2', 'Bio Scientific', 'Uso exclusivo da gerência de recursos humanos.'),
('eq-3', 'iPhone 13 Pro 128GB', 'Smartphone', 'APPLE-IPH-9321B', 'PAT-2022-0453', 'Apple iPhone 13 Pro', 'Ativo', '2022-10-15', 'colab-5', 'Bio Brands', 'Linha corporativa habilitada com plano ilimitado.'),
('eq-4', 'Servidor Dell PowerEdge R750', 'Servidor', 'DELL-SERV-0912X', 'PAT-2021-0012', 'Dell PowerEdge R750 64GB', 'Ativo', '2021-11-20', NULL, 'Bio Scientific', 'Hospedado no Rack principal do CPD Central.'),
('eq-5', 'Roteador Cisco ISR 4331', 'Roteador', 'CISCO-ROT-7492A', 'PAT-2020-0083', 'Cisco Integrated Services Router 4331', 'Ativo', '2020-03-05', NULL, 'Bio Brands', 'Link primário de fibra óptica.'),
('eq-6', 'Access Point Wifi Catalyst 9115', 'Wifi', 'CISCO-AP-83921B', 'PAT-2022-0192', 'Cisco Catalyst 9115 Series AP', 'Ativo', '2022-02-14', NULL, 'Bio Scientific', 'Instalado no teto do refeitório Moema.');

INSERT INTO `historico_equipamentos` (`id`, `equipamento_id`, `data`, `acao`, `descricao`, `usuario`) VALUES
('hist-1-1', 'eq-1', '2023-05-12 10:00:00', 'Cadastro de Ativo', 'Equipamento registrado no patrimônio.', 'Admin'),
('hist-1-2', 'eq-1', '2023-05-15 14:30:00', 'Atribuição de Responsável', 'Notebook entregue e assinado pelo colaborador Carlos Oliveira.', 'Admin'),
('hist-2-1', 'eq-2', '2023-09-01 09:15:00', 'Cadastro de Ativo', 'Equipamento registrado no patrimônio corporativo.', 'Admin'),
('hist-2-2', 'eq-2', '2023-09-02 11:00:00', 'Atribuição de Responsável', 'Macbook Pro entregue à colaboradora Ana Costa.', 'Admin'),
('hist-3-1', 'eq-3', '2022-10-15 15:20:00', 'Cadastro de Ativo', 'Smartphone cadastrado no inventário.', 'Admin'),
('hist-3-2', 'eq-3', '2022-10-16 10:00:00', 'Atribuição de Responsável', 'Aparelho celular entregue ao colaborador Roberto Souza.', 'Admin'),
('hist-4-1', 'eq-4', '2021-11-20 08:30:00', 'Cadastro de Ativo', 'Instalado no Rack 02 do Data Center Moema.', 'Admin'),
('hist-5-1', 'eq-5', '2020-03-05 14:00:00', 'Cadastro de Ativo', 'Roteador configurado e instalado no CPD Central.', 'Admin'),
('hist-6-1', 'eq-6', '2022-02-14 09:00:00', 'Cadastro de Ativo', 'Ponto de acesso instalado e provisionado na rede WiFi Corporativa.', 'Admin');

INSERT INTO `notas_fiscais` (`id`, `numero`, `emissor`, `data_emissao`, `data_cadastro`, `valor_total_nota`, `empresa`, `observacoes`) VALUES
('nf-1', '124981', 'Dell Computadores do Brasil Ltda', '2026-06-15', '2026-06-16 14:30:00', 13498.00, 'Bio Brands', 'Aquisição de notebooks corporativos de alta performance.'),
('nf-2', '54312', 'Alpha Equipamentos Científicos S.A.', '2026-07-02', '2026-07-03 10:15:00', 24500.00, 'Bio Scientific', 'Substituição de equipamentos laboratoriais e calibradores.');

INSERT INTO `nota_fiscal_itens` (`id`, `nota_fiscal_id`, `quantidade`, `descricao`, `valor_unitario`, `valor_total`) VALUES
('nfi-1-1', 'nf-1', 2, 'Notebook Dell Latitude 3440 Intel Core i5 16GB RAM 512GB SSD', 5499.00, 10998.00),
('nfi-1-2', 'nf-1', 1, 'Monitor Dell 27" SE2722H Full HD HDMI/VGA', 1250.00, 1250.00),
('nfi-1-3', 'nf-1', 5, 'Kit Mouse e Teclado Sem Fio Dell KM3322W USB', 250.00, 1250.00),
('nfi-2-1', 'nf-2', 1, 'Balança de Precisão Analítica Bio-Precision 0.1mg', 18500.00, 18500.00),
('nfi-2-2', 'nf-2', 2, 'Termômetro Digital Científico Calibrado RBC', 3000.00, 6000.00);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
