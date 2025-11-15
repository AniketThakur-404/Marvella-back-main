const { PrismaClient } = require('@prisma/client/wasm');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const globalForPrisma = globalThis;

const buildPool = () =>
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  });

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
