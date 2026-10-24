import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf-8');
        await pool.query(sql);
        console.log('✅ Tables short_users and short_urls migrated successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
