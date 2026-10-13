const fs = require('fs');
const path = require('path');

const prismaDir = path.join(__dirname, '..', 'prisma');
const schemaPrisma = path.join(prismaDir, 'schema.prisma');
const schemaPg = path.join(prismaDir, 'schema.postgresql.prisma');
const schemaSqlite = path.join(prismaDir, 'schema.sqlite.prisma');

// Backup sqlite schema if not already saved
if (!fs.existsSync(schemaSqlite) && fs.existsSync(schemaPrisma)) {
  const currentContent = fs.readFileSync(schemaPrisma, 'utf8');
  if (currentContent.includes('provider = "sqlite"')) {
    fs.writeFileSync(schemaSqlite, currentContent, 'utf8');
  }
}

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres') || process.env.NODE_ENV === 'production' || process.env.RENDER;

if (isPostgres && fs.existsSync(schemaPg)) {
  console.log('⚡ Switching Prisma schema to PostgreSQL for production deployment...');
  fs.copyFileSync(schemaPg, schemaPrisma);
} else {
  console.log('⚡ Using SQLite schema for local development...');
}
