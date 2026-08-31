import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db/connection.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const directory = path.join(root, 'migrations');
const files = fs.readdirSync(directory).filter(name => name.endsWith('.sql')).sort();

try {
  for (const file of files) {
    await pool.query(fs.readFileSync(path.join(directory, file), 'utf8'));
    console.log(`Applied ${file}`);
  }
} finally {
  await pool.end();
}
