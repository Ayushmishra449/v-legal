require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL || "";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = "admin@vikramsolar.com";
  const adminPassword = "Admin@123";
  const adminName = "Super Admin";

  const hashed = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      password: hashed,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`Successfully seeded Super Admin user: ${user.email}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seeding failed:", e);
  process.exit(1);
});
