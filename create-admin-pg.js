require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const hash = await bcrypt.hash('Admin@123', 12);
  const id = 'cm0k' + Date.now().toString(36); // mock cuid
  
  await pool.query(
    `INSERT INTO "users" ("id", "email", "name", "password", "role", "isActive", "createdAt", "updatedAt") 
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [id, 'admin@vikramsolar.com', 'Super Admin', hash, 'SUPER_ADMIN', true]
  );
  
  console.log('Admin created successfully via pg pool!');
  await pool.end();
}

run().catch(console.error);
