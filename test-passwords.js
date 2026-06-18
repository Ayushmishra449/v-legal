const { execSync } = require("child_process");

const passwords = ["Ayush@#16", "Ayush#16", "Ayush@16", "postgres", "admin", "1234"];
const users = ["postgres", "ayush"];
const ports = [5432, 5433];
const psqlPath = "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe";

for (const port of ports) {
  for (const user of users) {
    for (const password of passwords) {
      try {
        const env = { ...process.env, PGPASSWORD: password };
        const command = `"${psqlPath}" -w -h localhost -p ${port} -U ${user} -d postgres -c "SELECT 1" -t`;
        const result = execSync(command, { env, stdio: "pipe", timeout: 2000 }).toString().trim();
        if (result === "1") {
          console.log(`SUCCESS with port: ${port}, user: ${user}, password: ${password}`);
          process.exit(0);
        }
      } catch (e) {
        console.log(`Failed: port=${port} user=${user} pass=${password} | Error: ${e.message}`);
      }
    }
  }
}
console.log("All combinations failed");

