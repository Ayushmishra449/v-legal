require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.create({
    data: {
      email: 'admin@vikramsolar.com',
      name: 'Super Admin',
      password: hash,
      role: 'SUPER_ADMIN'
    }
  });
  console.log('Admin created successfully in Neon DB!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
