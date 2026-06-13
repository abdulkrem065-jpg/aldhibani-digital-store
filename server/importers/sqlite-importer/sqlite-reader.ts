import initSqlJs from 'sql.js';

export interface SqliteTableInfo {
  name: string;
  columns: Array<{ name: string; type: string; notnull: boolean; pk: boolean }>;
  rowCount: number;
}

export class SqliteReader {
  private db: any = null;

  constructor(private fileBuffer: Buffer) {}

  /**
   * Initializes the SQL.js instance and loads the file buffer.
   */
  public async load(): Promise<void> {
    try {
      const SQL = await initSqlJs();
      this.db = new SQL.Database(this.fileBuffer);
    } catch (error: any) {
      throw new Error(`Failed to initialize SQLite parser: ${error.message}`);
    }
  }

  /**
   * Verified database integrity and returns if valid.
   */
  public verifyIntegrity(): boolean {
    if (!this.db) throw new Error('Database not loaded');
    try {
      const res = this.db.exec('PRAGMA integrity_check;');
      if (res && res[0] && res[0].values && res[0].values[0]) {
        return res[0].values[0][0] === 'ok';
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Extracts a list of all tables in the SQLite database along with row count and schema columns.
   */
  public async getTablesMetadata(): Promise<SqliteTableInfo[]> {
    if (!this.db) throw new Error('Database not loaded');
    
    const tablesRes = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    if (!tablesRes || tablesRes.length === 0) return [];

    const tableNames = tablesRes[0].values.map((v: any) => v[0]);
    const metadata: SqliteTableInfo[] = [];

    for (const name of tableNames) {
      if (name.startsWith('sqlite_') || name === 'android_metadata' || name === 'tmp_real') {
        continue; // skip internal/virtual engine tables
      }

      // 1. Get Row Count
      let rowCount = 0;
      try {
        const countRes = this.db.exec(`SELECT COUNT(*) FROM \`${name}\`;`);
        if (countRes && countRes[0]) {
          rowCount = countRes[0].values[0][0];
        }
      } catch (err) {
        // Virtual tables or missing permissions
        rowCount = 0;
      }

      // 2. Get Column Schemas
      const columns: Array<{ name: string; type: string; notnull: boolean; pk: boolean }> = [];
      try {
        const colRes = this.db.exec(`PRAGMA table_info(\`${name}\`);`);
        if (colRes && colRes[0]) {
          // values schema: [cid, name, type, notnull, dflt_value, pk]
          for (const row of colRes[0].values) {
            columns.push({
              name: row[1],
              type: row[2],
              notnull: row[3] === 1,
              pk: row[5] > 0
            });
          }
        }
      } catch (err) {
        // Ignore column read error for broken tables
      }

      metadata.push({ name, columns, rowCount });
    }

    return metadata;
  }

  /**
   * Retrieves all rows from a given table and returns them as array of JSON objects.
   */
  public getTableRows(tableName: string, limit?: number, offset?: number): any[] {
    if (!this.db) throw new Error('Database not loaded');

    let query = `SELECT * FROM \`${tableName}\``;
    if (limit !== undefined) {
      query += ` LIMIT ${limit}`;
    }
    if (offset !== undefined) {
      query += ` OFFSET ${offset}`;
    }

    try {
      const res = this.db.exec(query);
      if (!res || res.length === 0) return [];

      const columns = res[0].columns;
      return res[0].values.map((row: any[]) => {
        const obj: Record<string, any> = {};
        columns.forEach((col: string, idx: number) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    } catch (e: any) {
      console.error(`Error reading rows from table custom ${tableName}:`, e.message);
      return [];
    }
  }

  /**
   * Run custom arbitrary SQL query and return rows
   */
  public execQuery(query: string): any[] {
    if (!this.db) throw new Error('Database not loaded');
    try {
      const res = this.db.exec(query);
      if (!res || res.length === 0) return [];

      const columns = res[0].columns;
      return res[0].values.map((row: any[]) => {
        const obj: Record<string, any> = {};
        columns.forEach((col: string, idx: number) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    } catch (e: any) {
      console.error(`Error executing custom query "${query}":`, e.message);
      return [];
    }
  }

  /**
   * Closes db handles to free up memory.
   */
  public close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
