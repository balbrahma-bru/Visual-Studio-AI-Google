import { Colaborador, Equipamento, NotaFiscal, UserSettings, EmpresaFilial } from '../types';
import { INITIAL_COLABORADORES, INITIAL_EQUIPAMENTOS, INITIAL_NOTAS_FISCAIS, INITIAL_EMPRESAS_FILIAIS } from '../data';

/**
 * Escapes strings safely for SQL insertion
 */
function escapeSqlString(str: string | undefined | null): string {
  if (str === undefined || str === null) return 'NULL';
  const escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  return `'${escaped}'`;
}

/**
 * Generates complete MySQL DDL + DML script for the entire application
 */
export function generateMySQLScript(
  colaboradores: Colaborador[] = INITIAL_COLABORADORES,
  equipamentos: Equipamento[] = INITIAL_EQUIPAMENTOS as Equipamento[],
  notasFiscais: NotaFiscal[] = INITIAL_NOTAS_FISCAIS as NotaFiscal[],
  userSettings?: UserSettings,
  empresasFiliais: EmpresaFilial[] = INITIAL_EMPRESAS_FILIAIS as EmpresaFilial[]
): string {
  const dateStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  return `-- ==============================================================================
-- SCHEMAS & DATABASE STRUCTURE - BIO GESTÃO DE ATIVOS E NOTAS FISCAIS (MYSQL)
-- Data de Geração: ${dateStr}
-- Versão do MySQL Recomendada: MySQL 8.0+ / MariaDB 10.5+
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "-03:00";

-- ------------------------------------------------------------------------------
-- 1. CRIAÇÃO DO BANCO DE DADOS
-- ------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS \`bio_gestao_db\` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE \`bio_gestao_db\`;

-- ------------------------------------------------------------------------------
-- 2. TABELA DE CONFIGURAÇÕES DO SISTEMA
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`configuracoes_sistema\`;
CREATE TABLE \`configuracoes_sistema\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome_usuario\` VARCHAR(100) NOT NULL DEFAULT 'Administrador' COMMENT 'Nome do usuário principal',
  \`empresa\` VARCHAR(100) NOT NULL DEFAULT 'Bio Group' COMMENT 'Nome da corporação/empresa',
  \`email\` VARCHAR(150) NOT NULL DEFAULT 'admin@biogroup.com.br' COMMENT 'E-mail administrativo',
  \`tema\` ENUM('light', 'dark') NOT NULL DEFAULT 'light' COMMENT 'Tema visual preferencial',
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurações gerais do sistema';

-- ------------------------------------------------------------------------------
-- 3. TABELA DE EMPRESAS E FILIAIS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`empresas_filiais\`;
CREATE TABLE \`empresas_filiais\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`id_empresa\` INT NOT NULL COMMENT 'Código identificador numérico da empresa/filial',
  \`empresa\` VARCHAR(100) NOT NULL COMMENT 'Nome da empresa (ex: BIO BRANDS, BIO SCIENTIFIC)',
  \`filial\` VARCHAR(100) NOT NULL COMMENT 'Nome da unidade/filial (ex: MATRIZ, ALPHAVILLE)',
  \`razao_social\` VARCHAR(200) NOT NULL COMMENT 'Razão social completa',
  \`nome_fantasia\` VARCHAR(200) DEFAULT NULL COMMENT 'Nome fantasia / Apelido da unidade',
  \`cnpj\` VARCHAR(20) DEFAULT NULL COMMENT 'CNPJ formatado',
  \`ie\` VARCHAR(50) DEFAULT NULL COMMENT 'Inscrição Estadual',
  \`im\` VARCHAR(50) DEFAULT NULL COMMENT 'Inscrição Municipal',
  \`cnae\` VARCHAR(150) DEFAULT NULL COMMENT 'CNAE principal',
  \`regime_tributario\` VARCHAR(50) DEFAULT NULL COMMENT 'Regime tributário',
  \`data_abertura\` DATE DEFAULT NULL COMMENT 'Data de fundação / abertura',
  \`cep\` VARCHAR(10) DEFAULT NULL COMMENT 'CEP de localização',
  \`logradouro\` VARCHAR(200) DEFAULT NULL COMMENT 'Rua, Avenida, etc.',
  \`numero\` VARCHAR(20) DEFAULT NULL COMMENT 'Número predial',
  \`complemento\` VARCHAR(100) DEFAULT NULL COMMENT 'Complemento, Bloco, Sala',
  \`bairro\` VARCHAR(100) DEFAULT NULL COMMENT 'Bairro',
  \`cidade\` VARCHAR(100) DEFAULT NULL COMMENT 'Cidade / Município',
  \`uf\` VARCHAR(2) DEFAULT NULL COMMENT 'Unidade Federativa / Estado',
  \`telefone\` VARCHAR(30) DEFAULT NULL COMMENT 'Telefone fixo / celular principal',
  \`telefone_secundario\` VARCHAR(30) DEFAULT NULL COMMENT 'Telefone adicional',
  \`email\` VARCHAR(150) DEFAULT NULL COMMENT 'E-mail institucional da filial',
  \`responsavel\` VARCHAR(150) DEFAULT NULL COMMENT 'Nome do gerente / responsável',
  \`cargo_responsavel\` VARCHAR(100) DEFAULT NULL COMMENT 'Cargo do responsável',
  \`rede\` VARCHAR(50) DEFAULT NULL COMMENT 'Faixa de sub-rede IP (ex: 192.168.002.000/23)',
  \`gateway\` VARCHAR(50) DEFAULT NULL COMMENT 'IP do Gateway padrão',
  \`dns\` VARCHAR(100) DEFAULT NULL COMMENT 'Servidores DNS',
  \`provedor_internet\` VARCHAR(100) DEFAULT NULL COMMENT 'Provedor de conexão de rede',
  \`observacoes\` TEXT DEFAULT NULL COMMENT 'Anotações gerais e operacionais',
  \`ativo\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 para Ativo, 0 para Inativo',
  \`data_desativacao\` DATE DEFAULT NULL COMMENT 'Data em que a unidade/filial foi desativada (Ativo = 0)',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_empresa_nome\` (\`empresa\`),
  KEY \`idx_filial_nome\` (\`filial\`),
  KEY \`idx_cidade_uf\` (\`cidade\`, \`uf\`),
  KEY \`idx_rede_ip\` (\`rede\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cadastro institucional de empresas, filiais, endereços e redes IP';

-- ------------------------------------------------------------------------------
-- 4. TABELA DE COLABORADORES
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`colaboradores\`;
CREATE TABLE \`colaboradores\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`nome_completo\` VARCHAR(150) NOT NULL COMMENT 'Nome completo do colaborador',
  \`exibicao\` VARCHAR(100) NOT NULL COMMENT 'Nome simplificado para exibição na UI',
  \`cpf\` VARCHAR(14) NOT NULL COMMENT 'CPF no formato XXX.XXX.XXX-XX',
  \`rg\` VARCHAR(20) DEFAULT NULL COMMENT 'Documento RG',
  \`matricula\` VARCHAR(7) DEFAULT NULL COMMENT 'Código de matrícula de até 7 caracteres',
  \`data_nascimento\` DATE DEFAULT NULL COMMENT 'Data de nascimento',
  \`cargo\` VARCHAR(100) NOT NULL COMMENT 'Cargo ocupado na empresa',
  \`setor\` VARCHAR(100) NOT NULL COMMENT 'Setor ou departamento de trabalho',
  \`email\` VARCHAR(150) NOT NULL COMMENT 'Endereço de e-mail profissional',
  \`telefone\` VARCHAR(20) DEFAULT NULL COMMENT 'Telefone de contato',
  \`data_admissao\` DATE NOT NULL COMMENT 'Data de contratação',
  \`status\` ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo' COMMENT 'Situação cadastral',
  \`avatar_color\` VARCHAR(50) DEFAULT 'bg-blue-500 text-white' COMMENT 'Classe visual de avatar',
  \`empresa\` VARCHAR(100) DEFAULT NULL COMMENT 'Empresa contratante (Bio Brands, Bio Scientific, etc)',
  \`filial\` VARCHAR(100) DEFAULT NULL COMMENT 'Filial ou unidade física de trabalho',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_colaborador_cpf\` (\`cpf\`),
  UNIQUE KEY \`uk_colaborador_email\` (\`email\`),
  KEY \`idx_colaborador_status\` (\`status\`),
  KEY \`idx_colaborador_setor\` (\`setor\`),
  KEY \`idx_colaborador_empresa\` (\`empresa\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cadastro de colaboradores e funcionários';

-- ------------------------------------------------------------------------------
-- 4. TABELA DE EQUIPAMENTOS (ATIVOS DE TI/PATRIMÔNIO)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`equipamentos\`;
CREATE TABLE \`equipamentos\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`nome\` VARCHAR(150) NOT NULL COMMENT 'Nome descritivo do dispositivo',
  \`tipo\` ENUM('Desktop', 'Laptop', 'Smartphone', 'Servidor', 'Roteador', 'Wifi', 'Outro') NOT NULL COMMENT 'Categoria técnica do ativo',
  \`numero_serie\` VARCHAR(100) NOT NULL COMMENT 'Número de série do fabricante',
  \`patrimonio\` VARCHAR(50) NOT NULL COMMENT 'Código identificador de patrimônio',
  \`marca_modelo\` VARCHAR(150) DEFAULT NULL COMMENT 'Detalhes de marca e modelo',
  \`status\` ENUM('Ativo', 'Inativo', 'Em Manutenção', 'Baixado') NOT NULL DEFAULT 'Ativo' COMMENT 'Estado operacional',
  \`data_aquisicao\` DATE NOT NULL COMMENT 'Data da compra do ativo',
  \`colaborador_id\` VARCHAR(50) DEFAULT NULL COMMENT 'ID do colaborador responsável pelo ativo',
  \`empresa\` ENUM('Bio Brands', 'Bio Scientific') NOT NULL COMMENT 'Empresa proprietária do bem',
  \`observacoes\` TEXT DEFAULT NULL COMMENT 'Notas explicativas sobre o equipamento',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_equipamento_patrimonio\` (\`patrimonio\`),
  KEY \`idx_equipamento_status\` (\`status\`),
  KEY \`idx_equipamento_tipo\` (\`tipo\`),
  KEY \`idx_equipamento_empresa\` (\`empresa\`),
  KEY \`idx_equipamento_colaborador\` (\`colaborador_id\`),
  CONSTRAINT \`fk_equipamentos_colaboradores\` 
    FOREIGN KEY (\`colaborador_id\`) REFERENCES \`colaboradores\` (\`id\`) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Inventário de ativos de TI e equipamentos';

-- ------------------------------------------------------------------------------
-- 5. TABELA DE HISTÓRICO DE MOVIMENTAÇÃO DE EQUIPAMENTOS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`historico_equipamentos\`;
CREATE TABLE \`historico_equipamentos\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`equipamento_id\` VARCHAR(50) NOT NULL COMMENT 'Equipamento associado',
  \`data\` DATETIME NOT NULL COMMENT 'Data e hora do registro',
  \`acao\` VARCHAR(100) NOT NULL COMMENT 'Tipo da ocorrência (ex: Cadastro, Atribuição)',
  \`descricao\` TEXT NOT NULL COMMENT 'Descrição detalhada da ação efetuada',
  \`usuario\` VARCHAR(100) NOT NULL COMMENT 'Nome do usuário registrador',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_historico_equipamento\` (\`equipamento_id\`),
  CONSTRAINT \`fk_historico_equipamentos\` 
    FOREIGN KEY (\`equipamento_id\`) REFERENCES \`equipamentos\` (\`id\`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Histórico de alocações e manutenção de equipamentos';

-- ------------------------------------------------------------------------------
-- 6. TABELA DE NOTAS FISCAIS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`notas_fiscais\`;
CREATE TABLE \`notas_fiscais\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`numero\` VARCHAR(50) NOT NULL COMMENT 'Número do documento fiscal',
  \`emissor\` VARCHAR(200) NOT NULL COMMENT 'Razão Social ou Nome do fornecedor emissor',
  \`data_emissao\` DATE NOT NULL COMMENT 'Data de emissão da nota fiscal',
  \`data_cadastro\` DATETIME NOT NULL COMMENT 'Data e hora de inserção no sistema',
  \`valor_total_nota\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Somatório total faturado',
  \`empresa\` ENUM('Bio Brands', 'Bio Scientific') NOT NULL COMMENT 'Empresa destinatária',
  \`filial\` VARCHAR(100) DEFAULT NULL COMMENT 'Filial da empresa pagadora',
  \`contrato\` VARCHAR(100) DEFAULT NULL COMMENT 'Número ou identificador do contrato',
  \`observacoes\` TEXT DEFAULT NULL COMMENT 'Comentários ou justificativas de compra',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_nota_numero\` (\`numero\`),
  KEY \`idx_nota_data_emissao\` (\`data_emissao\` DESC),
  KEY \`idx_nota_empresa\` (\`empresa\`),
  KEY \`idx_nota_filial\` (\`filial\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de notas fiscais de compra';

-- ------------------------------------------------------------------------------
-- 7. TABELA DE ITENS DA NOTA FISCAL
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`nota_fiscal_itens\`;
CREATE TABLE \`nota_fiscal_itens\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`nota_fiscal_id\` VARCHAR(50) NOT NULL COMMENT 'Nota Fiscal pai',
  \`quantidade\` INT NOT NULL DEFAULT 1 COMMENT 'Quantidade comercializada',
  \`descricao\` VARCHAR(255) NOT NULL COMMENT 'Descrição detalhada do item/produto',
  \`valor_unitario\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Valor unitário em R$',
  \`valor_total\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Valor total do item (qtd * unitario)',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_item_nota_fiscal\` (\`nota_fiscal_id\`),
  CONSTRAINT \`fk_itens_nota_fiscal\` 
    FOREIGN KEY (\`nota_fiscal_id\`) REFERENCES \`notas_fiscais\` (\`id\`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Itens discriminados em cada nota fiscal';

-- ------------------------------------------------------------------------------
-- 8. TABELA DE ANEXOS DA NOTA FISCAL (DOCUMENTOS PDF/XML E BOLETOS)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`nota_fiscal_anexos\`;
CREATE TABLE \`nota_fiscal_anexos\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nota_fiscal_id\` VARCHAR(50) NOT NULL COMMENT 'Nota Fiscal vinculada',
  \`tipo_anexo\` ENUM('Principal', 'Outro') NOT NULL DEFAULT 'Outro' COMMENT 'Categoria do anexo (NF oficial ou boleto)',
  \`nome_arquivo\` VARCHAR(255) NOT NULL COMMENT 'Nome do arquivo armazenado',
  \`tamanho_bytes\` INT NOT NULL DEFAULT 0 COMMENT 'Tamanho em bytes do arquivo',
  \`tipo_mime\` VARCHAR(100) NOT NULL DEFAULT 'application/pdf' COMMENT 'MIME type do documento',
  \`conteudo_base64\` LONGTEXT DEFAULT NULL COMMENT 'Conteúdo do arquivo codificado em Base64',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY \`idx_anexo_nota_fiscal\` (\`nota_fiscal_id\`),
  CONSTRAINT \`fk_anexos_nota_fiscal\` 
    FOREIGN KEY (\`nota_fiscal_id\`) REFERENCES \`notas_fiscais\` (\`id\`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Arquivos digitais anexados às notas fiscais';

-- ==============================================================================
-- VIEWS (VISÕES CONSOLIDADAS PARA RELATÓRIOS)
-- ==============================================================================

-- 1. Visão de Equipamentos com Nome do Colaborador Alocado
CREATE OR REPLACE VIEW \`vw_equipamentos_detalhados\` AS
SELECT 
  e.\`id\` AS equipamento_id,
  e.\`nome\` AS equipamento_nome,
  e.\`tipo\` AS tipo_equipamento,
  e.\`patrimonio\`,
  e.\`numero_serie\`,
  e.\`marca_modelo\`,
  e.\`status\` AS status_equipamento,
  e.\`data_aquisicao\`,
  e.\`empresa\` AS empresa_equipamento,
  c.\`id\` AS colaborador_id,
  c.\`nome_completo\` AS colaborador_nome,
  c.\`cargo\` AS colaborador_cargo,
  c.\`setor\` AS colaborador_setor,
  c.\`email\` AS colaborador_email
FROM \`equipamentos\` e
LEFT JOIN \`colaboradores\` c ON e.\`colaborador_id\` = c.\`id\`;

-- 2. Visão de Resumo Faturado de Notas Fiscais por Empresa
CREATE OR REPLACE VIEW \`vw_resumo_faturamento\` AS
SELECT 
  \`empresa\`,
  COUNT(\`id\`) AS total_notas,
  SUM(\`valor_total_nota\`) AS valor_total_acumulado,
  MIN(\`data_emissao\`) AS primeira_emissao,
  MAX(\`data_emissao\`) AS ultima_emissao
FROM \`notas_fiscais\`
GROUP BY \`empresa\`;

-- ==============================================================================
-- INSERÇÃO DE DADOS INICIAIS (SEED DATA)
-- ==============================================================================

-- 1. Inserir Configurações do Sistema
INSERT INTO \`configuracoes_sistema\` (\`id\`, \`nome_usuario\`, \`empresa\`, \`email\`, \`tema\`) VALUES
(1, ${escapeSqlString(userSettings?.nomeUsuario || 'Administrador')}, ${escapeSqlString(userSettings?.empresa || 'Bio Group')}, ${escapeSqlString(userSettings?.email || 'admin@biogroup.com.br')}, ${escapeSqlString(userSettings?.tema || 'light')})
ON DUPLICATE KEY UPDATE 
  \`nome_usuario\` = VALUES(\`nome_usuario\`),
  \`empresa\` = VALUES(\`empresa\`),
  \`email\` = VALUES(\`email\`);

-- 2. Inserir Empresas e Filiais
INSERT INTO \`empresas_filiais\` (
  \`id\`, \`id_empresa\`, \`empresa\`, \`filial\`, \`razao_social\`, \`nome_fantasia\`, 
  \`cnpj\`, \`ie\`, \`im\`, \`cnae\`, \`regime_tributario\`, \`data_abertura\`,
  \`cep\`, \`logradouro\`, \`numero\`, \`complemento\`, \`bairro\`, \`cidade\`, \`uf\`,
  \`telefone\`, \`telefone_secundario\`, \`email\`, \`responsavel\`, \`cargo_responsavel\`,
  \`rede\`, \`gateway\`, \`dns\`, \`provedor_internet\`, \`observacoes\`, \`ativo\`, \`data_desativacao\`
) VALUES
${empresasFiliais.map(f => `(${escapeSqlString(f.id)}, ${f.idEmpresa}, ${escapeSqlString(f.empresa)}, ${escapeSqlString(f.filial)}, ${escapeSqlString(f.razaoSocial)}, ${escapeSqlString(f.nomeFantasia || null)}, ${escapeSqlString(f.cnpj || null)}, ${escapeSqlString(f.ie || null)}, ${escapeSqlString(f.im || null)}, ${escapeSqlString(f.cnae || null)}, ${escapeSqlString(f.regimeTributario || null)}, ${escapeSqlString(f.dataAbertura || null)}, ${escapeSqlString(f.cep || null)}, ${escapeSqlString(f.logradouro || null)}, ${escapeSqlString(f.numero || null)}, ${escapeSqlString(f.complemento || null)}, ${escapeSqlString(f.bairro || null)}, ${escapeSqlString(f.cidade || null)}, ${escapeSqlString(f.uf || null)}, ${escapeSqlString(f.telefone || null)}, ${escapeSqlString(f.telefoneSecundario || null)}, ${escapeSqlString(f.email || null)}, ${escapeSqlString(f.responsavel || null)}, ${escapeSqlString(f.cargoResponsavel || null)}, ${escapeSqlString(f.rede || null)}, ${escapeSqlString(f.gateway || null)}, ${escapeSqlString(f.dns || null)}, ${escapeSqlString(f.provedorInternet || null)}, ${escapeSqlString(f.observacoes || null)}, ${f.ativo ? 1 : 0}, ${escapeSqlString(f.dataDesativacao || null)})`).join(',\n')};

-- 3. Inserir Colaboradores
INSERT INTO \`colaboradores\` (
  \`id\`, \`nome_completo\`, \`exibicao\`, \`cpf\`, \`rg\`, \`matricula\`, \`data_nascimento\`, 
  \`cargo\`, \`setor\`, \`email\`, \`telefone\`, \`data_admissao\`, \`status\`, 
  \`avatar_color\`, \`empresa\`, \`filial\`
) VALUES
${colaboradores.map(c => `(${escapeSqlString(c.id)}, ${escapeSqlString(c.nomeCompleto)}, ${escapeSqlString(c.exibicao)}, ${escapeSqlString(c.cpf)}, ${escapeSqlString(c.rg)}, ${escapeSqlString(c.matricula || null)}, ${escapeSqlString(c.dataNascimento)}, ${escapeSqlString(c.cargo)}, ${escapeSqlString(c.setor)}, ${escapeSqlString(c.email)}, ${escapeSqlString(c.telefone)}, ${escapeSqlString(c.dataAdmissao)}, ${escapeSqlString(c.status)}, ${escapeSqlString(c.avatarColor)}, ${escapeSqlString(c.empresa)}, ${escapeSqlString(c.filial)})`).join(',\n')};

-- 3. Inserir Equipamentos
INSERT INTO \`equipamentos\` (
  \`id\`, \`nome\`, \`tipo\`, \`numero_serie\`, \`patrimonio\`, \`marca_modelo\`, 
  \`status\`, \`data_aquisicao\`, \`colaborador_id\`, \`empresa\`, \`observacoes\`
) VALUES
${equipamentos.map(e => `(${escapeSqlString(e.id)}, ${escapeSqlString(e.nome)}, ${escapeSqlString(e.tipo)}, ${escapeSqlString(e.numeroSerie)}, ${escapeSqlString(e.patrimonio)}, ${escapeSqlString(e.marcaModelo)}, ${escapeSqlString(e.status)}, ${escapeSqlString(e.dataAquisicao)}, ${e.colaboradorId ? escapeSqlString(e.colaboradorId) : 'NULL'}, ${escapeSqlString(e.empresa)}, ${escapeSqlString(e.observacoes)})`).join(',\n')};

-- 4. Inserir Histórico de Movimentação dos Equipamentos
${equipamentos.filter(e => e.historico && e.historico.length > 0).flatMap(e => e.historico!.map(h => {
  const dataIso = h.data ? h.data.replace('T', ' ').replace('Z', '').split('.')[0] : dateStr;
  return `INSERT INTO \`historico_equipamentos\` (\`id\`, \`equipamento_id\`, \`data\`, \`acao\`, \`descricao\`, \`usuario\`) VALUES (${escapeSqlString(h.id)}, ${escapeSqlString(e.id)}, ${escapeSqlString(dataIso)}, ${escapeSqlString(h.acao)}, ${escapeSqlString(h.descricao)}, ${escapeSqlString(h.usuario)});`;
})).join('\n')}

-- 5. Inserir Notas Fiscais
INSERT INTO \`notas_fiscais\` (
  \`id\`, \`numero\`, \`emissor\`, \`data_emissao\`, \`data_cadastro\`, \`valor_total_nota\`, \`empresa\`, \`filial\`, \`contrato\`, \`observacoes\`
) VALUES
${notasFiscais.map(nf => {
  const cadastroIso = nf.dataCadastro ? nf.dataCadastro.replace('T', ' ').replace('Z', '').split('.')[0] : dateStr;
  return `(${escapeSqlString(nf.id)}, ${escapeSqlString(nf.numero)}, ${escapeSqlString(nf.emissor)}, ${escapeSqlString(nf.dataEmissao)}, ${escapeSqlString(cadastroIso)}, ${nf.valorTotalNota}, ${escapeSqlString(nf.empresa)}, ${escapeSqlString(nf.filial || null)}, ${escapeSqlString(nf.contrato || null)}, ${escapeSqlString(nf.observacoes)})`;
}).join(',\n')};

-- 6. Inserir Itens das Notas Fiscais
INSERT INTO \`nota_fiscal_itens\` (
  \`id\`, \`nota_fiscal_id\`, \`quantidade\`, \`descricao\`, \`valor_unitario\`, \`valor_total\`
) VALUES
${notasFiscais.flatMap(nf => nf.itens.map(item => `(${escapeSqlString(item.id)}, ${escapeSqlString(nf.id)}, ${item.quantidade}, ${escapeSqlString(item.descricao)}, ${item.valorUnitario}, ${item.valorTotal})`)).join(',\n')};

-- 7. Inserir Anexos das Notas Fiscais
${notasFiscais.flatMap(nf => {
  const list: string[] = [];
  if (nf.notaFiscalFile) {
    list.push(`INSERT INTO \`nota_fiscal_anexos\` (\`nota_fiscal_id\`, \`tipo_anexo\`, \`nome_arquivo\`, \`tamanho_bytes\`, \`tipo_mime\`, \`conteudo_base64\`) VALUES (${escapeSqlString(nf.id)}, 'Principal', ${escapeSqlString(nf.notaFiscalFile.name)}, ${nf.notaFiscalFile.size}, ${escapeSqlString(nf.notaFiscalFile.type)}, ${escapeSqlString(nf.notaFiscalFile.base64 || null)});`);
  }
  if (nf.outrosArquivos && nf.outrosArquivos.length > 0) {
    nf.outrosArquivos.forEach(o => {
      list.push(`INSERT INTO \`nota_fiscal_anexos\` (\`nota_fiscal_id\`, \`tipo_anexo\`, \`nome_arquivo\`, \`tamanho_bytes\`, \`tipo_mime\`, \`conteudo_base64\`) VALUES (${escapeSqlString(nf.id)}, 'Outro', ${escapeSqlString(o.name)}, ${o.size}, ${escapeSqlString(o.type)}, ${escapeSqlString(o.base64 || null)});`);
    });
  }
  return list;
}).join('\n')}

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- ==============================================================================
-- FIM DO SCRIPT DE BANCO DE DADOS MYSQL
-- ==============================================================================
`;
}

/**
 * Initiates browser download of the generated SQL file
 */
export function downloadMySQLFile(
  colaboradores?: Colaborador[],
  equipamentos?: Equipamento[],
  notasFiscais?: NotaFiscal[],
  userSettings?: UserSettings,
  empresasFiliais?: EmpresaFilial[]
) {
  const sqlContent = generateMySQLScript(colaboradores, equipamentos, notasFiscais, userSettings, empresasFiliais);
  const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bio_gestao_db.sql';
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
