import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

interface ConnectionParams {
  host?: string;
  port?: number | string;
  user?: string;
  password?: string;
  database?: string;
}

function parseMySQLDiagnostic(err: any, params: ConnectionParams): { message: string; tip?: string } {
  const code = err.code || '';
  const message = err.message || '';
  const host = params.host || '100.24.209.39';
  const port = params.port || 3306;
  const user = params.user || 'root';

  if (code === 'ETIMEDOUT' || message.includes('ETIMEDOUT') || message.includes('timed out')) {
    return {
      message: `Tempo limite de conexão esgotado (Timeout) ao tentar conectar em ${host}:${port}.`,
      tip: `O servidor remoto em ${host} não respondeu na porta ${port}. Possíveis causas:\n1. Firewall (iptables / UFW) ou Security Group da nuvem (AWS/GCP/OCI) bloqueando a porta 3306 de entrada.\n2. O MySQL não está ouvindo em 0.0.0.0 (está ouvindo apenas em 127.0.0.1 no my.cnf: 'bind-address = 0.0.0.0').\n3. Rota ou IP público inacessível.`
    };
  }

  if (code === 'ECONNREFUSED' || message.includes('ECONNREFUSED')) {
    return {
      message: `Conexão recusada em ${host}:${port}.`,
      tip: `O host ${host} foi localizado, mas a porta ${port} recusou a conexão. Verifique se o serviço MySQL está em execução ('systemctl status mysql') e se a porta configurada é realmente a ${port}.`
    };
  }

  if (code === 'ER_ACCESS_DENIED_ERROR' || message.includes('Access denied')) {
    return {
      message: `Acesso negado para o usuário '${user}'@'%'.`,
      tip: `Usuário ou senha incorretos, ou o usuário '${user}' não tem permissão para logar a partir de hosts remotos ('%').\nPara liberar o root ou criar usuário remoto no MySQL:\nCREATE USER '${user}'@'%' IDENTIFIED BY 'sua_senha';\nGRANT ALL PRIVILEGES ON *.* TO '${user}'@'%' WITH GRANT OPTION;\nFLUSH PRIVILEGES;`
    };
  }

  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    return {
      message: `Não foi possível resolver o endereço do host '${host}'.`,
      tip: `Verifique se o IP ou hostname digitado está correto.`
    };
  }

  if (code === 'ER_BAD_DB_ERROR' || message.includes('Unknown database')) {
    return {
      message: `Banco de dados '${params.database}' não encontrado no servidor.`,
      tip: `A autenticação funcionou, mas a base de dados '${params.database}' ainda não foi criada. Conecte-se sem especificar banco de dados para criá-lo via comando 'CREATE DATABASE ${params.database}'.`
    };
  }

  return {
    message: err.message || 'Erro desconhecido ao conectar ao banco de dados MySQL.',
    tip: `Código retornado: ${code || 'N/A'}. Verifique os parâmetros e o log do servidor MySQL.`
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // API Route: Current Config & defaults
  app.get('/api/mysql/config', (req: Request, res: Response) => {
    res.json({
      defaultHost: process.env.MYSQL_HOST || '100.24.209.39',
      defaultPort: Number(process.env.MYSQL_PORT) || 3306,
      defaultUser: process.env.MYSQL_USER || 'root',
      hasEnvPassword: Boolean(process.env.MYSQL_PASSWORD),
      defaultDatabase: process.env.MYSQL_DATABASE || ''
    });
  });

  // API Route: Test MySQL Connection
  app.post('/api/mysql/test', async (req: Request, res: Response) => {
    const { 
      host = '100.24.209.39', 
      port = 3306, 
      user = 'root', 
      password = '', 
      database = '' 
    }: ConnectionParams = req.body || {};

    const startTime = Date.now();
    let connection: mysql.Connection | null = null;

    try {
      connection = await mysql.createConnection({
        host: String(host).trim(),
        port: Number(port) || 3306,
        user: String(user).trim(),
        password: String(password),
        database: database && String(database).trim() ? String(database).trim() : undefined,
        connectTimeout: 8000,
        ssl: undefined
      });

      const latencyMs = Date.now() - startTime;

      // Basic server info
      const [infoRows] = await connection.query<any[]>(
        'SELECT 1 AS ok, VERSION() AS version, CURRENT_USER() AS currentUser, NOW() AS serverTime, DATABASE() AS activeDatabase'
      );
      const serverInfo = infoRows[0] || {};

      // List available databases
      let databases: string[] = [];
      try {
        const [dbRows] = await connection.query<any[]>('SHOW DATABASES');
        databases = dbRows.map((row: any) => Object.values(row)[0] as string);
      } catch (e) {
        console.warn('Could not list databases:', e);
      }

      // List tables if database specified
      let tables: { name: string; rows?: number }[] = [];
      if (database && String(database).trim()) {
        try {
          const [tableRows] = await connection.query<any[]>('SHOW TABLES');
          tables = tableRows.map((row: any) => ({
            name: Object.values(row)[0] as string
          }));
        } catch (e) {
          console.warn('Could not list tables:', e);
        }
      }

      await connection.end();

      return res.json({
        success: true,
        latencyMs,
        serverInfo: {
          version: serverInfo.version || 'Desconhecida',
          currentUser: serverInfo.currentUser || user,
          serverTime: serverInfo.serverTime || new Date().toISOString(),
          activeDatabase: serverInfo.activeDatabase || database || null
        },
        databases,
        tables,
        message: `Conexão estabelecida com sucesso ao MySQL em ${host}:${port}!`
      });
    } catch (err: any) {
      if (connection) {
        try {
          await connection.end();
        } catch {}
      }

      const latencyMs = Date.now() - startTime;
      const diagnostic = parseMySQLDiagnostic(err, { host, port, user, password, database });

      return res.status(400).json({
        success: false,
        latencyMs,
        error: {
          code: err.code || 'UNKNOWN_ERROR',
          errno: err.errno,
          sqlState: err.sqlState,
          sqlMessage: err.sqlMessage || err.message,
          message: diagnostic.message,
          tip: diagnostic.tip
        }
      });
    }
  });

  // API Route: List Databases
  app.post('/api/mysql/databases', async (req: Request, res: Response) => {
    const { host = '100.24.209.39', port = 3306, user = 'root', password = '' }: ConnectionParams = req.body || {};
    let connection: mysql.Connection | null = null;
    try {
      connection = await mysql.createConnection({
        host: String(host).trim(),
        port: Number(port) || 3306,
        user: String(user).trim(),
        password: String(password),
        connectTimeout: 8000
      });
      const [rows] = await connection.query<any[]>('SHOW DATABASES');
      await connection.end();
      const databases = rows.map((r: any) => Object.values(r)[0] as string);
      return res.json({ success: true, databases });
    } catch (err: any) {
      if (connection) {
        try { await connection.end(); } catch {}
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // API Route: Execute DDL or Create Database
  app.post('/api/mysql/execute-ddl', async (req: Request, res: Response) => {
    const { 
      host = '100.24.209.39', 
      port = 3306, 
      user = 'root', 
      password = '', 
      database = '',
      createDbIfNotExists = false,
      sql = ''
    } = req.body || {};

    let connection: mysql.Connection | null = null;
    try {
      connection = await mysql.createConnection({
        host: String(host).trim(),
        port: Number(port) || 3306,
        user: String(user).trim(),
        password: String(password),
        connectTimeout: 8000,
        multipleStatements: true
      });

      if (createDbIfNotExists && database) {
        const cleanDbName = String(database).replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanDbName) {
          await connection.query(`CREATE DATABASE IF NOT EXISTS \`${cleanDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
          await connection.query(`USE \`${cleanDbName}\`;`);
        }
      } else if (database) {
        await connection.query(`USE \`${String(database).replace(/[^a-zA-Z0-9_]/g, '')}\`;`);
      }

      if (sql && String(sql).trim()) {
        await connection.query(String(sql));
      }

      await connection.end();
      return res.json({ success: true, message: 'Script executado com sucesso no MySQL!' });
    } catch (err: any) {
      if (connection) {
        try { await connection.end(); } catch {}
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // Helper to format date into YYYY-MM-DD
  function formatDate(d: any): string {
    if (!d) return '2023-01-01';
    if (d instanceof Date) {
      return d.toISOString().split('T')[0];
    }
    const str = String(d).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const parts = str.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return str.substring(0, 10);
  }

  // API Route: Query Active Collaborators from tb_colaborador (ativo = 1)
  app.post('/api/mysql/colaboradores', async (req: Request, res: Response) => {
    const { 
      host = '100.24.209.39', 
      port = 3306, 
      user = 'root', 
      password = '', 
      database = '',
      createIfMissing = false
    } = req.body || {};

    let connection: mysql.Connection | null = null;
    try {
      connection = await mysql.createConnection({
        host: String(host).trim(),
        port: Number(port) || 3306,
        user: String(user).trim(),
        password: String(password),
        connectTimeout: 8000,
        multipleStatements: true
      });

      // If database not explicitly provided, search for database that contains tb_colaborador
      let activeDb = database ? String(database).replace(/[^a-zA-Z0-9_]/g, '') : '';
      if (!activeDb) {
        try {
          const [dbLookup] = await connection.query<any[]>(
            `SELECT table_schema FROM information_schema.tables 
             WHERE table_name IN ('tb_colaborador', 'tb_colaboradores', 'colaboradores') 
             AND table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys') 
             ORDER BY CASE WHEN table_name = 'tb_colaborador' THEN 1 ELSE 2 END, create_time DESC LIMIT 1;`
          );
          if (dbLookup && dbLookup.length > 0) {
            activeDb = dbLookup[0].table_schema;
          }
        } catch (e) {
          console.warn('Database auto-detection error:', e);
        }
      }

      if (!activeDb) {
        activeDb = 'colaboradores_db';
      }

      // Ensure database exists and select it
      try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${activeDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.query(`USE \`${activeDb}\`;`);
      } catch (errDb: any) {
        // Fallback to select without create
        try {
          await connection.query(`USE \`${activeDb}\`;`);
        } catch {}
      }

      // Check if tb_colaborador table exists (or fallback to tb_colaboradores/colaboradores)
      const [tableCheck] = await connection.query<any[]>(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = DATABASE() 
         AND table_name IN ('tb_colaborador', 'tb_colaboradores', 'colaboradores');`
      );

      let tableName = 'tb_colaborador';
      if (!tableCheck || tableCheck.length === 0) {
        if (createIfMissing) {
          // Create tb_colaborador with standard structure
          await connection.query(`
            CREATE TABLE IF NOT EXISTS tb_colaborador (
              id VARCHAR(64) PRIMARY KEY,
              nome_completo VARCHAR(255) NOT NULL,
              exibicao VARCHAR(100),
              cpf VARCHAR(20) UNIQUE,
              rg VARCHAR(20),
              matricula VARCHAR(50),
              data_nascimento DATE,
              cargo VARCHAR(100),
              setor VARCHAR(100),
              email VARCHAR(150),
              telefone VARCHAR(50),
              data_admissao DATE,
              ativo TINYINT(1) DEFAULT 1,
              empresa VARCHAR(100) DEFAULT 'Bio Brands',
              filial VARCHAR(100) DEFAULT 'Matriz',
              avatar_color VARCHAR(20) DEFAULT '#2563eb',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `);
        } else {
          await connection.end();
          return res.status(200).json({
            success: true,
            tableNotFound: true,
            database: activeDb,
            count: 0,
            colaboradores: [],
            message: `A tabela 'tb_colaborador' ainda não existe no banco de dados '${activeDb}'. Deseja criá-la agora?`
          });
        }
      } else {
        const found = tableCheck.find((t: any) => Object.values(t)[0] === 'tb_colaborador')
          || tableCheck.find((t: any) => Object.values(t)[0] === 'tb_colaboradores');
        tableName = found ? Object.values(found)[0] as string : Object.values(tableCheck[0])[0] as string;
      }

      // Query active rows from table
      let rawRows: any[] = [];
      try {
        const [rows] = await connection.query<any[]>(
          `SELECT * FROM \`${tableName}\` WHERE ativo = 1 OR fl_ativo = 1 OR status = 1 OR status = 'Ativo' OR status = 'ativo';`
        );
        rawRows = rows;
      } catch (errFilter) {
        // Fallback query if 'ativo' column doesn't exist
        const [fallbackRows] = await connection.query<any[]>(`SELECT * FROM \`${tableName}\`;`);
        rawRows = fallbackRows;
      }

      // Map rows into strict Colaborador format with status: 'Ativo'
      const colaboradores = rawRows.filter((r: any) => {
        if (r.ativo !== undefined) return r.ativo === 1 || r.ativo === '1' || r.ativo === true;
        if (r.fl_ativo !== undefined) return r.fl_ativo === 1 || r.fl_ativo === '1' || r.fl_ativo === true;
        if (r.status !== undefined) return String(r.status).toLowerCase() === 'ativo' || r.status === 1 || r.status === '1';
        return true;
      }).map((r: any, idx: number) => {
        const nomeCompleto = String(r.nome_completo || r.nomeCompleto || r.nome || r.funcionario || 'Colaborador').trim();
        let exibicao = String(r.exibicao || r.nome_exibicao || r.nomeExibicao || r.apelido || '').trim();
        if (!exibicao) {
          const parts = nomeCompleto.split(' ');
          exibicao = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
        }

        return {
          id: String(r.id || r.id_colaborador || r.colaborador_id || `mysql_${idx}_${Date.now()}`),
          nomeCompleto,
          exibicao,
          cpf: String(r.cpf || r.num_cpf || '').trim(),
          rg: String(r.rg || r.num_rg || '').trim(),
          matricula: r.matricula ? String(r.matricula).trim() : undefined,
          dataNascimento: formatDate(r.data_nascimento || r.dt_nascimento || r.dataNascimento),
          cargo: String(r.cargo || r.funcao || 'Colaborador').trim(),
          setor: String(r.setor || r.departamento || 'Geral').trim(),
          email: String(r.email || r.e_mail || '').trim(),
          telefone: String(r.telefone || r.celular || r.fone || '').trim(),
          dataAdmissao: formatDate(r.data_admissao || r.dt_admissao || r.dataAdmissao),
          status: 'Ativo' as const,
          avatarColor: r.avatar_color || r.avatarColor || '#2563eb',
          empresa: (r.empresa && String(r.empresa).includes('Scientific') ? 'Bio Scientific' : 'Bio Brands') as 'Bio Brands' | 'Bio Scientific',
          filial: String(r.filial || 'Matriz').trim()
        };
      });

      await connection.end();

      return res.json({
        success: true,
        database: activeDb,
        table: tableName,
        count: colaboradores.length,
        colaboradores,
        message: `${colaboradores.length} colaborador(es) com status ativo = 1 carregado(s) com sucesso de ${activeDb}.${tableName}!`
      });
    } catch (err: any) {
      if (connection) {
        try { await connection.end(); } catch {}
      }
      const diagnostic = parseMySQLDiagnostic(err, { host, port, user, password, database });
      return res.status(400).json({
        success: false,
        error: diagnostic.message,
        tip: diagnostic.tip,
        rawError: err.message
      });
    }
  });

  // API Route: Create and Seed tb_colaborador with sample active collaborators
  const handleCreateTbColaborador = async (req: Request, res: Response) => {
    const { 
      host = '100.24.209.39', 
      port = 3306, 
      user = 'root', 
      password = '', 
      database = 'colaboradores_db',
      colaboradores = []
    } = req.body || {};

    let connection: mysql.Connection | null = null;
    try {
      connection = await mysql.createConnection({
        host: String(host).trim(),
        port: Number(port) || 3306,
        user: String(user).trim(),
        password: String(password),
        connectTimeout: 8000,
        multipleStatements: true
      });

      const cleanDbName = String(database).replace(/[^a-zA-Z0-9_]/g, '') || 'colaboradores_db';
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${cleanDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await connection.query(`USE \`${cleanDbName}\`;`);

      // Create tb_colaborador table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS tb_colaborador (
          id VARCHAR(64) PRIMARY KEY,
          nome_completo VARCHAR(255) NOT NULL,
          exibicao VARCHAR(100) NOT NULL,
          cpf VARCHAR(20) UNIQUE,
          rg VARCHAR(20),
          matricula VARCHAR(50),
          data_nascimento DATE,
          cargo VARCHAR(100),
          setor VARCHAR(100),
          email VARCHAR(150),
          telefone VARCHAR(50),
          data_admissao DATE,
          ativo TINYINT(1) DEFAULT 1,
          empresa VARCHAR(100) DEFAULT 'Bio Brands',
          filial VARCHAR(100) DEFAULT 'Matriz',
          avatar_color VARCHAR(20) DEFAULT '#2563eb',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Insert active collaborators if provided
      if (Array.isArray(colaboradores) && colaboradores.length > 0) {
        for (const c of colaboradores) {
          await connection.query(`
            INSERT INTO tb_colaborador 
            (id, nome_completo, exibicao, cpf, rg, matricula, data_nascimento, cargo, setor, email, telefone, data_admissao, ativo, empresa, filial, avatar_color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
              nome_completo = VALUES(nome_completo),
              exibicao = VALUES(exibicao),
              cargo = VALUES(cargo),
              setor = VALUES(setor),
              email = VALUES(email),
              telefone = VALUES(telefone),
              ativo = 1,
              empresa = VALUES(empresa),
              filial = VALUES(filial);
          `, [
            c.id,
            c.nomeCompleto,
            c.exibicao,
            c.cpf,
            c.rg,
            c.matricula || null,
            c.dataNascimento,
            c.cargo,
            c.setor,
            c.email,
            c.telefone,
            c.dataAdmissao,
            c.empresa,
            c.filial || 'Matriz',
            c.avatarColor || '#2563eb'
          ]);
        }
      }

      await connection.end();
      return res.json({ 
        success: true, 
        message: `Tabela 'tb_colaborador' criada com sucesso no banco '${cleanDbName}' com registros ativos (ativo = 1)!` 
      });
    } catch (err: any) {
      if (connection) {
        try { await connection.end(); } catch {}
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  app.post('/api/mysql/create-tb-colaborador', handleCreateTbColaborador);
  app.post('/api/mysql/create-tb-colaboradores', handleCreateTbColaborador);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
