require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const { Pool, neonConfig } = require("@neondatabase/serverless");
const { PrismaNeon } = require("@prisma/adapter-neon");
const ws = require("ws");

if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const dotenvResult = require('dotenv').config();
console.log("dotenv result:", dotenvResult);
console.log("process.env.DATABASE_URL is:", process.env.DATABASE_URL ? "Defined" : "Undefined");

const connectionString = process.env.DATABASE_URL || "";
console.log("Connection string being used:", connectionString.replace(/:[^@/]+@/, ':****@')); // mask password
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true }
  });
  console.log("Current Users in DB:", JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Failed to fetch users:", e);
  process.exit(1);
});
