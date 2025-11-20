const { PrismaClient } = require('@prisma/client/wasm');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const globalForPrisma = globalThis;

const resolveDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL must be set before initializing Prisma. Create Marvelle-Backend/.env (or export the variable) and run npm install again.'
    );
  }
  return url;
};

const buildPool = () => {
  const connectionString = resolveDatabaseUrl();

  return new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  });
};

const pool = globalForPrisma.__marvellaPgPool || buildPool();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__marvellaPgPool = pool;
}

const prisma =
  globalForPrisma.__marvellaPrisma ||
  new PrismaClient({
    adapter: new PrismaPg(pool),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__marvellaPrisma = prisma;
}

const getPrisma = async () => prisma;

const disconnect = async () => {
  await prisma.$disconnect();

  await pool.end();
};

module.exports = {
  getPrisma,
  disconnect,
};
