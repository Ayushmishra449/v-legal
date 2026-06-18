const { execSync } = require("child_process");

const ports = [5432, 5433];
const passwords = ["", "postgres", "admin", "root", "123456", "Admin@123", "password"];
const psqlPath = "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe";

console.log("Searching for local postgres connection...");

for (const port of ports) {
  for (const password of passwords) {
    try {
      // Set PGPASSWORD environment variable and run a query via psql with -w (no password prompt)
      const env = { ...process.env, PGPASSWORD: password };
      const command = `"${psqlPath}" -w -h localhost -p ${port} -U postgres -d postgres -c "SELECT 1" -t`;
      const result = execSync(command, { env, stdio: "pipe", timeout: 1000 }).toString().trim();
      if (result === "1") {
        console.log(`\n>>> SUCCESS! Found working local postgres:`);
        console.log(`Port: ${port}`);
        console.log(`User: postgres`);
        console.log(`Password: ${password ? password : "(none)"}`);
        console.log(`DATABASE_URL="postgresql://postgres:${password}@localhost:${port}/v-legal?schema=public"`);
        process.exit(0);
      }
    } catch (e) {
      // Connection failed, check next combination
    }
  }
}

console.log("\nFailed to connect to local Postgres with standard password attempts.");
process.exit(1);
