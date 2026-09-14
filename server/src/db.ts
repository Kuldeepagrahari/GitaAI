import 'dotenv/config';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — copy .env.example to .env and fill it in.');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// docker run --name krishna-pg \
//   -e POSTGRES_PASSWORD=postgres \
//   -e POSTGRES_DB=krishna_app \
//   -p 5432:5432 \
//   -d postgres:16