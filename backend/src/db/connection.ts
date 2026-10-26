import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ─── Guard: fail fast if required DB env vars are missing ────────────────────
const requiredEnv = ['PG_HOST', 'PG_USER', 'PG_PASSWORD', 'PG_DATABASE'] as const;
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      'Copy .env.example to .env and set all required values before starting the server.'
    );
  }
}

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: {
    // NOTE: rejectUnauthorized is false because Supabase's connection pooler
    // uses a self-signed certificate on the pooler endpoint. In a production
    // setup with a direct PostgreSQL connection you should set this to true
    // and supply the server CA certificate via PG_SSL_CA env var.
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute parameterized query with connection pool.
 * Automatically releases client back to the pool.
 */
export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('⚡ Executed query', { text: text.slice(0, 60), duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
};

export default pool;
