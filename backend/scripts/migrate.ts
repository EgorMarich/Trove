// scripts/migrate.ts
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import 'dotenv/config';

const MIGRATIONS_DIR = join(process.cwd(), 'db', 'migrations');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL не задан в .env');
    process.exit(1);
  }

  if (!existsSync(MIGRATIONS_DIR)) {
    console.error(`❌ Папка с миграциями не найдена: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('ℹ️  В db/migrations нет .sql файлов');
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();
  console.log('✅ Подключились к базе');

  try {
    for (const file of files) {
      const fullPath = join(MIGRATIONS_DIR, file);
      const sql = readFileSync(fullPath, 'utf8');

      console.log(`▶️  Применяю ${file}...`);
      try {
        await client.query(sql);
        console.log(`✅ ${file} — ок`);
      } catch (err) {
        console.error(`❌ Ошибка в ${file}:`);
        console.error(err);
        process.exit(1);
      }
    }

    console.log('\n🎉 Все миграции применены');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('💥 Непредвиденная ошибка:');
  console.error(err);
  process.exit(1);
});